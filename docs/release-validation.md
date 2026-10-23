# Release validation — 1.0.0

This file records verification levels rather than claiming universal correctness.

## Local evidence

- PASS: 36 Node test cases covering fresh/existing/custom projects, user and project scopes, Codex/Claude rule preservation, idempotence, conflicts, safe paths, drift detection, upgrades, failure rollback, shared installation ownership and recovery.
- PASS: actual packed npm artifact executed through npm exec in an isolated home and an existing project; init, second-run no-op, doctor, official OpenSpec proxy, standalone project launcher and rollback.
- PASS: all 11 skill entrypoints and their bundled relative references are present; public package allowlist excludes tests, local evidence, OpenSpec planning, credentials and project source.
- PASS: independent review reproduced and verified fixes for install-root links, removed rule blocks, shared-skill rollback/doctor, install-only upgrade scope, and unrelated Agent roots. A real SIGKILL after lock publication was recoverable; a simultaneous writer was rejected.
- The lock now publishes only complete content. Externally corrupted lock data is retained with an explicit resolution message, rather than guessed ownership.

## Release gates

- PASS: Linux/macOS/Windows on Node 22 and 24, including each packed-install test. Final package CI: https://github.com/zhaozengqing4364-bit/zzq-dev-kit/actions/runs/40005586771 (5afcf08).
- PASS: independent setup-skill onboarding in an isolated existing project; 11 skills installed, 62 doctor checks passed, original configuration/source/tests/package scripts unchanged. No application tests were executed for onboarding.
- BLOCKED: npm publication requires account two-factor authentication or an appropriately authorized token; login and dry-run succeeded, the actual registry PUT was rejected. The reviewed tarball is also supplied as a GitHub release asset. Public npm verification follows successful publication.

## Limits

No application UI, provider, deployment or production-data acceptance is implied. Existing/custom Schema support was exercised with bounded examples, not every community Schema. File hashes and tool locks protect the supported local workflow; they are not an OS-level defense against a hostile concurrent process. Recovery is journaled per-file recovery, not a cross-filesystem atomic transaction.

Dependency audit at release preparation reported zero known vulnerabilities. The npm allowlist includes npm-shrinkwrap.json; an earlier pack omitted it and the packed-artifact test now asserts its presence. Superseded CI runs were cancelled; the final six-job run above is complete.
