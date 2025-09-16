# Release Process

This document describes how to release new versions of the discussing package.

## Overview

The discussing package uses automated CI/CD with multiple release methods:

1. **Manual Script Release** (Recommended)
2. **GitHub Actions Manual Trigger**
3. **Direct Git Tagging**

## Prerequisites

### Required Secrets (for npm publishing)

Add these secrets to the GitHub repository settings:

- `NPM_TOKEN`: npm authentication token for publishing
- `COFE_UPDATE_TOKEN` (optional): GitHub token for auto-updating dependent repos

### Getting npm Token

1. Login to [npmjs.com](https://www.npmjs.com)
2. Go to Account Settings → Access Tokens
3. Generate "Automation" token
4. Add to GitHub repository secrets as `NPM_TOKEN`

## Release Methods

### Method 1: Manual Script (Recommended)

The easiest way to release is using the provided script:

```bash
# For patch release (1.0.0 → 1.0.1)
./scripts/release.sh patch

# For minor release (1.0.0 → 1.1.0)
./scripts/release.sh minor

# For major release (1.0.0 → 2.0.0)
./scripts/release.sh major

# For prerelease (1.0.0 → 1.0.1-alpha.0)
./scripts/release.sh prerelease
```

The script will:
- ✅ Verify you're on main branch with clean working directory
- ✅ Run tests and build
- ✅ Bump version in package.json
- ✅ Update CHANGELOG.md
- ✅ Create git commit and tag
- ✅ Push to GitHub
- ✅ Trigger automated npm publishing

### Method 2: GitHub Actions Manual Trigger

1. Go to [Actions → Version Bump](https://github.com/metrue/discussing/actions/workflows/version-bump.yml)
2. Click "Run workflow"
3. Select version bump type
4. Click "Run workflow"

This will automatically handle versioning and trigger release.

### Method 3: Direct Git Tagging

For quick releases:

```bash
# Update version manually
npm version patch  # or minor, major, prerelease

# Push with tags
git push --follow-tags
```

## What Happens After Release

When a release is triggered (any method), the following automated workflows run:

### 1. Release Workflow (`release.yml`)
- ✅ Runs tests and builds package
- ✅ Creates GitHub release with changelog
- ✅ Publishes to npm registry
- ✅ Uploads package tarball to release

### 2. Dependent Repository Updates (`update-dependent-repos.yml`)
- ✅ Automatically updates Cofe repository
- ✅ Downloads new package version
- ✅ Creates pull request with update
- ✅ Provides changelog and links

## Version Strategy

We follow [Semantic Versioning](https://semver.org/):

- **Patch** (1.0.1): Bug fixes, no breaking changes
- **Minor** (1.1.0): New features, backwards compatible
- **Major** (2.0.0): Breaking changes
- **Prerelease** (1.0.1-alpha.0): Pre-release versions

## Changelog

The `CHANGELOG.md` is automatically updated during releases with:
- Version number and date
- Link to compare changes
- Section for manual change descriptions

Remember to manually add change descriptions to the "Unreleased" section before releasing.

## Troubleshooting

### npm publish fails
- Check `NPM_TOKEN` secret is set correctly
- Verify you have publish permissions to the package
- Check if version already exists on npm

### Git push fails
- Ensure you have push permissions to the repository
- Check if tag already exists: `git tag -l`

### Tests fail
- Fix tests before releasing
- All tests must pass for release to proceed

### Dependent repo update fails
- Check `COFE_UPDATE_TOKEN` secret (optional)
- Verify repository permissions
- May require manual update if automated PR fails

## Emergency Releases

For urgent fixes:

1. Create hotfix branch from main
2. Make minimal changes
3. Use patch version bump
4. Test thoroughly
5. Release using any method above

## Post-Release Checklist

After each release:

- [ ] Verify npm package is published
- [ ] Check GitHub release is created
- [ ] Review automated PR in dependent repositories
- [ ] Update any documentation if needed
- [ ] Announce release if significant changes