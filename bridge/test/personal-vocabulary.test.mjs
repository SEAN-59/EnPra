import assert from 'node:assert/strict';
import {test} from 'node:test';
import {initializePersonalVocabularyDatabase,legacyVocabularyDigestSql} from '../dist/personal-vocabulary.js';

test('legacy approval, table locks and additive owner DDL stay in one query for Pool callers',async()=>{
  const queries=[];
  await initializePersonalVocabularyDatabase({async query(sql){queries.push(sql);return {rows:[],rowCount:0};}});
  assert.equal(queries.length,1);
  const sql=queries[0];
  assert(sql.indexOf('LOCK TABLE vocabulary_words')<sql.indexOf("to_regclass('user_vocabulary_entries')"));
  assert(sql.indexOf('LOCK TABLE vocabulary_senses')<sql.indexOf(legacyVocabularyDigestSql));
  assert(sql.indexOf(legacyVocabularyDigestSql)<sql.indexOf('ALTER TABLE vocabulary_words'));
  assert.match(sql,/current_digest <> '[a-f0-9]{64}'/);
  assert.match(sql,/Legacy learning snapshots need an explicit provenance review/);
  assert.doesNotMatch(sql,/\bDELETE\s+FROM|\bTRUNCATE\b|\bUPDATE\s+(?:vocabulary|user_vocabulary)/i,'existing words, ownership and progress are never rewritten');
});

test('approved digest includes every shared representation, not only word counts or active lists',()=>{
  for(const source of ['FROM vocabulary_words','FROM vocabulary_senses','FROM vocabulary_lists','FROM vocabulary_list_items']) assert(legacyVocabularyDigestSql.includes(source));
  for(const field of ['normalized_word','pronunciation_ipa','difficulty_band','meaning_ko','part_of_speech','owner_user_id','scope','list_type','learning_date','sort_order']) assert(legacyVocabularyDigestSql.includes(field));
  assert.match(legacyVocabularyDigestSql,/sha256/);
  assert.doesNotMatch(legacyVocabularyDigestSql,/\bWHERE\b|created_at|updated_at/i,'orphan rows remain covered and timestamps do not affect approval');
});
