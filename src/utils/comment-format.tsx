import React from 'react'

/**
 * Format a timestamp as a compact relative label (e.g. "3 days ago"),
 * along with a full absolute string suitable for a `title` tooltip.
 */
export function formatRelativeTime(timestamp: string): { label: string; title: string } {
  const date = new Date(timestamp)

  if (isNaN(date.getTime())) {
    return { label: timestamp, title: timestamp }
  }

  const title = date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'} ago`

  if (seconds < 45) return { label: 'just now', title }
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return { label: plural(minutes, 'min'), title }
  const hours = Math.round(minutes / 60)
  if (hours < 24) return { label: plural(hours, 'hour'), title }
  const days = Math.round(hours / 24)
  if (days < 7) return { label: plural(days, 'day'), title }
  const weeks = Math.round(days / 7)
  if (days < 30) return { label: plural(weeks, 'week'), title }
  const months = Math.round(days / 30)
  if (days < 365) return { label: plural(months, 'month'), title }
  const years = Math.round(days / 365)
  return { label: plural(years, 'year'), title }
}

/**
 * Normalize comment whitespace, then render it as React nodes with
 * `@mentions` styled as subtle reply tokens and bare URLs turned into links.
 *
 * The returned text segments preserve newlines, so the host element should
 * still use `whitespace-pre-wrap`.
 */
export function renderCommentContent(raw: string): React.ReactNode[] {
  // Normalize whitespace.
  let text = raw.replace(/\r\n/g, '\n').trim()
  // Collapse 3+ blank lines down to a single blank line.
  text = text.replace(/\n{3,}/g, '\n\n')
  // Drop the dead gap between leading @mentions and the reply body.
  text = text.replace(/^((?:@[A-Za-z0-9_-]+[ \t]*)+)\n\s*\n/, '$1\n')

  const nodes: React.ReactNode[] = []
  const pattern = /(https?:\/\/[^\s]+)|(@[A-Za-z0-9_-]+)/g
  let lastIndex = 0
  let key = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    if (match[1]) {
      // URL — strip trailing sentence punctuation so it isn't swallowed by the link.
      let url = match[1]
      let trailing = ''
      const punct = url.match(/[.,;:!?)\]}'"]+$/)
      if (punct) {
        trailing = punct[0]
        url = url.slice(0, -trailing.length)
      }
      nodes.push(
        <a
          key={`link-${key++}`}
          href={url}
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline break-all"
        >
          {url}
        </a>
      )
      if (trailing) nodes.push(trailing)
    } else if (match[2]) {
      nodes.push(
        <span key={`mention-${key++}`} className="font-medium text-gray-500 dark:text-gray-400">
          {match[2]}
        </span>
      )
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}
