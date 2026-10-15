import type { Pool, PoolClient } from 'pg';

type Database = Pick<PoolClient, 'query'>;
type Sense = { partOfSpeech: string; text: string };
type Entry = { word: string; pronunciationIpa: string; senses: Sense[] };

// User-approved public IELTS VOCA 01..16 baseline; never accept a count-only match.
const approvedLegacyDigest = '463ecd884cd5344e56e9a77b65f98c0c07c5f5dbd83448166d4bb686f0c612ba';

export const legacyVocabularyDigestSql = `SELECT encode(sha256(convert_to(jsonb_build_object(
  'words',COALESCE((SELECT jsonb_agg(jsonb_build_array(id,word,normalized_word,pronunciation_ipa,difficulty_band) ORDER BY id) FROM vocabulary_words),'[]'::jsonb),
  'senses',COALESCE((SELECT jsonb_agg(jsonb_build_array(word_id,part_of_speech,meaning_ko,sort_order) ORDER BY word_id,sort_order,part_of_speech COLLATE "C",meaning_ko COLLATE "C") FROM vocabulary_senses),'[]'::jsonb),
  'lists',COALESCE((SELECT jsonb_agg(jsonb_build_array(id,owner_user_id,scope,list_type,title,to_char(learning_date,'YYYY-MM-DD')) ORDER BY id) FROM vocabulary_lists),'[]'::jsonb),
  'items',COALESCE((SELECT jsonb_agg(jsonb_build_array(list_id,word_id,sort_order) ORDER BY list_id,word_id) FROM vocabulary_list_items),'[]'::jsonb)
)::text,'UTF8')),'hex') AS digest`;

export async function initializePersonalVocabularyDatabase(pool: Pick<Pool, 'query'>) {
  // One query keeps locks, validation and DDL atomic even when the caller is a Pool.
  await pool.query(`
    LOCK TABLE vocabulary_words IN ACCESS EXCLUSIVE MODE;
    LOCK TABLE vocabulary_senses,vocabulary_lists,vocabulary_list_items IN SHARE ROW EXCLUSIVE MODE;
    DO $$ DECLARE current_digest TEXT; has_snapshots BOOLEAN; BEGIN
      IF to_regclass('user_vocabulary_entries') IS NULL THEN
        IF to_regclass('vocabulary_learning_sessions') IS NOT NULL THEN
          LOCK TABLE vocabulary_learning_sessions IN SHARE ROW EXCLUSIVE MODE;
          EXECUTE 'SELECT EXISTS(SELECT 1 FROM vocabulary_learning_sessions)' INTO has_snapshots;
          IF has_snapshots THEN
            RAISE EXCEPTION 'Legacy learning snapshots need an explicit provenance review before migration';
          END IF;
        END IF;
        IF EXISTS (SELECT 1 FROM vocabulary_words) OR EXISTS (SELECT 1 FROM vocabulary_senses) THEN
          SELECT digest INTO current_digest FROM (${legacyVocabularyDigestSql}) snapshot;
          IF current_digest <> '${approvedLegacyDigest}' THEN
            RAISE EXCEPTION 'Legacy personal vocabulary needs an explicit provenance review before migration';
          END IF;
        END IF;
      END IF;
    END $$;
    ALTER TABLE vocabulary_words ADD COLUMN IF NOT EXISTS is_canonical BOOLEAN NOT NULL DEFAULT TRUE;
    CREATE TABLE IF NOT EXISTS user_vocabulary_entries (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      word_id BIGINT NOT NULL REFERENCES vocabulary_words(id) ON DELETE CASCADE,
      word TEXT NOT NULL CHECK(char_length(trim(word))>0),
      pronunciation_ipa TEXT NOT NULL CHECK(char_length(trim(pronunciation_ipa))>0),
      senses_json JSONB NOT NULL CHECK(jsonb_typeof(senses_json)='array' AND jsonb_array_length(senses_json)>0),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY(user_id,word_id)
    );
  `);
}

export async function savePersonalVocabulary(db: Database, userId: string, entry: Entry) {
  const normalized = entry.word.normalize('NFKC').toLocaleLowerCase('en-US');
  // Shared identities contain no contributor's private spelling, pronunciation or meanings.
  const word = await db.query<{id: string | number}>(
    `INSERT INTO vocabulary_words(word,normalized_word,pronunciation_ipa,is_canonical)
     VALUES($1,$1,'—',FALSE) ON CONFLICT(normalized_word) DO UPDATE SET normalized_word=EXCLUDED.normalized_word RETURNING id`,
    [normalized],
  );
  const wordId = Number(word.rows[0].id);
  await db.query(
    `INSERT INTO user_vocabulary_entries(user_id,word_id,word,pronunciation_ipa,senses_json)
     VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id,word_id) DO UPDATE SET
       word=EXCLUDED.word,pronunciation_ipa=EXCLUDED.pronunciation_ipa,
       senses_json=(SELECT jsonb_agg(item ORDER BY position) FROM (
         SELECT item,MIN(ordinality) position FROM jsonb_array_elements(user_vocabulary_entries.senses_json || EXCLUDED.senses_json) WITH ORDINALITY AS entries(item,ordinality) GROUP BY item
       ) merged),updated_at=NOW()`,
    [userId,wordId,entry.word,entry.pronunciationIpa,JSON.stringify(entry.senses)],
  );
  return wordId;
}

export async function personalVocabularyDetails(db: Database, userId: string, scope: string, wordIds: number[]) {
  if (scope !== 'personal' || !wordIds.length) return new Map<number,Entry>();
  const result = await db.query<{word_id:string | number;word:string;pronunciation_ipa:string;senses_json:Sense[]}>(
    `SELECT word_id,word,pronunciation_ipa,senses_json FROM user_vocabulary_entries WHERE user_id=$1 AND word_id=ANY($2::bigint[])`,
    [userId,wordIds],
  );
  return new Map(result.rows.map(row=>[Number(row.word_id),{word:row.word,pronunciationIpa:row.pronunciation_ipa,senses:row.senses_json}]));
}

export function effectiveVocabularyDetails(word: {word:string;pronunciationIpa:string;meanings:Sense[]}, personal?: Entry) {
  if (!personal) return word;
  const meanings = [...word.meanings];
  for (const sense of personal.senses)
    if (!meanings.some(item=>item.partOfSpeech===sense.partOfSpeech && item.text===sense.text)) meanings.push(sense);
  return {word:personal.word,pronunciationIpa:personal.pronunciationIpa,meanings};
}
