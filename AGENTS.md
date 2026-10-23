# zzq-dev-kit engineering

This repository distributes a portable Node CLI and eleven Agent Skills. Keep business-specific rules in the target project, not in this package. Use the existing OpenSpec change for planning and verification.

- Preserve user files. Preflight the complete plan before writing; conflicts must produce no target mutation. Never force-delete an old installation.
- Validate all filesystem paths and reject nested symlinks before writes. Recovery must not overwrite edits made after installation.
- Run tests with explicit temporary user and state directories. Tests must never write to the actual home directory or invoke a target project's scripts.
- Use the real official OpenSpec engine, pinned as a dependency; preserve existing project configuration and schemas. Initialization happens in a temporary staging directory.
- Keep the published file allowlist small. Never publish local evidence, credentials, real project source, or user paths. Preserve upstream license and provenance notices.
- Default Chinese CLI output; JSON is machine-readable. Exit zero only for successful operations. A plan is not an applied install, and installed scaffolding is not a business audit.
