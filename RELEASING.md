# EnPra release deployment

Only a published GitHub Release deploys the bridge to the NAS. Ordinary commits and pushes do not deploy anything.

1. Update the root `package.json` version using three-part semantic versioning: `MAJOR.MINOR.PATCH`.
2. Commit and push that change to `main`.
3. Create a GitHub Release with the matching tag: `vMAJOR.MINOR.PATCH`.

For example, package version `0.1.0` is released with the tag `v0.1.0`.

The release workflow validates the match, builds `ghcr.io/sean-59/enpra-bridge`, and tells the NAS to pull and run that exact release image.

## Local Docker check

The root `docker-compose.yml` runs a separate local bridge and PostgreSQL.
Set `POSTGRES_PASSWORD`, `DATABASE_URL` and `ENPRA_BRIDGE_SERVICE_TOKEN` in an ignored `.env`.
`DATABASE_URL` must use host `db`, database/user `enpra` (unless overridden), and a URL-encoded password matching `POSTGRES_PASSWORD`.
Use a separate service token of at least 32 characters. `docker compose config --quiet` validates configuration without starting containers.
The NAS release continues to use `server/compose.yaml`; these local named volumes are not the production database.

## Personal vocabulary migration safety

The first startup preserves the user-approved public IELTS VOCA 01..16 baseline (8,100 words) in place. A checked-in SHA-256 digest covers all shared words, pronunciations, senses, list configuration and membership; it is not a word-count or title-only exception. This baseline was confirmed public by the owner on 2026-10-15. No private owners are inferred, and word/list IDs, subscriptions, status and importance records are not rewritten.

The initializer locks the dictionary before checking and adding the new schema in one transaction. Fresh empty installations and repeated startup after migration remain supported. A different legacy dictionary, personal-list change, or existing learning snapshots without the owner schema still requires explicit provenance review. Having no current personal lists alone is not proof of clean data: deleted lists may leave private meanings behind. Do not create an empty owner table or blindly refresh the digest to bypass this gate.

Back up the production database before release. The next authorized bridge deployment applies the additive owner schema and Voca learning schema automatically; local verification does not deploy or modify production tables. If the dictionary changes before first deployment, review that difference instead of removing the guard.

## Database backup and isolated recovery gate

Before an authorized NAS deployment, copy the reviewed `server/backup-db.sh` to the NAS and run it there with the exact existing compose directory and PostgreSQL container name. It does not read `.env`, print credentials, restart services or deploy code. For example, replace the last argument with the actual database container name:

```sh
sh /path/to/backup-db.sh /volume1/docker/EnPra actual-db-container-name
```

The default Docker executable is `/usr/local/bin/docker`; `DOCKER_BIN` can explicitly select another absolute executable path. Database/user/port settings and the password stay inside the source container. The script runs `pg_dump --format=custom` against that running database using its `POSTGRES_USER`, `POSTGRES_DB` and `POSTGRES_CONTAINER_PORT` values.

Each invocation retains a new private directory under `<compose-directory>/backups/postgres/`, containing `database.dump`, append-only `status` and diagnostic logs. NAS inherited permissions can override `umask`, so the script explicitly applies and reads back mode `700` on the backups parent/root/new directory before any dump. It creates the archive exclusively, applies and verifies mode `600` before writing database data, then applies and verifies `600` on every private file before reporting success. Any permission failure rejects verification. The archive contains private application data and must never be committed, published or copied into web assets. No old backup is overwritten or automatically deleted.

Verification performs a complete `pg_restore --exit-on-error --no-owner --no-privileges` into a new disposable PostgreSQL container using the source database's exact local image ID, not a floating tag or a pulled image. The verifier has no network, no published ports, no production volumes, a 512 MiB memory limit without swap and a 512 MiB tmpfs data directory. CPU affinity is explicitly restricted to the first logical core (`--cpuset-cpus 0`), supported by the current NAS even though CFS CPU quotas are unavailable. If core `0` or CPU affinity is unavailable, verification fails closed; it never retries without the CPU restriction. A `psql SELECT 1` readiness probe uses loopback TCP (`127.0.0.1:5432`) inside the isolated container and checks the target database, avoiding the image's earlier Unix-only bootstrap server. Restore and table validation then use the local Unix socket on PostgreSQL port `5432`; no port is published. The temporary trust authentication applies solely to that isolated container. The script then checks that application tables exist and removes only its uniquely named, ownership-labelled verification container.

The deployment gate passes **only** when the script exits `0`, prints `Verified database backup` and the final line of that backup's `status` is `verified`. An archive listing alone is not a recovery test. Dump, startup, restore, table validation or cleanup failure exits nonzero, retains the archive/logs and marks the backup failed; do not deploy using that unverified backup. If the database outgrows these conservative scratch resource limits, review and explicitly adjust the verifier capacity before trying again. Never compensate by skipping the restore check.

This is a manual pre-release gate; the existing release workflow does not invoke it yet and no production restore is automatic. A live dump is a consistent snapshot, not zero-data-loss rollback: writes made after its snapshot are not in that archive. Preserve the verified backup off the NAS as well for hardware-loss protection. Restoring or rolling back the production database still requires a separate approved maintenance plan; this script must never be used to overwrite the production data directory.

## Coordinated bridge and web release

Include all required new routes, modules and regression tests in the release commit, not only the version change. Run `npm test`, the bridge build and the web type check/build against that exact source. After a fresh verified backup, deploy the compatible bridge first, then publish the matching Sites web version; the GitHub Release workflow deploys the bridge only. Do not treat a successful bridge rollout as publication of the Voca or Writing screens. Check real sign-in and account-specific records on the hosted Site after the owner authorizes publication.
