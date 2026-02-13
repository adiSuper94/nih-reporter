import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");
import denoJson from "../deno.json" with { type: "json" };
const { name, version, license, imports } = denoJson;
const jsrZodVersion = imports["zod"];

const zodVersion = jsrZodVersion.replace("npm:zod@", "");
console.log(`zod version : ${zodVersion}`);

await build({
  entryPoints: ["./lib/index.ts"],
  outDir: "./npm",
  shims: {
    deno: true,
  },
  test: false,
  typeCheck: false,
  package: {
    name: name,
    version: version,
    description: "NIH Reporter API client",
    license: license,
    keywords: ["nih", "nih-reporter", "api"],
    repository: {
      type: "git",
      url: "git+https://github.com/adiSuper94/nih-reporter.git",
    },
    bugs: {
      url: "https://github.com/adiSuper94/nih-reporter/issues",
    },
    homepage: "https://github.com/adiSuper94/nih-reporter#readme",
    author: "Aditya Subramanian",
    dependencies: {
      zod: zodVersion,
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
