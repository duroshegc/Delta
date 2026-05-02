import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  if (
    (specifier.startsWith(".") || specifier.startsWith("/")) &&
    !/\.[cm]?[jt]s$/.test(specifier)
  ) {
    const parentPath = context.parentURL
      ? fileURLToPath(context.parentURL)
      : process.cwd();
    const baseUrl = specifier.startsWith("/")
      ? pathToFileURL(specifier)
      : new URL(specifier, `file://${parentPath}`);
    const tsUrl = new URL(`${baseUrl.pathname}.ts`, baseUrl);
    const indexTsUrl = new URL(`${baseUrl.pathname}/index.ts`, baseUrl);

    if (existsSync(fileURLToPath(tsUrl))) {
      return { url: tsUrl.href, shortCircuit: true };
    }

    if (existsSync(fileURLToPath(indexTsUrl))) {
      return { url: indexTsUrl.href, shortCircuit: true };
    }
  }

  return nextResolve(specifier, context);
}

// Made with Bob
