# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).

## [2.0.0] - 2023-06-30
- Added support for JIRA Token, allowing enhanced security for authentication.
- Made changes to support JIRA Version 9 and above, resulting in dropping support for lower JIRA versions. This ensures compatibility with the latest JIRA features and improvements.
- Introduced a new parameter to specify the JIRA protocol (HTTP or HTTPS) for greater flexibility in connection configuration.
- Migrated the underlying HTTP library from 'superagent' to 'axios' and 'axios-retry' for improved performance, reliability, and error handling.
- Removed unnecessary development packages, 'denodeify' and 'recursive-readdir', to streamline the plugin's dependencies.
- Added a new method to facilitate independent linting of feature files, enabling better code quality and consistency.

## [1.0.2] - 2022-10-12
- Added support for JIRA issue type for Test Set and Test Execution, both with and without the prefix 'XRAY'. This expands the range of supported issue types for test management.

## [1.0.1] - 2022-09-06
- Fixed vulnerable dependencies without causing any functional breakage. This ensures the plugin remains secure and up-to-date.

## [1.0.0] - 2022-07-19
- Initial version of the plugin released, providing support for JIRA Version 8 and below. This marked the beginning of the plugin's journey, allowing users to integrate JIRA functionality into their projects.