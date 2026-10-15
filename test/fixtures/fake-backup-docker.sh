#!/bin/sh
set -eu
mode=${FAKE_DOCKER_MODE:-success}
case "${0##*/}" in
  mktemp)
    directory=$(/usr/bin/mktemp "$@")
    case "$mode" in permissive-created-dir|chmod-no-effect) /bin/chmod 777 "$directory" ;; esac
    printf '%s\n' "$directory" > "$FAKE_DOCKER_STATE/backup-directory"
    printf '%s\n' "$directory"
    exit 0
    ;;
  chmod)
    [ "$mode" != chmod-fail ] || exit 1
    [ "$mode" != chmod-no-effect ] || exit 0
    case "$2" in
      */database.dump) [ "$mode" != archive-chmod-fail ] || exit 1 ;;
      */verification-restore.log) [ "$mode" != finish-chmod-fail ] || exit 1 ;;
    esac
    /bin/chmod "$@"
    case "$2" in */database.dump) printf 'secured\n' > "$FAKE_DOCKER_STATE/archive-secured" ;; esac
    exit 0
    ;;
esac
printf '%s\n' "$*" >> "$FAKE_DOCKER_STATE/commands"
image=sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
case "$1" in
  inspect)
    case "$5" in
      '{{.State.Running}}') [ "$mode" != source-missing ] || exit 1; printf 'true\n' ;;
      '{{.Image}}') printf '%s\n' "$image" ;;
      *) [ -f "$FAKE_DOCKER_STATE/owner" ] || exit 1; read -r owner < "$FAKE_DOCKER_STATE/owner"; printf '%s\n' "$owner" ;;
    esac
    ;;
  create)
    [ "$mode" != create-fail ] || exit 1
    [ "$mode" != cpu-affinity-unavailable ] || exit 1
    shift
    while [ "$#" -gt 0 ]; do
      case "$1" in
        --name) printf '%s\n' "$2" > "$FAKE_DOCKER_STATE/container"; shift ;;
        --label) printf '%s\n' "${2#com.enpra.backup-verification=}" > "$FAKE_DOCKER_STATE/owner"; shift ;;
      esac
      shift
    done
    if [ "$mode" = foreign-owner ]; then printf 'someone-else\n' > "$FAKE_DOCKER_STATE/owner"; exit 1; fi
    [ "$mode" != create-partial-fail ] || exit 1
    printf 'fixture-container-id\n'
    ;;
  start) [ "$mode" != start-fail ] ;;
  exec)
    shift
    [ "$1" != -i ] || shift
    target=$1; shift
    case "$1" in
      sh)
        [ -f "$FAKE_DOCKER_STATE/archive-secured" ] || exit 1
        printf 'private-backup-content\n'
        if [ "$mode" = dump-fail ]; then printf 'private-fixture-error\n' >&2; exit 1; fi
        ;;
      pg_isready)
        # Official PostgreSQL's bootstrap Unix socket looks ready too early.
        printf 'accepting connections\n'
        ;;
      pg_restore)
        [ -f "$FAKE_DOCKER_STATE/final-ready" ] || exit 1
        cat > "$FAKE_DOCKER_STATE/restored-archive"
        if [ "$mode" = restore-fail ]; then printf 'private-fixture-error\n' >&2; exit 1; fi
        ;;
      psql)
        case " $* " in
          *' --command SELECT 1 '*)
            case " $* " in *' --host=127.0.0.1 '*) ;; *) exit 1 ;; esac
            if [ "$mode" = signal ]; then kill -TERM "$PPID"; exit 1; fi
            [ "$mode" != ready-timeout ] || exit 1
            if [ "$mode" = bootstrap ]; then
              probes=0
              [ ! -f "$FAKE_DOCKER_STATE/probes" ] || read -r probes < "$FAKE_DOCKER_STATE/probes"
              probes=$((probes + 1)); printf '%s\n' "$probes" > "$FAKE_DOCKER_STATE/probes"
              [ "$probes" -ge 3 ] || exit 1
            fi
            printf 'ready\n' > "$FAKE_DOCKER_STATE/final-ready"
            printf '1\n'
            ;;
          *)
            [ "$mode" != query-fail ] || exit 1
            case "$mode" in no-tables) printf '0\n' ;; invalid-count) printf 'not-a-count\n' ;; *) printf '42\n' ;; esac
            ;;
        esac
        ;;
      *) exit 1 ;;
    esac
    ;;
  rm)
    [ "$mode" != cleanup-fail ] || exit 1
    read -r owned_name < "$FAKE_DOCKER_STATE/container"
    [ "$4" = "$owned_name" ] || exit 1
    printf '%s\n' "$4" >> "$FAKE_DOCKER_STATE/removed"
    rm "$FAKE_DOCKER_STATE/container" "$FAKE_DOCKER_STATE/owner"
    ;;
  *) exit 1 ;;
esac
