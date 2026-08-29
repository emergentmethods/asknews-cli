# Release

The CLI is published to npm as [`@emergentmethods/asknews-cli`](https://www.npmjs.com/package/@emergentmethods/asknews-cli)
and distributed from GitHub. Releases are automated by release-please
([`.github/workflows/release-please.yml`](../../.github/workflows/release-please.yml)):

1. every push to `main` creates or updates a **Release PR** that bumps `package.json`, updates
   `CHANGELOG.md`, and lists the changes since the last release (from conventional commits);
2. merging the Release PR creates the `vX.Y.Z` tag and the GitHub Release, and the same workflow run
   publishes to npm and attaches the tarball + checksum.

Only `fix:`, `feat:`, and breaking-change commits produce a release; `chore:`/`docs:` commits are
collected but do not trigger one on their own — use `fix:` for user-visible schema refreshes.
Never bump `package.json` by hand and never push `v*` tags by hand.
[`release.yml`](../../.github/workflows/release.yml) (tag-triggered) remains only as an emergency
fallback if the automation is broken.

## Preconditions

- The public OpenAPI snapshot and generated command reference are current (`pnpm sync:openapi:check`).
- `pnpm check` and `pnpm build` pass; opt-in live checks pass if relevant.
- The Release PR's version bump and generated notes look right (edit the PR body to adjust notes).
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

Merge the open Release PR (title `chore(main): release X.Y.Z`). Note: the Release PR is opened with
`GITHUB_TOKEN`, and GitHub does not run `pull_request` workflows for such PRs, so CI never reports on
it and the `main` ruleset blocks a normal merge — merge it as an admin (`gh pr merge N --squash --admin`).
The commits in it already passed CI on their own PRs. To remove this step, give release-please an
org GitHub App token (`actions/create-github-app-token` → `token:` input); App-created PRs trigger CI
normally. The workflow then:

1. creates the tag and GitHub Release with the changelog notes;
2. installs dependencies and bundles `dist/` from the committed OpenAPI snapshot;
3. builds the versioned tarball and `.sha256`;
4. publishes to npm with `access: public` (using the `NPM_TOKEN` repository secret);
5. attaches the tarball and checksum to the GitHub Release.

`JS-DevTools/npm-publish` is a no-op if the `package.json` version is already on npm, so re-running
the workflow is safe. The npm badge in the README reflects the published version.

## One-time setup

- Create an automation token in the `@emergentmethods` npm org and add it as the `NPM_TOKEN`
  repository secret.
- The `NPM_TOKEN` must be an npm **Automation** token (classic Publish tokens fail with EOTP in CI).
- The GitHub organization must allow GitHub Actions to create pull requests (Org Settings → Actions →
  General → Workflow permissions), or release-please cannot open the Release PR.
