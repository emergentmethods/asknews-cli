# Release

The CLI is published to npm as [`@emergentmethods/asknews-cli`](https://www.npmjs.com/package/@emergentmethods/asknews-cli)
and distributed from GitHub. Releases are automated: pushing a `v*` tag runs
[`.github/workflows/release.yml`](../../.github/workflows/release.yml), which publishes to npm and
creates a GitHub Release with the package tarball and checksum.

## Preconditions

- The public OpenAPI snapshot and generated command reference are current (`pnpm sync:openapi:check`).
- `pnpm check` and `pnpm build` pass; opt-in live checks pass if relevant.
- The version in `package.json` is bumped and the changelog/release notes are reviewed.
- The `asknews-cli` public OAuth client is registered for the target environment.

## Local package verification

```bash
pnpm build
pnpm package:tarball
./install --tarball release/*.tgz \
  --prefix /tmp/asknews-cli-smoke \
  --no-modify-path \
  --no-agent-skills
/tmp/asknews-cli-smoke/bin/asknews --version
/tmp/asknews-cli-smoke/bin/asknews --help
```

Inspect the tarball contents (`npm publish --dry-run`). It should contain only the executable
bundle and source map, `package.json`, `README.md`, `LICENSE`, the lifecycle setup script, and the
embedded AskNews skill. It must not contain credentials, `.env` files, tests, or development sources.

## Cut a release

```bash
# after the version bump lands on main
git tag v0.1.0
git push origin v0.1.0
```

The release workflow then:

1. installs dependencies and bundles `dist/` from the committed OpenAPI snapshot;
2. builds the versioned tarball and `.sha256`;
3. publishes to npm with `access: public` (using the `NPM_TOKEN` repository secret);
4. creates a GitHub Release with the tarball and checksum attached.

`JS-DevTools/npm-publish` is a no-op if the `package.json` version is already on npm, so re-running a
tag is safe.

## One-time setup

- Create an automation token in the `@emergentmethods` npm org and add it as the `NPM_TOKEN`
  repository secret.
- Validate the pipeline with a pre-release tag (for example `v0.0.1-rc.0`) before the first real tag.
