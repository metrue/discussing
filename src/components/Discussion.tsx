'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { formatRelativeTime, renderCommentContent } from '../utils/comment-format'
import type { ExternalDiscussion, Comment, FetchOptions } from '../types'

/** Top-level comments shown before the rest collapse behind a "show more" disclosure. */
const VISIBLE_COMMENTS = 8

interface DiscussionProps {
  discussions?: ExternalDiscussion[]
  className?: string
  fetchOptions?: FetchOptions
  /** Custom Image component for avatar rendering (e.g., Next.js Image) */
  ImageComponent?: React.ComponentType<any>
  /** API endpoint for fetching comments (default: '/api/external-comments') */
  apiEndpoint?: string
  /** Enable refresh functionality */
  enableRefresh?: boolean
  /** Refresh interval in seconds (only if enableRefresh is true) */
  refreshInterval?: number
}

/**
 * Client-side React component for external discussions
 * 
 * Benefits:
 * - Dynamic comment refresh without page reload
 * - Loading states and error handling
 * - Works with any React framework (not just Next.js)
 * - Can implement real-time features
 * 
 * Use this component when:
 * - You need dynamic comment updates
 * - Users should be able to refresh comments
 * - You want loading states and error handling
 * - You're not using Next.js or want framework-agnostic solution
 */
export default function Discussion({ 
  discussions = [], 
  className = '',
  fetchOptions = {},
  ImageComponent,
  apiEndpoint = '/api/external-comments',
  enableRefresh = false,
  refreshInterval = 300 // 5 minutes
}: DiscussionProps) {
  const [commentsByPlatform, setCommentsByPlatform] = useState<Record<string, Comment[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<Record<string, string>>({})

  const fetchCommentsForPlatform = useCallback(async (discussion: ExternalDiscussion): Promise<Comment[]> => {
    try {
      const params = new URLSearchParams({
        platform: discussion.platform,
        url: discussion.url
      })
      
      if (fetchOptions.cacheTimeout) {
        params.append('cacheTimeout', fetchOptions.cacheTimeout.toString())
      }
      
      const response = await fetch(`${apiEndpoint}?${params}`)
      if (!response.ok) throw new Error(`Failed to fetch ${discussion.platform} comments`)
      
      const data = await response.json()
      return data.comments || []
    } catch (error) {
      console.error(`Error fetching comments from ${discussion.platform}:`, error)
      throw error
    }
  }, [apiEndpoint, fetchOptions.cacheTimeout])

  const fetchAllComments = useCallback(async () => {
    const loadingState: Record<string, boolean> = {}
    const errorState: Record<string, string> = {}
    
    discussions.forEach(d => {
      loadingState[d.platform] = true
      errorState[d.platform] = ''
    })
    
    setLoading(loadingState)
    setError(errorState)

    const commentsData: Record<string, Comment[]> = {}
    
    for (const discussion of discussions) {
      try {
        const platformComments = await fetchCommentsForPlatform(discussion)
        commentsData[discussion.platform] = platformComments
      } catch (err) {
        console.error(`Failed to fetch comments from ${discussion.platform}:`, err)
        commentsData[discussion.platform] = []
        errorState[discussion.platform] = err instanceof Error ? err.message : 'Unknown error'
      }
      
      // Update loading state for this platform
      setLoading(prev => ({ ...prev, [discussion.platform]: false }))
    }

    setCommentsByPlatform(commentsData)
    setError(errorState)
  }, [discussions, fetchCommentsForPlatform])

  const refreshComments = useCallback(() => {
    fetchAllComments()
  }, [fetchAllComments])

  useEffect(() => {
    if (discussions.length > 0) {
      fetchAllComments()
    }
  }, [discussions, fetchAllComments])

  // Auto-refresh functionality
  useEffect(() => {
    if (!enableRefresh || refreshInterval <= 0) return

    const interval = setInterval(() => {
      refreshComments()
    }, refreshInterval * 1000)

    return () => clearInterval(interval)
  }, [enableRefresh, refreshInterval, refreshComments])

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'v2ex':
        return 'V2EX'
      case 'reddit':
        return 'Reddit'  
      case 'hackernews':
        return 'Hacker News'
      default:
        return platform
    }
  }

  if (discussions.length === 0) {
    return null
  }

  return (
    <div className={`mt-16 ${className}`}>
      <div className="space-y-14">
        {discussions.map((discussion) => {
          const platformComments = commentsByPlatform[discussion.platform] || []
          const isLoading = loading[discussion.platform]
          const hasError = error[discussion.platform]

          return (
            <section key={`${discussion.platform}-${discussion.url}`}>
              {/* Section divider with platform name */}
              <div className="flex items-center gap-4 mb-10">
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700/70"></div>
                <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
                  <a
                    href={discussion.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    <span>Discussing on</span>
                    <span className="font-semibold text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                      {getPlatformName(discussion.platform)}
                    </span>
                  </a>
                  {isLoading && (
                    <>
                      <span className="text-gray-300 dark:text-gray-600">·</span>
                      <span className="normal-case tracking-normal">Loading…</span>
                    </>
                  )}
                  {enableRefresh && !isLoading && (
                    <>
                      <span className="text-gray-300 dark:text-gray-600">·</span>
                      <button
                        onClick={refreshComments}
                        className="normal-case tracking-normal hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        Refresh
                      </button>
                    </>
                  )}
                </div>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700/70"></div>
              </div>

              {hasError && (
                <div className="text-center py-4">
                  <div className="text-sm text-red-600 dark:text-red-400 mb-2">
                    Failed to load comments: {hasError}
                  </div>
                  <button
                    onClick={refreshComments}
                    className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!hasError && platformComments.length > 0 && (
                <>
                  <div className="space-y-7">
                    {platformComments.slice(0, VISIBLE_COMMENTS).map((comment) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        ImageComponent={ImageComponent}
                      />
                    ))}
                  </div>

                  {platformComments.length > VISIBLE_COMMENTS && (
                    <details className="group mt-7">
                      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden text-xs uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <span className="group-open:hidden">
                          Show {platformComments.length - VISIBLE_COMMENTS} more comments
                        </span>
                        <span className="hidden group-open:inline">Show fewer comments</span>
                      </summary>
                      <div className="space-y-7 mt-7">
                        {platformComments.slice(VISIBLE_COMMENTS).map((comment) => (
                          <CommentItem
                            key={comment.id}
                            comment={comment}
                            ImageComponent={ImageComponent}
                          />
                        ))}
                      </div>
                    </details>
                  )}
                </>
              )}

              {!isLoading && !hasError && platformComments.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">
                  No comments yet.
                </p>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}

function CommentItem({ 
  comment, 
  depth = 0, 
  ImageComponent 
}: { 
  comment: Comment; 
  depth?: number;
  ImageComponent?: DiscussionProps['ImageComponent']
}) {
  const { label: timeLabel, title: timeTitle } = formatRelativeTime(comment.timestamp)

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    const parent = target.parentElement;
    if (parent) {
      parent.innerHTML = comment.author.charAt(0).toUpperCase();
    }
  }

  const size = depth > 0 ? 28 : 36

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div
        className="flex-shrink-0 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 ring-1 ring-black/[0.06] dark:ring-white/10 flex items-center justify-center text-xs font-semibold text-gray-500 dark:text-gray-400 select-none"
        style={{ width: size, height: size }}
      >
        {comment.avatar && ImageComponent ? (
          <ImageComponent
            src={comment.avatar}
            alt={comment.author}
            width={size}
            height={size}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : comment.avatar ? (
          <img
            src={comment.avatar}
            alt={comment.author}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : (
          comment.author.charAt(0).toUpperCase()
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-medium text-[0.9375rem] text-gray-900 dark:text-gray-100 truncate">
            {comment.author}
          </span>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <time title={timeTitle} className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
            {timeLabel}
          </time>
          {comment.votes !== undefined && (
            <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 tabular-nums whitespace-nowrap">
              {comment.votes} points
            </span>
          )}
        </div>
        <div className="text-[0.9375rem] leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
          {renderCommentContent(comment.content)}
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-5 space-y-5 border-l border-gray-100 dark:border-gray-800 pl-4">
            {comment.replies.slice(0, 2).map((reply: Comment) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                ImageComponent={ImageComponent}
              />
            ))}
            {comment.replies.length > 2 && (
              <details className="group/replies">
                <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <span className="group-open/replies:hidden">
                    Show {comment.replies.length - 2} more {comment.replies.length - 2 === 1 ? 'reply' : 'replies'}
                  </span>
                  <span className="hidden group-open/replies:inline">Show fewer replies</span>
                </summary>
                <div className="mt-5 space-y-5">
                  {comment.replies.slice(2).map((reply: Comment) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      depth={depth + 1}
                      ImageComponent={ImageComponent}
                    />
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  )
}