# Changelog

All notable changes to this project are documented below, following [Semantic Versioning](http://semver.org/) guidelines.

## [2.0.1] - 2023-10-09
### Added
- Added support for ESM (ECMAScript Modules) and CJS (CommonJS Modules).
- Implemented unit tests for improved code reliability.

## [2.0.0] - 2023-06-30
### Added
- Support for JIRA Token for enhanced security in authentication.
- Flexibility to specify the JIRA protocol (HTTP or HTTPS) for connection configuration.

### Changed
- Compatibility with JIRA Version 9 and above, discontinuing support for older versions.
- Migrated to 'axios' and 'axios-retry' for improved performance, reliability, and error handling.

### Removed
- Unnecessary development packages 'denodeify' and 'recursive-readdir'.

### New
- Feature file linting method for better code quality and consistency.

## [1.0.2] - 2022-10-12
### Added
- Support for various JIRA issue types for Test Set and Test Execution.

## [1.0.1] - 2022-09-06
### Fixed
- Addressed vulnerable dependencies without functional breakage.

## [1.0.0] - 2022-07-19
### Initial Release
- Support for JIRA Version 8 and below, enabling JIRA integration.
