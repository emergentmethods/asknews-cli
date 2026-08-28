# Curl installer

The root [`install`](../../install) script provides a one-line `curl … | bash` installation path on
top of the public npm package. It runs `npm install --global` for `@emergentmethods/asknews-cli`
under `~/.local` by default — no token or private registry required.

## Hosting

The script is served from the docs app at `https://docs.asknews.app/cli/install` (the file lives at
`apps/docs/public/cli/install` in the frontend repo and is kept in sync with this repo's `install`
script). Users install with:

```bash
curl -fsSL https://docs.asknews.app/cli/install | bash
```

## Options

```bash
bash install --help
bash install --version 0.1.0          # install a specific version (default: latest)
bash install --prefix "$HOME/.local"  # change the install prefix
bash install --no-modify-path         # do not edit the shell profile
bash install --no-agent-skills        # skip the embedded AskNews agent skill
bash install --tarball release/*.tgz  # install a locally built tarball
bash install --sha256 <checksum>      # verify a --tarball against a checksum
```

## Local tarball flow

For offline or pre-release verification, build and install a tarball directly:

```bash
pnpm build
pnpm package:tarball
./install --tarball release/*.tgz --prefix /tmp/asknews-cli-smoke --no-modify-path
/tmp/asknews-cli-smoke/bin/asknews --version
```
