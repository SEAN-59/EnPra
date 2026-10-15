import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import ts from 'typescript';
import {Hono} from 'hono';
import {cors} from 'hono/cors';
import {HTTPException} from 'hono/http-exception';
import * as personal from '../dist/personal-vocabulary.js';
import {describeAiFailure} from '../dist/ai-errors.js';

const require=createRequire(import.meta.url),result=(rows=[])=>({rows,rowCount:rows.length});
function harness() {
  const entries=new Map(), identities=new Map([['apple',{id:1,word:'apple',pronunciation_ipa:'/canonical/'}]]);
  const state={account:null,status:'active',accountError:false,isAdmin:false,queries:[],codexRequests:[],globalWrites:[],privateWrites:[]};
  class Pool {
    async query(sql,v=[]) {
      state.queries.push(sql);
      if (sql.startsWith('INSERT INTO users') || /^(BEGIN|COMMIT|ROLLBACK)$/.test(sql)) return result();
      if (sql.startsWith('SELECT role FROM users')) return result([{role:state.isAdmin?'admin':'user'}]);
      if (sql.includes('SELECT status, plan_type')) return result([{status:state.status}]);
      if (sql.startsWith('INSERT INTO connections')) {state.status=v[2];return result();}
      if (sql.includes('SELECT id FROM vocabulary_lists')) return result([{id:2}]);
      if (sql.includes('SELECT COALESCE(MAX(sort_order)')) return result([{next_sort:0}]);
      if (sql.startsWith('INSERT INTO vocabulary_words')) {
        assert.equal(v.length,1,'global identity gets no private pronunciation/meaning');
        state.globalWrites.push(v);
        if(!identities.has(v[0]))identities.set(v[0],{id:identities.size+1,word:v[0],pronunciation_ipa:'—'});
        return result([{id:identities.get(v[0]).id}]);
      }
      if(sql.startsWith('INSERT INTO user_vocabulary_entries')) {
        const key=v[0]+':'+v[1];const old=entries.get(key);
        const senses=[...(old?.senses_json??[]),...JSON.parse(v[4])];
        entries.set(key,{word_id:v[1],word:v[2],pronunciation_ipa:v[3],senses_json:senses});state.privateWrites.push(v);return result();
      }
      if(sql.startsWith('SELECT word_id,word,pronunciation_ipa,senses_json'))return result(v[1].flatMap(id=>entries.has(v[0]+':'+id)?[entries.get(v[0]+':'+id)]:[]));
      if(sql.includes('INSERT INTO vocabulary_list_items'))return result([{}]);
      if(sql.startsWith('SELECT l.id, l.title'))return result([{id:v[1],title:'List',scope:v[1]===1?'common':'personal',list_type:'custom',word_count:1}]);
      if(sql.startsWith('SELECT w.id, w.word'))return result([{...identities.get('apple'),sort_order:0}]);
      if(sql.startsWith('SELECT s.word_id'))return result([{word_id:1,part_of_speech:'n',meaning_ko:'사과',sort_order:0}]);
      throw new Error('Unexpected test SQL: '+sql.slice(0,80));
    }
    async connect(){return {query:this.query.bind(this),release(){}};}
  }
  const source=readFileSync(new URL('../src/server.ts',import.meta.url),'utf8');
  assert.match(source,/\ninitializeDatabase\(\)\n/);
  const code=ts.transpileModule(source.replace(/\ninitializeDatabase\(\)\n[\s\S]*$/,'')+'\nexport {app};',{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};
  const deps={
    '@hono/node-server':{serve(){throw new Error('No real listener allowed');}},
    'node:crypto':require('node:crypto'),'node:fs':{...require('node:fs'),mkdirSync(){}},'node:path':require('node:path'),hono:{Hono},'hono/cors':{cors},'hono/http-exception':{HTTPException},pg:{Pool},
    './codex.js':{CodexRegistry:class{get(){return {
      readAccount:async()=>{state.codexRequests.push('readAccount');if(state.accountError)throw new Error('Simulated service failure');return state.account;},
      startDeviceLogin:async()=>{state.codexRequests.push('startDeviceLogin');return {verificationUrl:'https://fixture.invalid/verify',userCode:'fixture-code'};},
      runLearningPrompt:async()=>{state.codexRequests.push('runLearningPrompt');return {text:'Fixture answer'};}
    };}async disconnect(){state.codexRequests.push('disconnect');state.account=null;}}},
    './personal-vocabulary.js':personal,'./ai-errors.js':{describeAiFailure},'./ui-copy-catalog.js':{UI_COPY_ENTRIES:[],UI_COPY_SCREENS:[]},
    './writing.js':{initializeWritingDatabase(){},registerWritingRoutes(){}},
    './vocabulary-learning.js':{initializeVocabularyLearningDatabase(){},registerVocabularyLearningRoutes(){},saveVocabularyWordStatus(){}}
  };
  runInNewContext(code,{exports:module.exports,require:name=>{assert(name in deps);return deps[name];},Response,Buffer,console:{...console,error(){}},process:{env:{DATABASE_URL:'unused-audit-database',ENPRA_BRIDGE_SERVICE_TOKEN:'nonsecret-fixture-service-token-000000000000',ENPRA_DATA_DIR:'/not-created'},cwd:()=>'/not-created'}});
  return {state,identities,entries,async request(path,body,user='a',raw=false){
    const response=await module.exports.app.request('http://fixture/api'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json','X-EnPra-Service-Token':'nonsecret-fixture-service-token-000000000000','X-EnPra-User-Id':user,'X-EnPra-User-Name':'Fixture'},body:body===undefined?undefined:raw?body:JSON.stringify(body)});
    const text=await response.text();return {status:response.status,body:text?JSON.parse(text):null};
  }};
}

test('both manual entry routes isolate equivalent headword meanings and IPA by authenticated user',async()=>{
  const h=harness();
  assert.equal((await h.request('/vocabulary/lists/manual-entries',{listId:2,words:[{word:'Apple',pronunciationIpa:'/private-a/',senses:[{partOfSpeech:'n',text:'A only'}]}]},'a')).status,200);
  assert.equal((await h.request('/vocabulary/words',{word:'Ａｐｐｌｅ',pronunciationIpa:'/private-b/',senses:[{partOfSpeech:'n',text:'B only'}]},'b')).status,200);
  const a=await h.request('/vocabulary/lists/2',undefined,'a'),b=await h.request('/vocabulary/lists/3',undefined,'b'),common=await h.request('/vocabulary/lists/1',undefined,'b');
  assert.equal(a.body.words[0].pronunciationIpa,'/private-a/');assert.equal(b.body.words[0].pronunciationIpa,'/private-b/');
  assert(a.body.words[0].meanings.some(x=>x.text==='A only'));assert(!a.body.words[0].meanings.some(x=>x.text==='B only'));
  assert(!JSON.stringify(common.body).includes('only'));assert.equal(common.body.words[0].pronunciationIpa,'/canonical/');
  assert.equal(h.identities.size,1);assert.equal(h.state.privateWrites.length,2);
});

test('new private headwords leave only neutral shared identity, never a private IPA',async()=>{
  const h=harness();await h.request('/vocabulary/words',{word:'PrivatePhrase',pronunciationIpa:'/owner-only/',senses:[{partOfSpeech:'phrase',text:'Owner-only meaning'}]});
  assert.equal(h.identities.get('privatephrase').pronunciation_ipa,'—');assert(!JSON.stringify([...h.identities]).includes('owner-only'));
});

test('missing ChatGPT account changes active status to disconnected',async()=>{
  const h=harness(),r=await h.request('/connections/codex');assert.equal(r.status,200);assert.equal(r.body.connection.status,'disconnected');assert.equal(h.state.status,'disconnected');
});
test('pending device login remains pending, while a service failure never reports active',async()=>{
  const h=harness();h.state.status='pending';assert.equal((await h.request('/connections/codex')).body.connection.status,'pending');
  h.state.status='active';h.state.accountError=true;const failure=await h.request('/connections/codex');assert.equal(failure.status,500);assert.equal(failure.body.connection,undefined);
});
test('live ChatGPT account still refreshes a healthy active connection',async()=>{
  const h=harness();h.state.account={type:'chatgpt',planType:'plus'};const r=await h.request('/connections/codex');assert.equal(r.status,200);assert.equal(r.body.connection.status,'active');
});

test('connection device login and disconnect retain their bridge response contracts',async()=>{
  const h=harness();
  const start=await h.request('/connections/codex/start',{});
  assert.equal(start.status,200);assert.equal(start.body.verificationUrl,'https://fixture.invalid/verify');assert.equal(start.body.userCode,'fixture-code');assert.equal(h.state.status,'pending');
  const disconnected=await h.request('/connections/codex/disconnect',{});
  assert.equal(disconnected.status,204);assert.equal(disconnected.body,null);assert.equal(h.state.status,'disconnected');assert.deepEqual(h.state.codexRequests,['startDeviceLogin','disconnect']);
});

for(const path of ['/admin/copy','/vocabulary/lists/manual-entries','/vocabulary/words','/vocabulary/words/1/status','/ai/respond']) {
  for(const body of [null,[],1,'text',true]) test(`${path} rejects non-object JSON ${JSON.stringify(body)} without feature writes or Codex access`,async()=>{
    const h=harness();h.state.isAdmin=true;
    const response=await h.request(path,body);
    assert.equal(response.status,400);assert.equal(typeof response.body.error,'string');
    assert.deepEqual(h.state.codexRequests,[]);assert.deepEqual(h.state.globalWrites,[]);assert.deepEqual(h.state.privateWrites,[]);
    assert(h.state.queries.every(sql=>sql.startsWith('INSERT INTO users')||sql.startsWith('SELECT role FROM users')),'only authenticated identity upsert and admin permission check are allowed');
  });
  test(`${path} rejects malformed JSON without feature writes or Codex access`,async()=>{
    const h=harness();h.state.isAdmin=true;
    assert.equal((await h.request(path,'{','a',true)).status,400);
    assert.deepEqual(h.state.codexRequests,[]);
    assert(h.state.queries.every(sql=>sql.startsWith('INSERT INTO users')||sql.startsWith('SELECT role FROM users')));
  });
}

test('copy-management authorization is checked before parsing or writing an admin request',async()=>{
  const h=harness();assert.equal((await h.request('/admin/copy',null)).status,403);
  assert(h.state.queries.every(sql=>sql.startsWith('INSERT INTO users')||sql.startsWith('SELECT role FROM users')));
});

test('a valid AI request still checks the account and returns the learning answer',async()=>{
  const h=harness();h.state.account={type:'chatgpt',planType:'plus'};
  const response=await h.request('/ai/respond',{input:'Explain this word',context:'Vocabulary'});
  assert.equal(response.status,200);assert.equal(response.body.text,'Fixture answer');assert.deepEqual(h.state.codexRequests,['readAccount','runLearningPrompt']);
});
