# EnPra release deployment

Only a published GitHub Release deploys the bridge to the NAS. Ordinary commits and pushes do not deploy anything.

1. Update the root `package.json` version using three-part semantic versioning: `MAJOR.MINOR.PATCH`.
2. Commit and push that change to `main`.
3. Create a GitHub Release with the matching tag: `vMAJOR.MINOR.PATCH`.

For example, package version `0.1.0` is released with the tag `v0.1.0`.

The release workflow validates the match, builds `ghcr.io/sean-59/enpra-bridge`, and tells the NAS to pull and run that exact release image.
