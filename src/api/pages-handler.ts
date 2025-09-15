import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchCommentsForPlatform } from '../utils/fetch-comments'
import type { ExternalDiscussion } from '../types'

/**
 * Next.js Pages Router API handler for fetching external comments.
 * 
 * Usage in your pages/api/external-comments.ts:
 * ```ts
 * export { default } from 'discussing/api/pages'
 * ```
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const platform = req.query.platform as ExternalDiscussion['platform']
    const url = req.query.url as string

    if (!platform || !url) {
      return res.status(400).json({ 
        error: 'Platform and URL parameters are required' 
      })
    }

    if (!['v2ex', 'reddit', 'hackernews'].includes(platform)) {
      return res.status(400).json({ 
        error: `Unsupported platform: ${platform}` 
      })
    }

    const comments = await fetchCommentsForPlatform({ platform, url })

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
    return res.status(200).json({ comments })
  } catch (error) {
    console.error('Error in external-comments API:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch comments' 
    })
  }
}