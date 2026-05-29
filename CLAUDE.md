# CLAUDE.md

This repo is a **shim** — only the venue where shadow PRs run a consumer's CI in isolation. All
shadow-testing logic lives in the **workflows** repo (`stefanpenner-cs/reusable-workflows`) under
`shadow/`. Change behavior there, not here.

- The only file with behavior is `.github/workflows/receiver.yaml`: a `workflow_dispatch` shim that
  checks out the workflows repo at the dispatched ref and runs
  `bazelisk run //shadow/cmd/mirror-and-test` (the shadow harness is Go, built with Bazel there).
- Don't add source / deps / build here. Keep the receiver's `run:` a single `bazelisk run …`.
