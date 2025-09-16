import { NextRequest, NextResponse } from 'next/server'
import { fetchCommentsForPlatform } from '../utils/fetch-comments'
import type { ExternalDiscussion } from '../types'

/**
 * Next.js App Router API route handler for fetching external comments.
 * This handler acts as a CORS proxy for fetching comments from external platforms.
 * 
 * Usage in your app/api/external-comments/route.ts:
 * ```ts
 * export { GET } from 'discussing/api'
 * ```
 * 
 * Or with custom configuration:
 * ```ts
 * import { createCommentHandler } from 'discussing/api'
 * export const GET = createCommentHandler({ 
 *   cacheControl: 'public, s-maxage=600'
 * })
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform') as ExternalDiscussion['platform']
    const url = searchParams.get('url')

    if (!platform || !url) {
      return NextResponse.json(
        { error: 'Platform and URL parameters are required' },
        { status: 400 }
      )
    }

    if (!['v2ex', 'reddit', 'hackernews'].includes(platform)) {
      return NextResponse.json(
        { error: `Unsupported platform: ${platform}` },
        { status: 400 }
      )
    }

    const comments = await fetchCommentsForPlatform({ platform, url })

    return NextResponse.json({ comments }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400', // Cache for 5 minutes, serve stale up to 1 day
      },
    })
  } catch (error) {
    console.error('Error in external-comments API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

/**
 * Factory function to create a custom comment handler with configuration
 */
export function createCommentHandler(options: {
  cacheControl?: string
  allowedPlatforms?: ExternalDiscussion['platform'][]
} = {}) {
  const {
    cacheControl = 'public, s-maxage=300, stale-while-revalidate=86400',
    allowedPlatforms = ['v2ex', 'reddit', 'hackernews']
  } = options

  return async function handler(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const platform = searchParams.get('platform') as ExternalDiscussion['platform']
      const url = searchParams.get('url')

      if (!platform || !url) {
        return NextResponse.json(
          { error: 'Platform and URL parameters are required' },
          { status: 400 }
        )
      }

      if (!allowedPlatforms.includes(platform)) {
        return NextResponse.json(
          { error: `Unsupported platform: ${platform}` },
          { status: 400 }
        )
      }

      const comments = await fetchCommentsForPlatform({ platform, url })

      return NextResponse.json({ comments }, {
        headers: {
          'Cache-Control': cacheControl,
        },
      })
    } catch (error) {
      console.error('Error in external-comments API:', error)
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }
  }
}