## Why
The existing ten ZZQ skills are installed manually. New environments and existing projects need a reproducible npx entry that installs a complete skill set and connects the project's own rules without overwriting them.

## What Changes
- Ship `zzq-dev-kit` with `init`, `install`, `doctor`, `upgrade`, `rollback`, and an official `openspec` proxy.
- Bundle the ten portable skills and a setup skill that performs evidence-led project onboarding.
- Plan all file changes, detect conflicts before mutation, record recoverable transactions, and preserve user edits.
- Support new projects, existing projects, existing/custom OpenSpec, Codex and Claude, and user/project installation scopes.
- Publish a reviewed source repository and an npm package only after pack-install tests and independent review.

## Capabilities
### New Capabilities
- `kit-installation`: safe, repeatable skill and project integration with inspection and recovery.
### Modified Capabilities
None.

## Impact
A standalone Node package and generated project/user-owned tooling files. No application dependencies or production writes are added to target projects. Existing OpenSpec contracts and project rules remain authoritative.
