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
- PASS: npm `zzq-dev-kit@1.0.0` is publicly available with `latest` pointing to 1.0.0. Registry integrity and downloaded tarball SHA-512 exactly match the reviewed release artifact. The initial E403 authentication refusal was resolved by the user completing publication verification; the earlier failure remains in local evidence.

## Limits

No application UI, provider, deployment or production-data acceptance is implied. Existing/custom Schema support was exercised with bounded examples, not every community Schema. File hashes and tool locks protect the supported local workflow; they are not an OS-level defense against a hostile concurrent process. Recovery is journaled per-file recovery, not a cross-filesystem atomic transaction.

Dependency audit at release preparation reported zero known vulnerabilities. The npm allowlist includes npm-shrinkwrap.json; an earlier pack omitted it and the packed-artifact test now asserts its presence. Superseded CI runs were cancelled; the final six-job run above is complete.

PASS: public GitHub release tarball downloaded through npm exec with a fresh cache; old-project init, repeat no-op, doctor and the generated OpenSpec launcher all passed. That earlier smoke used the documented ZZQ_DEV_KIT_SOURCE release URL while npm publication was pending.

## Public npm verification — 2026-10-24 (Asia/Shanghai)

PASS: executed the short `npx --yes zzq-dev-kit` command from a fresh npm cache in two isolated projects: one new and one with existing rules and OpenSpec context. For each, dry-run left project/user files unchanged; init installed all eleven skills for both agents; repeated init and same-version upgrade were no-ops; doctor passed; the generated launcher worked without a source override; the bundled official engine reported 1.14.2; rollback restored the original project file hashes.

Reviewed/public integrity:

```text
sha512-dKCsRbvn4LukudMN91tmwWJx57N7wyy6WIhFyWGqjL/XUgYIRLBbQPZ0JBIGr9rlH66rr5jXBXUGDIl7NXRlWA==
```

Registry package: https://www.npmjs.com/package/zzq-dev-kit
Source release: https://github.com/zhaozengqing4364-bit/zzq-dev-kit/releases/tag/v1.0.0

The detailed command outputs are retained locally in `artifacts/public-npm-smoke.json`. No code or package contents changed after the passing six-job CI run; only release documentation and task evidence were updated. The public npm smoke ran locally on macOS; cross-platform installation evidence comes from the six packed-artifact CI jobs above.
