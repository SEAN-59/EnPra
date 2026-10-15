#!/bin/sh
# Explicit NAS-only backup; verification never mounts the production database.
set -eu
umask 077

fail() { printf '%s\n' "$1" >&2; exit 1; }
secure_mode() {
  chmod "$2" "$1" || return 1
  actual_mode=$(stat -c '%a' "$1" 2>/dev/null || stat -f '%Lp' "$1" 2>/dev/null) || return 1
  [ "$actual_mode" = "$2" ]
}

[ "$#" -eq 2 ] || fail 'Usage: sh backup-db.sh /absolute/compose-directory database-container'
case "$1" in /*) ;; *) fail 'The compose directory must be an explicit absolute path.' ;; esac
compose_dir=$(cd "$1" && pwd -P) || fail 'Cannot open the compose directory.'
[ "$compose_dir" != / ] && [ -f "$compose_dir/compose.yaml" ] || fail 'The target must contain compose.yaml and cannot be the filesystem root.'
source_container=$2
case "$source_container" in ''|*[!a-zA-Z0-9_.-]*) fail 'Use the exact database container name or ID.' ;; esac
docker_bin=${DOCKER_BIN:-/usr/local/bin/docker}
case "$docker_bin" in /*) ;; *) fail 'DOCKER_BIN must be an absolute executable path.' ;; esac
[ -x "$docker_bin" ] || fail 'The Docker executable is unavailable.'

running=$("$docker_bin" inspect --type container --format '{{.State.Running}}' "$source_container" 2>/dev/null) || fail 'Cannot inspect the source database container.'
[ "$running" = true ] || fail 'The source database container is not running.'
source_image=$("$docker_bin" inspect --type container --format '{{.Image}}' "$source_container" 2>/dev/null) || fail 'Cannot inspect the source database image.'
image_digest=${source_image#sha256:}
[ "${#image_digest}" -eq 64 ] || fail 'The source image must resolve to an immutable SHA-256 image ID.'
case "$source_image" in sha256:*) ;; *) fail 'Invalid source image ID.' ;; esac
case "$image_digest" in *[!0-9a-f]*) fail 'Invalid source image digest.' ;; esac

[ ! -L "$compose_dir/backups" ] && [ ! -L "$compose_dir/backups/postgres" ] || fail 'Backup directories cannot be symbolic links.'
mkdir -p "$compose_dir/backups"
secure_mode "$compose_dir/backups" 700 || fail 'Cannot secure the backup parent directory; no dump was started.'
backup_root=$compose_dir/backups/postgres
[ ! -L "$backup_root" ] || fail 'The backup directory cannot be a symbolic link.'
mkdir -p "$backup_root"
secure_mode "$backup_root" 700 || fail 'Cannot secure the backup directory; no dump was started.'
backup_dir=$(mktemp -d "$backup_root/$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX") || fail 'Cannot create a private backup directory.'
secure_mode "$backup_dir" 700 || fail 'Cannot secure the new backup directory; no dump was started.'
backup_id=${backup_dir##*/}
archive=$backup_dir/database.dump
status_file=$backup_dir/status
verify_name=enpra-db-verify-$backup_id
verify_created=0
verification_passed=0
table_count=0

cleanup_container() {
  owner=$("$docker_bin" inspect --type container --format '{{ index .Config.Labels "com.enpra.backup-verification" }}' "$verify_name" 2>/dev/null) || {
    [ "$verify_created" -eq 0 ] && return 0
    printf 'Cannot confirm ownership for verification container %s; it was not removed.\n' "$verify_name" >&2
    return 1
  }
  [ "$owner" = "$backup_id" ] || {
    printf 'Refusing to remove verification container %s with an unexpected ownership label.\n' "$verify_name" >&2
    return 1
  }
  "$docker_bin" rm --force --volumes "$verify_name" > "$backup_dir/verification-cleanup.log" 2>&1 || {
    printf 'Could not remove owned verification container %s.\n' "$verify_name" >&2
    return 1
  }
  verify_created=0
}

finish() {
  result=$?
  trap - EXIT HUP INT TERM
  if ! cleanup_container; then result=1; fi
  for private_file in "$backup_dir"/*; do
    [ -f "$private_file" ] || continue
    if ! secure_mode "$private_file" 600; then
      printf 'Cannot secure a private backup file; verification is rejected.\n' >&2
      result=1
    fi
  done
  if [ "$result" -eq 0 ] && [ "$verification_passed" -eq 1 ]; then
    printf 'verified\n' >> "$status_file"
    printf 'Verified database backup\nArchive: %s\nSource container: %s\nSource image: %s\nRestored tables: %s\n' "$archive" "$source_container" "$source_image" "$table_count"
  else
    printf 'failed\n' >> "$status_file"
    printf 'Backup is NOT verified; do not deploy using it. Private archive/logs retained at: %s\n' "$backup_dir" >&2
    result=1
  fi
  exit "$result"
}
trap finish EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

printf 'dump-started\n' >> "$status_file"
if ! (set -C; : > "$archive"); then fail 'Cannot create a new exclusive backup archive.'; fi
secure_mode "$archive" 600 || fail 'Cannot secure the backup archive; no dump was started.'
if ! "$docker_bin" exec "$source_container" sh -eu -c '
  PGPASSWORD=${POSTGRES_PASSWORD:-}; export PGPASSWORD
  exec pg_dump --format=custom --no-owner --no-privileges --host=/var/run/postgresql \
    --port="${POSTGRES_CONTAINER_PORT:-5432}" --username="${POSTGRES_USER:-postgres}" \
    --dbname="${POSTGRES_DB:-${POSTGRES_USER:-postgres}}"
' > "$archive" 2> "$backup_dir/dump.log"; then
  fail 'The database dump failed.'
fi
[ -s "$archive" ] || fail 'The database dump is empty.'
printf 'dump-complete\n' >> "$status_file"

# NAS kernels without CFS quotas still support affinity; require logical CPU 0.
if ! "$docker_bin" create --name "$verify_name" --label "com.enpra.backup-verification=$backup_id" \
  --pull never --network none --restart no --memory 512m --memory-swap 512m --cpuset-cpus 0 --pids-limit 128 \
  --tmpfs /var/lib/postgresql/data:rw,nosuid,noexec,size=512m --shm-size 64m \
  --env POSTGRES_HOST_AUTH_METHOD=trust --env POSTGRES_USER=postgres --env POSTGRES_DB=enpra_restore \
  --env PGDATA=/var/lib/postgresql/data "$source_image" \
  postgres -c port=5432 -c max_connections=10 -c shared_buffers=32MB \
  > "$backup_dir/verification-create.log" 2>&1; then
  fail 'Cannot create the isolated verification database.'
fi
verify_created=1
"$docker_bin" start "$verify_name" > "$backup_dir/verification-start.log" 2>&1 || fail 'Cannot start the isolated verification database.'
attempt=0
# The image's bootstrap server is Unix-only and can be ready before POSTGRES_DB exists.
until "$docker_bin" exec "$verify_name" psql --no-psqlrc --tuples-only --no-align \
  --host=127.0.0.1 --port=5432 --username=postgres --dbname=enpra_restore --command 'SELECT 1' > /dev/null 2>&1; do
  attempt=$((attempt + 1))
  [ "$attempt" -lt 30 ] || fail 'The isolated verification database did not become ready within 60 seconds.'
  sleep 2
done

printf 'restore-started\n' >> "$status_file"
if ! "$docker_bin" exec -i "$verify_name" pg_restore --exit-on-error --no-owner --no-privileges \
  --host=/var/run/postgresql --port=5432 --username=postgres --dbname=enpra_restore \
  < "$archive" > "$backup_dir/verification-restore.log" 2>&1; then
  fail 'The isolated database restore failed.'
fi
table_count=$("$docker_bin" exec "$verify_name" psql --no-psqlrc --tuples-only --no-align \
  --host=/var/run/postgresql --port=5432 --username=postgres --dbname=enpra_restore \
  --command "SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname NOT LIKE 'pg_%' AND schemaname <> 'information_schema'" \
  2> "$backup_dir/verification-tables.log") || fail 'Cannot verify restored application tables.'
case "$table_count" in ''|*[!0-9]*) fail 'The restored table count is invalid.' ;; esac
[ "$table_count" -gt 0 ] || fail 'The restored database has no application tables.'
verification_passed=1
