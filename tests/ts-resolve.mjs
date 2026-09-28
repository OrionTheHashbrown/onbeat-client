/**
 * FIND OUR .ts FILES – tests/ts-resolve.mjs
 *
 * REFERENCE FROM
 * https://nodejs.org/api/module.html#resolvespecifier-context-nextresolve
 */

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function resolve(specifier, context, nextResolve) {
  const isOurFile = specifier.startsWith('.');
  const hasEnding = /\.[cm]?[jt]sx?$/.test(specifier);

  if (isOurFile && !hasEnding) {
    const withTs = new URL(specifier + '.ts', context.parentURL);
    if (existsSync(fileURLToPath(withTs))) {
      return { url: withTs.href, format: 'module-typescript', shortCircuit: true };
    }
  }

  const resolved = nextResolve(specifier, context);

  if (resolved.url.endsWith('.ts') && !resolved.format) {
    return { ...resolved, format: 'module-typescript' };
  }
  return resolved;
}
