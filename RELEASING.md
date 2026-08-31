# EnPra delivery flow

## Branches

- `main`: current production state. It receives pull requests only.
- `dev`: shared development state. It receives pull requests only; each merge deploys the development bridge.
- `feature/...`, `fix/...`, `refactor/...`: normal work branches created from `dev`.
- `release/vMAJOR.MINOR.PATCH`: optional release-stabilization branch created from `dev` when a production release needs final checks.
- `hotfix/...`: urgent production fix created from `main`, then merged back into both `main` and `dev`.

Protect `main` and `dev` in GitHub so direct pushes are blocked and pull requests are required. That makes a push event on `dev` an actual merge into the shared development branch.

## Development deployment

Merge a pull request into `dev`. GitHub Actions builds an immutable `dev-<commit SHA>` bridge image and deploys only `dev_bridge` to `https://dev-enpra-api.ipstein.myds.me` (NAS port `7014`). It uses the `enpra_dev` PostgreSQL database, separate from production data.

## Production release

1. Merge the validated release commit into `main` and set the root `package.json` version to `MAJOR.MINOR.PATCH`.
2. Create an annotated tag on that exact current `main` commit: `vMAJOR.MINOR.PATCH`.
3. Push the tag. A GitHub Release can be created afterwards for release notes, but the tag push is what deploys production.

The production workflow rejects a tag unless it matches `package.json` and points exactly to the current tip of `main`.
