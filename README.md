# reusable-workflows-shadow-testing

A disposable **sandbox harness** for shadow-testing a reusable-workflows PR against a real consumer,
under an authentic `pull_request` event.

When a PR opens in the provider (`stefanpenner/shared-workflow-test`), its shadow workflow dispatches
the [`receiver`](.github/workflows/receiver.yaml) here. The receiver:

1. clones the consumer's code at the requested ref,
2. repoints the consumer's `uses:` at the provider PR's head SHA and guarantees a `pull_request`
   trigger (`src/core/transformWorkflowFile.ts`),
3. pushes it to a deterministic `shadow/pr-<n>-<consumer>` branch and opens a **real PR**,
4. waits on that PR's checks — so the receiver run's exit status _is_ the shadow-test result.

Because a reusable workflow runs in its **caller's context**, driving the consumer from a genuine
`pull_request` event is the only way the provider draft sees real PR context (`event_name`, the PR
payload, base ref, merge-ref checkout). A `repository_dispatch`/`workflow_dispatch` cannot reproduce
that. The shadow branch lives here (not in a fork), so the run keeps a normal token + secrets.

## This repo is disposable

Shadow PRs/branches are machine-generated and **must not be merged**. They are torn down when the
provider PR closes. `main` holds only this Node tooling.

## Fidelity caveats

A sandbox mirror is faithful for build/lint/test, but it is **not** the consumer's real repo:

- **Repo identity differs** — `github.repository` is this harness. Things keyed on repo name (ghcr
  paths, codecov slug, OIDC `sub`) diverge. Cosmetic for build/lint/test, meaningful for
  deploy/identity steps.
- **Repo-scoped config doesn't transfer** — the consumer's secrets/variables/environments/branch
  protections live in the consumer; map or stub the ones that matter.
- **No real merge target** — the shadow branch sits on top of an ~empty base, so you get the
  `pull_request` _event_, not a "consumer-feature merged into consumer-main" merge test.
- **Security** — a same-repo shadow PR runs the (patched) consumer's CI with this harness's token
  and secrets. Keep this repo's secrets minimal and its token scoped to this repo.
- **Forks** — the provider PR head SHA must be reachable as `provider/...@<sha>`; fork-based provider
  PRs won't resolve. Same-repo branch PRs are the supported path.

## Development

```sh
npm ci
npm test          # vitest (the real gate — pure core is fully unit-tested)
npm run typecheck
npm run lint
```

Layout: pure, unit-tested logic in `src/core/`; thin git/GitHub/`gh` adapters in `src/adapters/`;
workflow entrypoints in `src/bin/`.
