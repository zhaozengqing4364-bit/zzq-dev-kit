# Kit installation

## Purpose
Provide a repeatable development-tool setup that preserves the target project's rules, detects conflicts, and makes its own changes inspectable and recoverable.

## ADDED Requirements

### Requirement: Complete skill installation
The kit SHALL install all ten development skills and the setup skill into the selected Codex and/or Claude scope, with their relative references intact.

#### Scenario: Fresh machine
- **WHEN** the user initializes a project with an empty selected skill directory
- **THEN** all eleven skills and a resolvable official OpenSpec invocation are available

### Requirement: Preserve existing projects
The kit SHALL preserve existing OpenSpec configuration, schemas, business source, package scripts, and rule text outside its explicit managed block.

#### Scenario: Existing custom workflow
- **WHEN** an existing project with a custom Schema and rules is connected
- **THEN** its original configuration and rules remain effective without being replaced by a bundled project preset

### Requirement: Conflict preflight
The kit SHALL detect conflicting or modified files and unsafe symlinks before applying any target changes, report the exact paths, and require a separate user decision to replace them.

#### Scenario: Conflicting skill
- **WHEN** one requested skill differs from an unowned installation
- **THEN** installation exits nonzero without modifying any selected skill or project file

### Requirement: Repeatability
The kit SHALL make repeated initialization a no-op for unchanged managed files and preserve user changes outside managed rule blocks.

#### Scenario: Second initialization
- **WHEN** the same version is initialized twice
- **THEN** the second run creates no duplicate rule blocks, files, or transaction

### Requirement: Versioned recovery
The kit SHALL record before and after contents for its mutations and restore only files whose current contents are consistent with that transaction.

#### Scenario: User edit after installation
- **WHEN** rollback encounters a subsequent edit to a modified file
- **THEN** rollback refuses before changing any file and reports the conflict

#### Scenario: Interrupted installation
- **WHEN** a previous transaction has not completed
- **THEN** a subsequent mutation stops and identifies the recovery action

### Requirement: Inspection and dry runs
The kit SHALL support a read-only doctor and a dry-run plan, with meaningful exit status and structured JSON output.

#### Scenario: Preview without mutation
- **WHEN** initialization is requested with dry-run
- **THEN** planned changes and conflicts are reported without writing project or user installation files

### Requirement: Separate integration from understanding
The setup skill SHALL investigate the target project's facts after installation, preserve unresolved decisions, and keep business rules in the existing project-owned sources.

#### Scenario: Existing application onboarding
- **WHEN** the setup skill is invoked after CLI initialization
- **THEN** it inspects project rules and scripts without treating scaffolding as a complete business audit or running application scripts merely for installation
