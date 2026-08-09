/**
 * E2E rendering tests for DiscussionServer — verifies the collapsible
 * "Show more" disclosure has been removed and all comments/replies render.
 *
 * @jest-environment node
 */

import { renderToString } from 'react-dom/server'
import type { ExternalDiscussion, Comment } from '../../src/types'

// Mock the fetch-comments module BEFORE the component is imported
jest.mock('../../src/utils/fetch-comments', () => ({
  fetchAllExternalComments: jest.fn(),
}))

// Import the async SUT after mocks are in place
// DiscussionServer is the default export
const DiscussionServerPromise = import('../../src/components/DiscussionServer')

// Helper: a realistic Comment factory so tests mirror real data shapes
function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: overrides.id ?? `comment-${Math.random().toString(36).slice(2, 8)}`,
    author: overrides.author ?? 'testuser',
    content: overrides.content ?? 'This is a test comment.',
    timestamp: overrides.timestamp ?? '2025-01-15T10:00:00.000Z',
    platform: overrides.platform ?? 'hackernews',
    votes: overrides.votes,
    replies: overrides.replies,
    avatar: overrides.avatar,
  }
}

function buildDiscussion(
  platform: ExternalDiscussion['platform'] = 'hackernews',
): ExternalDiscussion {
  return { platform, url: `https://example.com/${platform}/12345` }
}

describe('DiscussionServer — no collapsible disclosure', () => {
  let DiscussionServer: any
  let fetchAllExternalComments: jest.Mock

  beforeAll(async () => {
    const mod = await DiscussionServerPromise
    DiscussionServer = mod.default
    const fetchMod = await import('../../src/utils/fetch-comments')
    fetchAllExternalComments = fetchMod.fetchAllExternalComments as jest.Mock
  })

  beforeEach(() => {
    fetchAllExternalComments.mockReset()
  })

  it('renders all top-level comments immediately (no <details> / "Show more")', async () => {
    const COUNT = 15 // well above the old VISIBLE_COMMENTS = 8
    const comments: Comment[] = Array.from({ length: COUNT }, (_, i) =>
      makeComment({ id: `c-${i}`, author: `user-${i}` }),
    )

    fetchAllExternalComments.mockResolvedValueOnce({
      hackernews: comments,
    })

    const element = await DiscussionServer({
      discussions: [buildDiscussion('hackernews')],
    })
    const html = renderToString(element)

    // Must NOT contain a collapsible disclosure
    expect(html).not.toContain('<details')
    expect(html).not.toContain('<summary')
    expect(html).not.toContain('Show')
    expect(html).not.toContain('more comments')

    // All 15 authors must appear in the rendered HTML
    for (const c of comments) {
      expect(html).toContain(c.author)
    }
  })

  it('renders all nested replies immediately (no collapsible)', async () => {
    const replies: Comment[] = Array.from({ length: 5 }, (_, i) =>
      makeComment({ id: `reply-${i}`, author: `replier-${i}`, content: `Reply ${i}` }),
    )

    const topLevel: Comment[] = [
      makeComment({
        id: 'parent',
        author: 'original-poster',
        content: 'Parent comment',
        replies,
      }),
    ]

    fetchAllExternalComments.mockResolvedValueOnce({
      hackernews: topLevel,
    })

    const element = await DiscussionServer({
      discussions: [buildDiscussion('hackernews')],
    })
    const html = renderToString(element)

    // No collapsible for replies either
    expect(html).not.toContain('<details')
    expect(html).not.toContain('<summary')
    expect(html).not.toContain('Show')
    expect(html).not.toContain('more replies')

    // All 5 replies visible
    for (const r of replies) {
      expect(html).toContain(r.author)
      expect(html).toContain(r.content)
    }
  })

  it('renders empty state when no comments', async () => {
    fetchAllExternalComments.mockResolvedValueOnce({
      hackernews: [],
    })

    const element = await DiscussionServer({
      discussions: [buildDiscussion('hackernews')],
    })
    const html = renderToString(element)

    expect(html).toContain('No comments yet')
    expect(html).not.toContain('<details')
  })

  it('renders multiple platform sections without collapsible', async () => {
    const hnComments: Comment[] = Array.from({ length: 12 }, (_, i) =>
      makeComment({ id: `hn-${i}`, author: `hn-user-${i}`, platform: 'hackernews' }),
    )
    const redditComments: Comment[] = Array.from({ length: 9 }, (_, i) =>
      makeComment({ id: `rdt-${i}`, author: `reddit-user-${i}`, platform: 'reddit' }),
    )

    fetchAllExternalComments.mockResolvedValueOnce({
      hackernews: hnComments,
      reddit: redditComments,
    })

    const element = await DiscussionServer({
      discussions: [
        buildDiscussion('hackernews'),
        buildDiscussion('reddit'),
      ],
    })
    const html = renderToString(element)

    expect(html).not.toContain('<details')
    expect(html).not.toContain('<summary')

    // All users from both platforms present
    for (const c of [...hnComments, ...redditComments]) {
      expect(html).toContain(c.author)
    }
  })
})
