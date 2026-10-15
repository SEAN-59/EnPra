import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const require=createRequire(import.meta.url),tick=()=>new Promise(setImmediate),Icon=()=>null;
function load(file,deps={},globals={}) {
  const js=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  const m={exports:{}};runInNewContext(js,{exports:m.exports,require:name=>{
    if(name==='react/jsx-runtime')return require(name);
    if(name==='lucide-react')return new Proxy({},{get:()=>Icon});
    assert(name in deps,'Unexpected dependency: '+name);return deps[name];
  },Response,URL,console,...globals});return m.exports;
}
function hooks(initial=[]) {
  const state=initial.slice(),refs=new Map(),effects=[];let index=0;
  return {state,effects,reset(){index=0;},react:{...React,
    useState(value){const slot=index++;if(!(slot in state))state[slot]=typeof value==='function'?value():value;return [state[slot],next=>state[slot]=typeof next==='function'?next(state[slot]):next];},
    useRef(value){const slot=index++;if(!refs.has(slot))refs.set(slot,{current:value});return refs.get(slot);},
    useEffect(effect){effects.push(effect);},useLayoutEffect(){},useContext:()=>state[0],useMemo:fn=>fn()
  }};
}
function findAll(tree,predicate) {
  if(Array.isArray(tree))return tree.flatMap(node=>findAll(node,predicate));
  if(!tree||typeof tree!=='object')return [];
  return [...(predicate(tree)?[tree]:[]),...findAll(tree.props?.children,predicate)];
}

test('published copy DOM replacement uses the browser document, not copy state',()=>{
  const h=hooks([{screens:{'home.landing':{title:{sourceText:'Old title',text:'New title'}}}}]);
  const text={nodeType:3,data:'Old title'};let observes=0;
  const {StaticCopyProvider}=load('../components/static-copy-provider.tsx',{react:h.react},{window:{location:{pathname:'/'}},document:{body:{nodeType:1},createTreeWalker(){let done=false;return {nextNode(){if(done)return null;done=true;return text;}};}},Node:{TEXT_NODE:3},NodeFilter:{SHOW_TEXT:4},MutationObserver:class{observe(){observes++;}disconnect(){}}});
  StaticCopyProvider({children:null});h.effects[1]();assert.equal(text.data,'New title');assert.equal(observes,1);
});

test('HTTP failure stops AI status spinner, and retry can recover the connection',async()=>{
  const h=hooks();let ok=false;
  const {AIConnectionStatus}=load('../components/ai-connection-status.tsx',{react:h.react},{fetch:async()=>({ok,json:async()=>ok?{connection:{status:'active'}}:{error:'Unavailable'}})});
  let tree=AIConnectionStatus({});h.effects.shift()();await tick();h.reset();tree=AIConnectionStatus({});
  assert.match(renderToStaticMarkup(tree),/상태 확인 실패/);assert.doesNotMatch(renderToStaticMarkup(tree),/상태 확인 중/);
  const retry=findAll(tree,node=>node.type==='button')[0];assert(retry);retry.props.onClick();
  ok=true;h.effects.length=0;h.reset();AIConnectionStatus({});h.effects.shift()();await tick();h.reset();tree=AIConnectionStatus({});
  assert.match(renderToStaticMarkup(tree),/연결됨/);assert.doesNotMatch(renderToStaticMarkup(tree),/상태 확인 실패/);
});

test('latest Voca list selection wins even when the older response arrives last',async()=>{
  const lists=[{id:1,title:'A',scope:'personal',wordCount:1},{id:2,title:'B',scope:'personal',wordCount:1}];
  const h=hooks([lists,null,[],false,false,null,null,null]),resolve={},history=[];
  const {VocaListBoard}=load('../components/voca-list-board.tsx',{react:h.react,'@/components/ui/toast':{toast:{add(){}}},'@/components/use-document-scroll-lock':{useDocumentScrollLock(){}},'@/lib/voca-learning':{}},{fetch:url=>new Promise(r=>resolve[url]=r),window:{location:{search:''},history:{replaceState:(_a,_b,url)=>history.push(url)}}});
  const tree=VocaListBoard(),buttons=findAll(tree,node=>node.type==='button'&&node.props.className?.includes('min-w-0 flex-1'));
  assert.equal(buttons.length,2);buttons[0].props.onClick();buttons[1].props.onClick();
  resolve['/api/vocabulary/list/2']({ok:true,text:async()=>JSON.stringify({list:lists[1],words:[]})});await tick();
  resolve['/api/vocabulary/list/1']({ok:true,text:async()=>JSON.stringify({list:lists[0],words:[]})});await tick();
  assert.equal(h.state[1].id,2);assert.equal(history.at(-1),'/voca/list?list=2');assert.equal(history.length,1);
});

for(const value of [null,[],1,'text']) test(`Writing proxy rejects ${JSON.stringify(value)} before auth or bridge access`,async()=>{
  const {POST}=load('../app/api/writing/route.ts',{'next/server':{},'@/app/chatgpt-auth':{getChatGPTUser:async()=>{throw new Error('No auth access expected');}}},{process:{env:{}}});
  assert.equal((await POST({json:async()=>value})).status,400);
});

test('home sign-in renders a top-level anchor, with no nested button/link',async()=>{
  const {default:Home}=load('../app/page.tsx',{'@/app/chatgpt-auth':{getChatGPTUser:async()=>null,chatGPTSignInPath:()=>'/signin-with-chatgpt',chatGPTSignOutPath:()=>'/signout-with-chatgpt'},'@/app/practice-dashboard':{PracticeDashboard:()=>null}});
  const html=renderToStaticMarkup(await Home());assert.match(html,/target="_top"/);assert.match(html,/ChatGPT로 학습 시작/);assert.doesNotMatch(html,/<button/);
});

function connectionRoute(fetch,user={userId:'fixture-user',displayName:'테스트 사용자'}) {
  return load('../app/api/ai-connection/route.ts',{'next/server':{},'@/app/chatgpt-auth':{getChatGPTUser:async()=>user}},{fetch,process:{env:{ENPRA_BRIDGE_URL:'https://fixture.invalid/',ENPRA_BRIDGE_SERVICE_TOKEN:'nonsecret-fixture-service-token'}}});
}

test('AI connection proxy preserves GET, start, and bodyless disconnect responses',async()=>{
  const calls=[],route=connectionRoute(async(url,options)=>{
    calls.push({url,...options});
    if(url.endsWith('/disconnect'))return new Response(null,{status:204});
    return Response.json(url.endsWith('/start')?{verificationUrl:'https://fixture.invalid/verify',userCode:'fixture-code'}:{connection:{status:'active'}});
  });
  assert.equal((await (await route.GET()).json()).connection.status,'active');
  assert.equal((await (await route.POST({json:async()=>({action:'start'})})).json()).userCode,'fixture-code');
  const disconnected=await route.POST({json:async()=>({action:'disconnect'})});
  assert.equal(disconnected.status,204);assert.equal(await disconnected.text(),'');assert.equal(disconnected.body,null);
  assert.deepEqual(calls.map(x=>[x.url,x.method]),[['https://fixture.invalid/api/connections/codex','GET'],['https://fixture.invalid/api/connections/codex/start','POST'],['https://fixture.invalid/api/connections/codex/disconnect','POST']]);
  assert(calls.every(x=>x.headers['X-EnPra-User-Id']==='fixture-user'&&x.headers['X-EnPra-User-Name']===encodeURIComponent('테스트 사용자')));
});

for(const status of [205,304])test(`AI connection proxy also preserves bodyless HTTP ${status}`,async()=>{
  const response=await connectionRoute(async()=>new Response(null,{status})).GET();
  assert.equal(response.status,status);assert.equal(await response.text(),'');assert.equal(response.body,null);
});

test('AI connection manager treats the proxied 204 as a successful disconnect',async()=>{
  const h=hooks([{status:'active'},null,false,false]),toasts=[],route=connectionRoute(async()=>new Response(null,{status:204}));
  const {AIConnectionManager}=load('../components/ai-connection-manager.tsx',{
    react:h.react,'@/components/ui/button':{Button:props=>React.createElement('button',props)},'@/components/ui/textarea':{Textarea:props=>React.createElement('textarea',props)},'@/components/ui/toast':{toast:{add:entry=>toasts.push(entry)}}
  },{fetch:async(_url,options)=>route.POST({json:async()=>JSON.parse(options.body)})});
  const disconnect=findAll(AIConnectionManager(),node=>node.props?.onClick&&renderToStaticMarkup(node).includes('연결 해제'))[0];
  assert(disconnect);await disconnect.props.onClick();
  assert.equal(h.state[0].status,'disconnected');assert.equal(h.state[1],null);assert.equal(h.state[3],false);
  assert.equal(toasts.length,1);assert.equal(toasts[0].type,'success');
});

for(const value of [null,[],1,'text',true])test(`AI connection proxy rejects invalid action body ${JSON.stringify(value)} without forwarding`,async()=>{
  const route=connectionRoute(async()=>{throw new Error('No bridge access expected');});
  assert.equal((await route.POST({json:async()=>value})).status,400);
});
