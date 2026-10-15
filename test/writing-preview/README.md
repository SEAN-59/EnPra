# Local Writing review

This is an opt-in, disposable diagnostic, not an application route or auth bypass.
The browser uses the actual Writing client components. The Vite-only navigation
shim and API middleware are never imported by the application build.

`server.mjs <prepared-NAS-directory> [4178|4179]` serves only on `127.0.0.1`.
4178 is the user review session; 4179 is a separate agent QA session seeded at
5.0A to test grading without spending additional AI calls on placement. Each starts
its own SSH stdio process, synthetic learner, transaction-local database schema,
and candidate Writing routes. No bridge ports, credentials or production users
are exposed. Mutations require the same-origin header and a loopback Host.

Prepare a `/tmp/enpra-writing-preview.XXXXXX` directory inside `enpra-bridge` with
the freshly built `writing.js`, `codex.js`, `ai-json.js`, `ai-errors.js`, the bridge
`package.json`, this `remote.mjs`, and a dependency symlink to `/app/node_modules`.
Never replace production source, auth, environment, model settings, or container.

Real inference uses the existing ChatGPT account via the candidate Codex adapter.
It consumes the account's usage allowance. Records exist only in the outer
transaction. Refresh/navigation retain them while the process lives. Closing
stdin or ending the one-hour lifetime rolls back all database records, verifies
the schema is absent, and terminates only its own AI subprocess. Remove the
prepared code directory after all review sessions stop. It contains no secrets.

This does not verify hosted login, production deployment or concurrent load.
Use `node --test test/writing-preview.test.mjs test/writing-frontend.test.mjs`
for local routing and component regression checks.
