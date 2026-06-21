import React from 'react'
import { fetchAllExternalComments } from '../utils/fetch-comments'
import { formatRelativeTime, renderCommentContent } from '../utils/comment-format'
import type { ExternalDiscussion, Comment, FetchOptions } from '../types'

/** Top-level comments shown before the rest collapse behind a "show more" disclosure. */
const VISIBLE_COMMENTS = 8

interface DiscussionServerProps {
  discussions?: ExternalDiscussion[]
  className?: string
  fetchOptions?: FetchOptions
  /** Custom Image component for avatar rendering (e.g., Next.js Image) */
  ImageComponent?: React.ComponentType<any>
}

/**
 * React Server Component for external discussions
 * 
 * Benefits:
 * - Zero JavaScript bundle impact
 * - Comments render immediately with page load
 * - Better SEO (comments in initial HTML)
 * - Server-side caching with Next.js revalidation
 * 
 * Use this component when:
 * - You want maximum performance
 * - Comments don't need to refresh without page reload
 * - You're using Next.js with App Router
 */
export default async function DiscussionServer({ 
  discussions = [], 
  className = '',
  fetchOptions = {},
  ImageComponent
}: DiscussionServerProps) {
  if (discussions.length === 0) {
    return null
  }

  // Fetch all comments on the server
  const commentsByPlatform = await fetchAllExternalComments(discussions, fetchOptions)

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

  return (
    <div className={`mt-16 ${className}`}>
      <div className="space-y-14">
        {discussions.map((discussion) => {
          const platformComments = commentsByPlatform[discussion.platform] || []

          return (
            <section key={`${discussion.platform}-${discussion.url}`}>
              {/* Section divider with platform name */}
              <div className="flex items-center gap-4 mb-10">
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700/70"></div>
                <a
                  href={discussion.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  <span>Discussing on</span>
                  <span className="font-semibold text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                    {getPlatformName(discussion.platform)}
                  </span>
                </a>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700/70"></div>
              </div>

              {platformComments.length > 0 ? (
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
              ) : (
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
  ImageComponent?: DiscussionServerProps['ImageComponent']
}) {
  const { label: timeLabel, title: timeTitle } = formatRelativeTime(comment.timestamp)
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
          />
        ) : comment.avatar ? (
          <img
            src={comment.avatar}
            alt={comment.author}
            className="w-full h-full object-cover"
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