import assert from 'node:assert/strict';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const script = fileURLToPath(new URL('../server/backup-db.sh', import.meta.url));
const docker = fileURLToPath(new URL('./fixtures/fake-backup-docker.sh', import.meta.url));
const sleep = fileURLToPath(new URL('./fixtures/fake-backup-sleep.sh', import.meta.url));
function run(mode, args) {
  const root = mkdtempSync(join(tmpdir(), 'enpra-backup-test-'));
  const compose = join(root, 'compose with spaces'), state = join(root, 'state'), bin = join(root, 'bin');
  mkdirSync(compose); mkdirSync(state); mkdirSync(bin);
  writeFileSync(join(compose, 'compose.yaml'), 'services: {}\n');
  copyFileSync(sleep, join(bin, 'sleep')); chmodSync(join(bin, 'sleep'), 0o755);
  copyFileSync(docker, join(bin, 'docker')); chmodSync(join(bin, 'docker'), 0o755);
  for (const command of ['mktemp', 'chmod']) { copyFileSync(docker, join(bin, command)); chmodSync(join(bin, command), 0o755); }
  const execute = () => spawnSync('sh', [script, ...(args?.(compose) ?? [compose, 'fixture-db'])], {
    env: { ...process.env, DOCKER_BIN: join(bin, 'docker'), FAKE_DOCKER_STATE: state, FAKE_DOCKER_MODE: mode, PATH: `${bin}:${process.env.PATH}` },
    encoding: 'utf8', timeout: 10_000,
  });
  const result = execute();
  const backupRoot = join(compose, 'backups/postgres');
  const backups = existsSync(backupRoot) ? readdirSync(backupRoot).map(name => join(backupRoot, name)) : [];
  return { root, compose, state, backups, result, execute, output: result.stdout + result.stderr,
    commands: existsSync(join(state, 'commands')) ? readFileSync(join(state, 'commands'), 'utf8') : '',
    cleanup() { rmSync(root, { recursive: true, force: true }); } };
}

test('backup verifies a full restore in an isolated exact-image container and retains a private archive', () => {
  const h = run('success');
  try {
    assert.equal(h.result.status, 0, h.output); assert.equal(h.backups.length, 1);
    const directory = h.backups[0], archive = join(directory, 'database.dump');
    assert.equal(statSync(directory).mode & 0o777, 0o700); assert.equal(statSync(archive).mode & 0o777, 0o600);
    assert.equal(statSync(join(h.compose, 'backups')).mode & 0o777, 0o700);
    assert.equal(statSync(join(h.compose, 'backups/postgres')).mode & 0o777, 0o700);
    for (const file of readdirSync(directory)) assert.equal(statSync(join(directory, file)).mode & 0o777, 0o600);
    assert.equal(readFileSync(archive, 'utf8'), readFileSync(join(h.state, 'restored-archive'), 'utf8'));
    assert.match(readFileSync(join(directory, 'status'), 'utf8'), /dump-started\ndump-complete\nrestore-started\nverified\n$/);
    assert.match(h.output, /Verified database backup/); assert.match(h.output, /Restored tables: 42/);
    assert.doesNotMatch(h.output, /private-backup-content|private-fixture-error/);
    assert.match(h.commands, /create .*--pull never --network none .*--memory 512m --memory-swap 512m --cpuset-cpus 0/);
    assert.doesNotMatch(h.commands, /--cpus /);
    assert.match(h.commands, /--tmpfs \/var\/lib\/postgresql\/data:rw,nosuid,noexec,size=512m/);
    assert.match(h.commands, /sha256:a{64} postgres -c port=5432/);
    assert.match(h.commands, /pg_dump --format=custom --no-owner --no-privileges/);
    assert.match(h.commands, /--port="\$\{POSTGRES_CONTAINER_PORT:-5432\}"/);
    assert.match(h.commands, /psql .*--host=127.0.0.1 --port=5432 .*--dbname=enpra_restore --command SELECT 1/);
    assert.match(h.commands, /pg_restore --exit-on-error --no-owner --no-privileges --host=\/var\/run\/postgresql --port=5432/);
    assert.doesNotMatch(h.commands, /docker compose|--publish|--volume |--mount |pg_restore .*fixture-db/);
    assert.match(readFileSync(join(h.state, 'removed'), 'utf8'), /^enpra-db-verify-/);
    assert.equal(existsSync(join(h.state, 'container')), false);
  } finally { h.cleanup(); }
});

test('backup explicitly secures an inherited world-accessible directory before writing private data', () => {
  const h = run('permissive-created-dir');
  try {
    assert.equal(h.result.status, 0, h.output); assert.equal(h.backups.length, 1);
    assert.equal(statSync(h.backups[0]).mode & 0o777, 0o700);
    for (const file of readdirSync(h.backups[0])) assert.equal(statSync(join(h.backups[0], file)).mode & 0o777, 0o600);
    assert(existsSync(join(h.state, 'archive-secured')));
  } finally { h.cleanup(); }
});

for (const mode of ['chmod-fail', 'chmod-no-effect', 'archive-chmod-fail']) {
  test(`backup rejects unsafe permissions before starting pg_dump on ${mode}`, () => {
    const h = run(mode);
    try {
      assert.notEqual(h.result.status, 0); assert.doesNotMatch(h.output, /Verified database backup/);
      assert.doesNotMatch(h.commands, /^exec fixture-db /m);
      for (const directory of h.backups) {
        const archive = join(directory, 'database.dump');
        if (existsSync(archive)) assert.equal(statSync(archive).size, 0);
      }
    } finally { h.cleanup(); }
  });
}

test('backup rejects verified success if final private log permissions cannot be secured', () => {
  const h = run('finish-chmod-fail');
  try {
    assert.notEqual(h.result.status, 0); assert.equal(h.backups.length, 1);
    assert.match(readFileSync(join(h.backups[0], 'status'), 'utf8'), /failed\n$/);
    assert.doesNotMatch(h.output, /Verified database backup/);
    assert.equal(existsSync(join(h.state, 'container')), false);
  } finally { h.cleanup(); }
});

test('backup waits for the final TCP server and target database instead of the bootstrap Unix socket', () => {
  const h = run('bootstrap');
  try {
    assert.equal(h.result.status, 0, h.output);
    assert.equal(readFileSync(join(h.state, 'probes'), 'utf8'), '3\n');
    assert.equal(h.commands.split('\n').filter(command => command.includes('--host=127.0.0.1') && command.includes('--command SELECT 1')).length, 3);
    assert(h.commands.lastIndexOf('--command SELECT 1') < h.commands.indexOf('pg_restore --exit-on-error'));
    assert.doesNotMatch(h.commands, /pg_isready/);
  } finally { h.cleanup(); }
});

test('running the backup again creates a new archive without overwriting the previous one', () => {
  const h = run('success');
  try {
    const previous = join(h.backups[0], 'database.dump'), saved = readFileSync(previous);
    const again = h.execute(); assert.equal(again.status, 0, again.stdout + again.stderr);
    assert.equal(readdirSync(join(h.compose, 'backups/postgres')).length, 2);
    assert.deepEqual(readFileSync(previous), saved);
  } finally { h.cleanup(); }
});

for (const mode of ['dump-fail', 'create-fail', 'cpu-affinity-unavailable', 'create-partial-fail', 'start-fail', 'ready-timeout', 'restore-fail', 'no-tables', 'query-fail', 'invalid-count', 'signal']) {
  test(`backup fails closed and retains its archive on ${mode}`, () => {
    const h = run(mode);
    try {
      assert.notEqual(h.result.status, 0, h.output); assert.equal(h.result.error, undefined);
      assert.equal(h.backups.length, 1); assert(existsSync(join(h.backups[0], 'database.dump')));
      assert.match(readFileSync(join(h.backups[0], 'status'), 'utf8'), /failed\n$/);
      assert.match(h.output, /NOT verified; do not deploy/); assert.doesNotMatch(h.output, /Verified database backup|private-backup-content|private-fixture-error/);
      assert.equal(existsSync(join(h.state, 'container')), false, 'owned verification containers must be removed');
      assert.doesNotMatch(h.commands, /rm --force --volumes fixture-db/);
      if (mode === 'cpu-affinity-unavailable') {
        assert.equal(h.commands.split('\n').filter(command => command.startsWith('create ')).length, 1, 'unavailable CPU affinity must not trigger an unbounded fallback');
        assert.match(h.commands, /--cpuset-cpus 0/);
      }
    } finally { h.cleanup(); }
  });
}

for (const mode of ['cleanup-fail', 'foreign-owner']) {
  test(`backup never reports verified or removes a foreign target on ${mode}`, () => {
    const h = run(mode);
    try {
      assert.notEqual(h.result.status, 0); assert.equal(h.backups.length, 1);
      assert.match(readFileSync(join(h.backups[0], 'status'), 'utf8'), /failed\n$/);
      assert.doesNotMatch(h.output, /Verified database backup/);
      assert.equal(existsSync(join(h.state, 'container')), true);
      if (mode === 'foreign-owner') assert.doesNotMatch(h.commands, /^rm /m);
    } finally { h.cleanup(); }
  });
}

test('backup requires an explicit compose path and exact database container', () => {
  for (const args of [() => [], () => ['.','fixture-db'], compose => [compose, 'bad/container'], compose => [compose, 'fixture-db', 'extra']]) {
    const h = run('success', args);
    try { assert.notEqual(h.result.status, 0); assert.equal(h.backups.length, 0); assert.equal(h.commands, ''); }
    finally { h.cleanup(); }
  }
});

test('backup refuses an unavailable source without creating an archive or any container', () => {
  const h = run('source-missing');
  try { assert.notEqual(h.result.status, 0); assert.equal(h.backups.length, 0); assert.doesNotMatch(h.commands, /^(create|exec|rm) /m); }
  finally { h.cleanup(); }
});
