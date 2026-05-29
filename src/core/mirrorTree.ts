import { cpSync } from 'node:fs';
import { basename } from 'node:path';

/** Recursively copy a cloned consumer's working tree into `dest`, excluding its `.git` so we graft
 * the consumer's *files* (not its history) onto the harness branch. */
export function mirrorTree(src: string, dest: string): void {
  cpSync(src, dest, {
    recursive: true,
    filter: (source) => basename(source) !== '.git',
  });
}
