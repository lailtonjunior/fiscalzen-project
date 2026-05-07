import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const modulesDir = join(process.cwd(), 'src', 'modules');
const disabledRouteFiles = new Set([
  join(modulesDir, 'pdf', 'routes.ts'),
]);

function listRouteFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return listRouteFiles(fullPath);
    }

    return entry === 'routes.ts' ? [fullPath] : [];
  });
}

describe('API contract guards', () => {
  it('keeps active versioned route handlers on canonical response helpers', () => {
    const forbiddenPatterns = [
      { label: 'reply.status(...).send(...)', pattern: /reply\s*\.\s*status\s*\([^)]*\)\s*\.\s*send\s*\(/ },
      { label: 'reply.send(...)', pattern: /reply\s*\.\s*send\s*\(/ },
      { label: 'direct object return', pattern: /return\s+\{/ },
    ];

    const violations = listRouteFiles(modulesDir)
      .filter((file) => !disabledRouteFiles.has(file))
      .flatMap((file) => {
        const source = readFileSync(file, 'utf8');

        return forbiddenPatterns
          .filter(({ pattern }) => pattern.test(source))
          .map(({ label }) => `${relative(process.cwd(), file)} uses ${label}`);
      });

    expect(violations).toEqual([]);
  });
});
