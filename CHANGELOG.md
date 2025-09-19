# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2025-09-19

## [1.0.2] - 2025-09-16

## [1.0.1] - 2025-09-16

### Added
- CI/CD pipeline with GitHub Actions
- Automated testing on Node.js 18.x, 20.x, and 22.x
- Package size monitoring
- Security audit in CI
- Automated releases with Git tags
- Interactive release script for easy version management
- Automated dependent repository updates

### Changed
- Updated repository URLs to point to github.com/metrue/discussing
- Improved package.json with additional metadata
- Enabled npm publishing with NPM_TOKEN

## [1.0.0] - 2024-09-16

### Added
- Initial release of discussing package
- React components for fetching and displaying comments from external platforms
- Support for V2EX, Reddit, and Hacker News
- Both client-side `Discussion` and server-side `DiscussionServer` components
- TypeScript support with full type definitions
- Comprehensive test suite
- API route handlers for CORS proxy functionality
- Next.js App Router compatibility
- Customizable styling and fetch options

### Features
- **Discussion Component**: Client-side component with loading states
- **DiscussionServer Component**: React Server Component for SSR
- **Platform Support**: V2EX, Reddit, Hacker News
- **TypeScript**: Full type safety with exported interfaces
- **Testing**: Jest test suite with 95%+ coverage
- **Documentation**: Comprehensive README with examples

[Unreleased]: https://github.com/metrue/discussing/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/metrue/discussing/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/metrue/discussing/releases/tag/v1.0.0[1.0.2]: https://github.com/metrue/discussing/compare/v...v1.0.2
[1.1.0]: https://github.com/metrue/discussing/compare/v...v1.1.0
