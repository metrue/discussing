// Main exports for the discussing package
export { default as Discussion } from './components/Discussion'
export { default as DiscussionServer } from './components/DiscussionServer'

// Legacy exports for backward compatibility
export { default as ExternalComments } from './components/Discussion'
export { default as ExternalCommentsServer } from './components/DiscussionServer'

// Utility functions for custom implementations
export { 
  fetchCommentsForPlatform, 
  fetchAllExternalComments,
  fetchV2exComments,
  fetchRedditComments,
  fetchHackerNewsComments
} from './utils/fetch-comments'

// API route handlers for Next.js (optional - only needed if using client-side Discussion component)
export { GET as discussionRouteHandler, createCommentHandler } from './api/route-handler'
export { default as discussionPagesHandler } from './api/pages-handler'

// Type definitions
export type { 
  Comment, 
  ExternalDiscussion, 
  FetchOptions 
} from './types'