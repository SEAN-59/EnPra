// Opt-in: clone approved public data into an owned schema, then roll everything back.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
import {Hono} from 'hono';
import {initializePersonalVocabularyDatabase,legacyVocabularyDigestSql,savePersonalVocabulary} from '../dist/personal-vocabulary.js';
import {initializeVocabularyLearningDatabase,registerVocabularyLearningRoutes} from '../dist/vocabulary-learning.js';

assert(process.argv.includes('--run'),'Pass --run for the isolated upgrade fixture.');
const client=new pg.Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:8000});
const schema=`voca_upgrade_${randomUUID().replaceAll('-','')}`;
const raceSchema=`${schema}_lock`;
const userA=`upgrade:${randomUUID()}`,userB=`upgrade:${randomUUID()}`;
const tables=['vocabulary_words','vocabulary_senses','vocabulary_lists','vocabulary_list_items','user_vocabulary_word_status','user_vocabulary_list_subscriptions'];
let checks=0,step='connect',rollbackVerified=false,raceSchemaCreated=false;
const check=(actual,expected,label)=>{step=label??step;assert.deepEqual(actual,expected,label);checks++;};
let savepoint=0;
const stack=[];
const db={async query(sql,values){
  if(sql==='BEGIN'){const point=`route_${++savepoint}`;stack.push(point);return client.query(`SAVEPOINT ${point}`);}
  if(sql==='COMMIT')return client.query(`RELEASE SAVEPOINT ${stack.pop()}`);
  if(sql==='ROLLBACK'){const point=stack.pop();await client.query(`ROLLBACK TO SAVEPOINT ${point}`);return client.query(`RELEASE SAVEPOINT ${point}`);}
  return client.query(sql,values);
},async connect(){return {query:db.query,release(){}};}};
const digest=async()=> (await client.query(legacyVocabularyDigestSql)).rows[0].digest;
async function concurrentMigrationCheck(){
  step='concurrent migration lock';
  await client.query(`CREATE SCHEMA ${raceSchema}`);raceSchemaCreated=true;
  await client.query(`SET search_path TO ${raceSchema}`);
  await client.query('CREATE TABLE users(id TEXT PRIMARY KEY)');
  for(const table of tables.slice(0,4)){
    await client.query(`CREATE TABLE ${table} (LIKE public.${table} INCLUDING ALL)`);
    await client.query(`INSERT INTO ${table} OVERRIDING SYSTEM VALUE SELECT * FROM public.${table}`);
  }
  await client.query("SELECT setval(pg_get_serial_sequence($1,'id'),(SELECT MAX(id)+1 FROM vocabulary_words),FALSE)",[`${raceSchema}.vocabulary_words`]);
  await client.query('CREATE TABLE vocabulary_learning_sessions(id INTEGER)');
  const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,options:`-c search_path=${raceSchema}`,connectionTimeoutMillis:8000,max:2});
  let writer;
  try {
    // This is the same unpinned, autocommit Pool contract used by server startup.
    await initializePersonalVocabularyDatabase(pool);
    check((await pool.query('SELECT COUNT(*)::INTEGER n FROM vocabulary_words WHERE is_canonical')).rows[0].n,8100,'autocommit Pool approves exact baseline with empty snapshot table');
    await client.query('BEGIN');await initializePersonalVocabularyDatabase(client);
    writer=await pool.connect();const pid=(await writer.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    let settled=false;
    const write=writer.query("INSERT INTO vocabulary_words(word,normalized_word,pronunciation_ipa) VALUES('Public lock fixture','public lock fixture','/fixture/')");
    void write.then(()=>{settled=true;},()=>{settled=true;});
    let waiting=false;
    for(let i=0;i<40&&!waiting;i++){
      waiting=(await client.query('SELECT EXISTS(SELECT 1 FROM pg_locks WHERE pid=$1 AND NOT granted AND relation=$2::regclass) AS waiting',[pid,`${raceSchema}.vocabulary_words`])).rows[0].waiting;
      if(!waiting)await new Promise(resolve=>setTimeout(resolve,25));
    }
    check(waiting,true,'concurrent writer waits on migration table lock');
    check(settled,false,'writer cannot mutate data before migration commits');
    await client.query('COMMIT');await write;
    check(settled,true,'writer proceeds after migration releases lock');
    await initializePersonalVocabularyDatabase(pool);
    check((await pool.query('SELECT COUNT(*)::INTEGER n FROM vocabulary_words')).rows[0].n,8101,'autocommit reinitialization preserves later writes');
  } finally {
    await client.query('ROLLBACK');
    writer?.release();await pool.end();
  }
  await client.query(`DROP SCHEMA ${raceSchema} CASCADE`);raceSchemaCreated=false;
  check((await client.query('SELECT to_regnamespace($1) IS NULL AS absent',[raceSchema])).rows[0].absent,true,'owned concurrency schema removed');
}
async function preservedRows(){
  const result={};
  for(const table of tables) result[table]=(await client.query(`SELECT encode(sha256(convert_to(COALESCE(jsonb_agg(data ORDER BY data::text COLLATE "C"),'[]'::jsonb)::text,'UTF8')),'hex') AS digest FROM (SELECT to_jsonb(t)-'is_canonical' AS data FROM ${table} t) rows`)).rows[0].digest;
  return result;
}
async function rejected(label,mutate){
  step=label;await client.query('SAVEPOINT rejected_case');
  await mutate();await client.query('SAVEPOINT migration_attempt');
  await assert.rejects(()=>initializePersonalVocabularyDatabase(db),/explicit provenance review/,label);checks++;
  await client.query('ROLLBACK TO SAVEPOINT migration_attempt');
  check((await client.query("SELECT to_regclass('user_vocabulary_entries') IS NULL AS absent")).rows[0].absent,true,`${label}: no partial owner table`);
  check((await client.query("SELECT COUNT(*)::INTEGER n FROM information_schema.columns WHERE table_schema=$1 AND table_name='vocabulary_words' AND column_name='is_canonical'",[schema])).rows[0].n,0,`${label}: no partial word flag`);
  await client.query('ROLLBACK TO SAVEPOINT rejected_case');
  await client.query('RELEASE SAVEPOINT rejected_case');
}
const app=new Hono();
app.use('*',async(c,next)=>{c.set('user',{id:c.req.header('X-Test-User')??userA,displayName:'Upgrade fixture'});await next();});
app.onError((error,c)=>error.getResponse?error.getResponse():c.json({error:'Fixture request failed'},500));
registerVocabularyLearningRoutes(app,db);
async function request(path,body,user=userA){
  const response=await app.request(`/api/vocabulary/learning${path}`,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json','X-Test-User':user},body:body===undefined?undefined:JSON.stringify(body)});
  check(response.status,200,`route ${path}`);return response.json();
}
try {
  await client.connect();await client.query('BEGIN');
  await client.query("SET LOCAL statement_timeout='20s'");await client.query("SET LOCAL lock_timeout='5s'");
  await client.query(`CREATE SCHEMA ${schema}`);await client.query(`SET LOCAL search_path TO ${schema}`);
  await client.query('CREATE TABLE users(id TEXT PRIMARY KEY)');
  await client.query('INSERT INTO users SELECT id FROM public.users');
  await client.query('INSERT INTO users VALUES($1),($2)',[userA,userB]);
  for(const table of tables){
    await client.query(`CREATE TABLE ${table} (LIKE public.${table} INCLUDING ALL)`);
    await client.query(`INSERT INTO ${table} OVERRIDING SYSTEM VALUE SELECT * FROM public.${table}`);
  }
  for(const table of ['vocabulary_words','vocabulary_senses','vocabulary_lists'])
    await client.query(`SELECT setval(pg_get_serial_sequence($1,'id'),COALESCE((SELECT MAX(id) FROM ${table}),0)+1,FALSE)`,[`${schema}.${table}`]);
  const originalDigest=await digest();
  check((await client.query('SELECT COUNT(*)::INTEGER n FROM vocabulary_words')).rows[0].n,8100,'approved 8100-word clone');
  await client.query("INSERT INTO user_vocabulary_word_status(user_id,word_id,learning_status,is_important) VALUES($1,1,'completed',TRUE)",[userA]);
  await client.query('INSERT INTO user_vocabulary_list_subscriptions(user_id,list_id,is_enabled) VALUES($1,1,TRUE),($2,1,TRUE)',[userA,userB]);
  const before=await preservedRows();
  await rejected('changed meaning',()=>client.query("UPDATE vocabulary_senses SET meaning_ko='unreviewed private meaning' WHERE id=(SELECT MIN(id) FROM vocabulary_senses)"));
  await rejected('changed IPA',()=>client.query("UPDATE vocabulary_words SET pronunciation_ipa='/unreviewed/' WHERE id=1"));
  await rejected('unlisted private word',()=>client.query("INSERT INTO vocabulary_words(word,normalized_word,pronunciation_ipa) VALUES('Private sentinel','private sentinel','/private/')"));
  await rejected('orphan meaning',()=>client.query("INSERT INTO vocabulary_senses(word_id,part_of_speech,meaning_ko,sort_order) VALUES(999999999,'n','private sentinel',0)"));
  await rejected('personal list conversion',()=>client.query("UPDATE vocabulary_lists SET scope='personal',owner_user_id=$1 WHERE id=1",[userA]));
  await rejected('list metadata drift',()=>client.query("UPDATE vocabulary_lists SET title='Unreviewed list' WHERE id=1"));
  await rejected('membership order drift',()=>client.query('UPDATE vocabulary_list_items SET sort_order=sort_order+1000000 WHERE list_id=1 AND word_id=(SELECT MIN(word_id) FROM vocabulary_list_items WHERE list_id=1)'));
  await rejected('unreviewed learning snapshot',()=>client.query('CREATE TABLE vocabulary_learning_sessions(id INTEGER); INSERT INTO vocabulary_learning_sessions VALUES(1)'));
  check(await digest(),originalDigest,'rejections preserved original approved data');
  step='approved upgrade';await initializePersonalVocabularyDatabase(db);
  check(await preservedRows(),before,'all original rows and progress are byte-equivalent after upgrade');
  check((await client.query('SELECT COUNT(*)::INTEGER n FROM vocabulary_words WHERE is_canonical')).rows[0].n,8100,'all approved words remain canonical');
  check((await client.query('SELECT COUNT(*)::INTEGER n FROM user_vocabulary_entries')).rows[0].n,0,'no invented private ownership');
  await initializeVocabularyLearningDatabase(db);
  const study=(await request('/sessions',{kind:'study',listId:1,scope:'all',count:4,firstSide:'english',testType:'mixed'})).session;
  let current=study;
  for(let i=0;i<4;i++)current=(await request(`/sessions/${study.id}/respond`,{wordId:current.current.id,known:true})).session;
  check(current.status,'completed','upgraded common list supports full study');
  check((await request(`/sessions/${study.id}`)).session.answered,4,'study persists on reload');
  const tested=(await request('/sessions',{kind:'test',listId:1,scope:'recent',sourceSessionId:study.id,count:4,firstSide:'english',testType:'english_to_korean'})).session;
  const items=(await client.query('SELECT items_json FROM vocabulary_learning_sessions WHERE id=$1',[tested.id])).rows[0].items_json;
  for(const item of items) current=(await request(`/sessions/${tested.id}/respond`,{wordId:item.id,answer:item.expected[0]})).session;
  check(current.result.correct,4,'upgraded common list supports full scored test');
  check((await request(`/sessions/${tested.id}`)).session.status,'completed','test persists on reload');
  const base=(await client.query('SELECT word,pronunciation_ipa FROM vocabulary_words WHERE id=1')).rows[0];
  for(const [owner,meaning] of [[userA,'A private only'],[userB,'B private only']]){
    const id=await savePersonalVocabulary(db,owner,{word:base.word,pronunciationIpa:`/${meaning}/`,senses:[{partOfSpeech:'n',text:meaning}]});
    check(id,1,'existing word identity retained');
    const list=(await client.query("INSERT INTO vocabulary_lists(owner_user_id,scope,list_type,title) VALUES($1,'personal','custom','Fixture personal') RETURNING id",[owner])).rows[0].id;
    await client.query('INSERT INTO vocabulary_list_items(list_id,word_id,sort_order) VALUES($1,1,0)',[list]);
    const own=(await request('/sessions',{kind:'study',listId:Number(list),scope:'all',count:1,firstSide:'english',testType:'mixed'},owner)).session.current;
    check(own.meanings.some(m=>m.text===meaning),true,'owner sees private meaning');
    check(own.meanings.some(m=>m.text===(owner===userA?'B private only':'A private only')),false,'other owner meaning absent');
  }
  check((await client.query('SELECT word,pronunciation_ipa FROM vocabulary_words WHERE id=1')).rows[0],base,'common spelling and IPA unchanged');
  check((await client.query("SELECT COUNT(*)::INTEGER n FROM vocabulary_senses WHERE meaning_ko LIKE '%private only'")).rows[0].n,0,'private meanings never enter common senses');
  await initializePersonalVocabularyDatabase(db);await initializeVocabularyLearningDatabase(db);
  check((await request(`/sessions/${study.id}`)).session.answered,4,'reinitialization retains existing study progress');
  check((await request(`/sessions/${tested.id}`)).session.result.correct,4,'reinitialization retains test results');
  await client.query('ROLLBACK');
  rollbackVerified=(await client.query('SELECT to_regnamespace($1) IS NULL AS absent',[schema])).rows[0].absent;
  check(rollbackVerified,true,'owned schema rolled back');
  await concurrentMigrationCheck();
  console.log(JSON.stringify({event:'vocabulary_upgrade_fixture_complete',passed:true,checks,words:8100,rollbackVerified,productionTablesChanged:false}));
} catch(error) {
  await client.query('ROLLBACK').catch(()=>{});
  rollbackVerified=(await client.query('SELECT to_regnamespace($1) IS NULL AS absent',[schema])).rows[0].absent;
  console.log(JSON.stringify({event:'vocabulary_upgrade_fixture_failed',checks,step,code:error.code??'CHECK_FAILED',rollbackVerified}));process.exitCode=1;
} finally {
  if(raceSchemaCreated){await client.query('ROLLBACK').catch(()=>{});await client.query(`DROP SCHEMA IF EXISTS ${raceSchema} CASCADE`);}
  await client.end();
}
