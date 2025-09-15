// Hybrid export for both client and server components
export { default as ExternalComments } from './components/ExternalComments'
export { default as ExternalCommentsServer } from './components/ExternalCommentsServer'

// Re-export types and utilities
export type { ExternalDiscussion, Comment, FetchOptions } from './lib/external-comments'
export { 
  fetchCommentsForPlatform, 
  fetchAllExternalComments,
  fetchV2exComments,
  fetchRedditComments,
  fetchHackerNewsComments
} from './lib/external-comments'