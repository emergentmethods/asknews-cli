import { chmod, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "esbuild";

await mkdir(resolve("dist"), { recursive: true });
await build({
  entryPoints: [resolve("src/bin.ts")],
  outfile: resolve("dist/bin.js"),
  bundle: true,
  packages: "external",
  platform: "node",
  format: "esm",
  target: "node22",
  sourcemap: true,
  legalComments: "external",
});
await chmod(resolve("dist/bin.js"), 0o755);
process.stdout.write("Built dist/bin.js\n");
