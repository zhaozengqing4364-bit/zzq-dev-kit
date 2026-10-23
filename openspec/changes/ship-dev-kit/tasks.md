## 1. Installation and onboarding
- [x] 1.1 Package the ten skills, setup workflow, attribution, pinned engine and portable CLI.
- [x] 1.2 Implement whole-plan preflight, owned mutations, managed rule blocks, manifests and safe recovery.
- [x] 1.3 Implement init/install/doctor/upgrade/rollback and pinned OpenSpec forwarding.

## 2. Validation
- [x] 2.1 Cover empty/old/custom projects, idempotence, rule preservation, conflicting files, symlinks, interrupted writes and drift-aware recovery with isolated tests.
- [x] 2.2 Verify the packed artifact using real npm/npx and official OpenSpec in temporary homes.
- [x] 2.3 Independently inspect usability and failure cases, resolve findings, and run Linux/macOS/Windows CI.

## 3. Release
- [x] 3.1 Document actual commands, limitations, ownership and recovery; inspect the publication file list and license provenance.
- [x] 3.2 Publish the source and immutable release artifact, publish npm, and verify the public one-command path.

## Release result

- Source repository and immutable GitHub v1.0.0 tarball release are published and publicly smoke-tested.
- The initial npm E403 publication gate was resolved by user account verification; npm 1.0.0 is public and the latest tag resolves to it.
- Registry and downloaded tarball integrity match the reviewed artifact. Public short-command init/doctor/default launcher/rollback passed in new and existing isolated projects with a fresh cache.
- Evidence and limits are recorded in docs/release-validation.md. This change remains unarchived; publication does not imply target-project business acceptance.
