import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mirrorTree } from '../src/core/mirrorTree.ts';

let src: string;
let dest: string;

beforeEach(() => {
  src = mkdtempSync(join(tmpdir(), 'mt-src-'));
  dest = mkdtempSync(join(tmpdir(), 'mt-dest-'));
});
afterEach(() => {
  rmSync(src, { recursive: true, force: true });
  rmSync(dest, { recursive: true, force: true });
});

describe('mirrorTree', () => {
  it('copies the source tree into dest, recursively', () => {
    mkdirSync(join(src, '.github', 'workflows'), { recursive: true });
    writeFileSync(join(src, 'README.md'), 'hi');
    writeFileSync(join(src, '.github', 'workflows', 'ci.yaml'), 'on: push');

    mirrorTree(src, dest);

    expect(readFileSync(join(dest, 'README.md'), 'utf8')).toBe('hi');
    expect(existsSync(join(dest, '.github', 'workflows', 'ci.yaml'))).toBe(true);
  });

  it('never copies the source .git directory', () => {
    mkdirSync(join(src, '.git'), { recursive: true });
    writeFileSync(join(src, '.git', 'HEAD'), 'ref: refs/heads/main');
    writeFileSync(join(src, 'app.js'), 'x');

    mirrorTree(src, dest);

    expect(existsSync(join(dest, 'app.js'))).toBe(true);
    expect(existsSync(join(dest, '.git'))).toBe(false);
  });
});
