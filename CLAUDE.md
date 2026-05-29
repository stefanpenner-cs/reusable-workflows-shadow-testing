# CLAUDE.md

Conventions for this repo (the shadow-testing harness). Follow them exactly.

## Non-negotiable rules

1. **No logic inline in YAML.** A workflow/action `run:` must be a single invocation of
   an external file — `node src/bin/<x>.ts` (preferred) or `bash <script>.sh`. No `run: |`
   logic blocks; no one-liners containing shell operators (`&&`, `||`, `;`, `|`, `>`,
   `$(...)`) or application logic. Standard build/test invocations (`npm ci`, `npm test`,
   `npm run lint`) are the only allowed inline commands. If a step needs to *decide*,
   *loop*, *parse*, or *call an API*, it belongs in a `src/bin` entry, not YAML.
2. **Everything is Node + tested.** Write TypeScript that runs natively on **Node 24**
   (built-in type-stripping — no `tsx`, no transpile step, no `npm` needed at runtime).
   Every module has a `test/<name>.test.ts` using `node:test` + `node:assert/strict`.
   Run `node --test test/*.test.ts` (or `npm test`).
3. **Zero third-party runtime deps** wherever feasible — prefer `node:` built-ins so bins
   run on raw Node 24 with no `node_modules`. (`yaml` is the one sanctioned runtime dep,
   used only by `mirror-and-test` for comment-preserving workflow edits.)

## Layout

- `src/core/*` — **pure** logic: no I/O, no `process.env`, deterministic, returns values.
  This is where the testable logic lives and where most new code should go.
- `src/adapters/*` — side effects behind thin wrappers (`exec`, `git`, `github`).
- `src/bin/*` — entrypoints: read env, call `core` + `adapters`, no logic of their own.
- `test/*.test.ts` — one per module, asserting the pure functions.

## Style

- A bin reads `process.env`, builds plain inputs, delegates to `core` (pure) and
  `adapters` (I/O). Keep bins boring.
- Pure functions take every input as an argument and return a value — never read env or
  touch fs/network. That is what makes them testable; inject sinks (an output path, an
  `exec` fn) so tests pass a temp file or a fake.
- **Errors: no silent failures.** Catch only the error you expect (e.g. an `ENOENT`, a
  non-zero exit); rethrow everything else. Attribute failures and chain the original with
  `new Error('context', { cause: err })`.
- **Surfacing results to a PR:** write a markdown **job summary** to
  `$GITHUB_STEP_SUMMARY` (it renders on the check's page) — not a PR comment.

## The right move for new behavior

1. Pure function in `src/core` + its `test/*.test.ts`.
2. A thin `src/bin` entry (and `src/adapters` wrapper if it does I/O) to wire it.
3. A single `node src/bin/<x>.ts` invocation in YAML — never inline logic.
