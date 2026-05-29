# reusable-workflows-shadow-testing — shadow runner (shim)

The **venue** for shadow testing, not where its logic lives. All logic is in the **workflows** repo
([`stefanpenner-cs/reusable-workflows`](https://github.com/stefanpenner-cs/reusable-workflows)) under
`shadow/` — change shadow testing **there**.

This repo holds one file with behavior: `.github/workflows/receiver.yaml`, a `workflow_dispatch`
shim. The workflows repo dispatches it; it checks that repo out at the PR's ref and runs
`bazelisk run //shadow/cmd/mirror-and-test` (the shadow harness is Go, built with Bazel in the
workflows repo), which opens a **shadow PR here** whose `pull_request` run is the consumer's real
CI. No source, no deps, no build here.

Why a separate repo: those throwaway shadow PRs need an isolated place to run a consumer's CI under
a real `pull_request` event. The receiver is `workflow_dispatch`-only, so it never re-fires on the
shadow PRs it creates.
