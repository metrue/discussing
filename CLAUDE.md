# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Building and Testing
- `npm run build` - TypeScript compilation to dist/ directory
- `npm test` - Run Jest test suite
- `npm run test:watch` - Run tests in watch mode for development
- `npm run test:coverage` - Generate test coverage report
- `./build.sh` - Complete build validation script with testing

### Package Management
- `npm run prepack` - Clean and build before packaging
- `npm run prepublishOnly` - Build and test before publishing
- `npm run clean` - Remove dist/ directory

## Architecture Overview

This is a React library for fetching and displaying comments from external discussion platforms (V2EX, Reddit, Hacker News). The package provides both Server Components for optimal performance and Client Components for dynamic functionality.

### Core Components

**Two main component approaches:**
- `DiscussionServer` - React Server Component (zero client-side JS, better SEO, server-side caching)
- `Discussion` - Client Component (dynamic refresh, loading states, works with any React framework)

### Module Structure

```
src/
├── components/           # React components
│   ├── Discussion.tsx    # Client component with refresh functionality
│   └── DiscussionServer.tsx # Server component for optimal performance
├── utils/
│   └── fetch-comments.ts # Platform-specific comment fetching utilities
├── api/                  # Next.js API route handlers (optional)
│   ├── route-handler.ts  # App Router handler
│   └── pages-handler.ts  # Pages Router handler
├── types.ts             # TypeScript type definitions
└── index.ts             # Main exports with legacy compatibility
```

### Platform Support

The library supports three platforms with specific URL patterns:
- **V2EX**: `v2ex.com/t/{ID}` - Uses V2EX JSON API
- **Reddit**: `reddit.com/r/{subreddit}/comments/{ID}/` - Appends `.json` to URL
- **Hacker News**: `news.ycombinator.com/item?id={ID}` - Uses Algolia HN API

### Key Technical Patterns

**Component Selection:**
- Use `DiscussionServer` for Next.js App Router with static/ISR pages
- Use `Discussion` for dynamic functionality or non-Next.js frameworks

**Fetch Strategy:**
- Server components fetch at build/request time using utility functions
- Client components fetch via API routes or direct fetch with CORS handling
- Platform-specific parsers handle different comment structures and nested replies

**Caching:**
- Server components leverage Next.js `revalidate` options
- Configurable cache timeout via `FetchOptions.cacheTimeout`
- Client components can implement auto-refresh with `refreshInterval`

### Testing Setup

Tests use Jest with:
- Mocked global `fetch` for API calls
- Mocked Next.js `Image` component
- Coverage thresholds set to 70% across all metrics
- Setup file at `tests/setup.ts` configures test environment

### Export Strategy

The package exports both new and legacy names for backward compatibility:
- New: `Discussion`, `DiscussionServer`
- Legacy: `ExternalComments`, `ExternalCommentsServer`
- Utilities: Individual fetch functions for custom implementations
- Types: `Comment`, `ExternalDiscussion`, `FetchOptions`

### Next.js Integration

**App Router Pattern:**
```tsx
// Server component usage
import { DiscussionServer } from 'discussing'

export default async function Page() {
  return <DiscussionServer discussions={discussions} />
}
```

**Pages Router Pattern:**
```tsx
// Client component usage
import { Discussion } from 'discussing'

export default function Page() {
  return <Discussion discussions={discussions} enableRefresh={true} />
}
```

### Error Handling

The library implements graceful degradation:
- Failed platform fetches return empty arrays rather than throwing
- Client components show retry buttons on error states
- Console logging for debugging while maintaining user experience