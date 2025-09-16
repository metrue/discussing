#!/bin/bash

# discussing Package Release Script
# Usage: ./scripts/release.sh [patch|minor|major|prerelease]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    printf "${1}${2}${NC}\n"
}

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_color $RED "❌ Error: Must be on main branch to release. Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    print_color $RED "❌ Error: Working directory must be clean before release"
    git status --short
    exit 1
fi

# Get version type from argument or prompt
VERSION_TYPE=${1:-}
if [ -z "$VERSION_TYPE" ]; then
    print_color $BLUE "Select version bump type:"
    echo "1) patch (1.0.0 -> 1.0.1)"
    echo "2) minor (1.0.0 -> 1.1.0)"
    echo "3) major (1.0.0 -> 2.0.0)"
    echo "4) prerelease (1.0.0 -> 1.0.1-alpha.0)"
    read -p "Enter choice (1-4): " choice
    
    case $choice in
        1) VERSION_TYPE="patch";;
        2) VERSION_TYPE="minor";;
        3) VERSION_TYPE="major";;
        4) VERSION_TYPE="prerelease";;
        *) print_color $RED "❌ Invalid choice"; exit 1;;
    esac
fi

# Validate version type
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major|prerelease)$ ]]; then
    print_color $RED "❌ Error: Invalid version type. Must be patch, minor, major, or prerelease"
    exit 1
fi

print_color $YELLOW "🔄 Starting release process..."

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_color $BLUE "📋 Current version: $CURRENT_VERSION"

# Pull latest changes
print_color $YELLOW "🔄 Pulling latest changes..."
git pull origin main

# Install dependencies and run tests
print_color $YELLOW "🔄 Installing dependencies..."
npm ci

print_color $YELLOW "🧪 Running tests..."
npm test

print_color $YELLOW "🏗️  Building package..."
npm run build

# Bump version
print_color $YELLOW "⬆️  Bumping version ($VERSION_TYPE)..."
if [ "$VERSION_TYPE" = "prerelease" ]; then
    NEW_VERSION=$(npm version prerelease --preid=alpha --no-git-tag-version)
else
    NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version)
fi

NEW_VERSION=${NEW_VERSION#v} # Remove 'v' prefix
print_color $GREEN "✅ New version: $NEW_VERSION"

# Update CHANGELOG
print_color $YELLOW "📝 Updating CHANGELOG.md..."
DATE=$(date +%Y-%m-%d)

# Create backup of CHANGELOG
cp CHANGELOG.md CHANGELOG.md.bak

# Update CHANGELOG
if command -v sed >/dev/null 2>&1; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/## \[Unreleased\]/## [Unreleased]\n\n## [$NEW_VERSION] - $DATE/" CHANGELOG.md
    else
        # Linux
        sed -i "s/## \[Unreleased\]/## [Unreleased]\n\n## [$NEW_VERSION] - $DATE/" CHANGELOG.md
    fi
    
    # Add compare link
    echo "[$NEW_VERSION]: https://github.com/metrue/discussing/compare/v$CURRENT_VERSION...v$NEW_VERSION" >> CHANGELOG.md
else
    print_color $YELLOW "⚠️  sed not available, please manually update CHANGELOG.md"
fi

# Show changes and confirm
print_color $BLUE "📋 Changes to be committed:"
git diff --name-only
echo ""
git diff package.json CHANGELOG.md

print_color $YELLOW "❓ Do you want to continue with the release? (y/N)"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    print_color $YELLOW "🚫 Release cancelled"
    # Restore files
    git checkout -- package.json
    mv CHANGELOG.md.bak CHANGELOG.md
    exit 0
fi

# Commit and tag
print_color $YELLOW "📝 Committing changes..."
git add package.json CHANGELOG.md
git commit -m "chore: release v$NEW_VERSION

- Bump version to $NEW_VERSION
- Update CHANGELOG.md

🤝 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

print_color $YELLOW "🏷️  Creating tag..."
git tag "v$NEW_VERSION"

print_color $YELLOW "⬆️  Pushing to GitHub..."
git push origin main
git push origin "v$NEW_VERSION"

# Clean up backup
rm -f CHANGELOG.md.bak

print_color $GREEN "🎉 Release v$NEW_VERSION completed successfully!"
print_color $BLUE "📦 GitHub Actions will now:"
print_color $BLUE "   • Run CI tests"
print_color $BLUE "   • Create GitHub release"
print_color $BLUE "   • Publish to npm"
print_color $BLUE ""
print_color $BLUE "🔗 View release: https://github.com/metrue/discussing/releases/tag/v$NEW_VERSION"
print_color $BLUE "🔗 View actions: https://github.com/metrue/discussing/actions"