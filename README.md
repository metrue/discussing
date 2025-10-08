# Discussing

**Effortlessly integrate discussions from V2EX, Reddit, and Hacker News into your React applications with zero configuration.**

> Test change to verify CI automation works properly.

## Installation

```bash
npm install discussing
```

## Usage

```tsx
import { DiscussionServer } from 'discussing'

export default async function BlogPost() {
  const discussions = [
    {
      platform: 'hackernews' as const,
      url: 'https://news.ycombinator.com/item?id=12345'
    },
    {
      platform: 'reddit' as const,
      url: 'https://reddit.com/r/programming/comments/abc123/'
    },
    {
      platform: 'v2ex' as const,
      url: 'https://v2ex.com/t/12345'
    }
  ]

  return (
    <article>
      <h1>My Blog Post</h1>
      <p>Blog content here...</p>
      
      <DiscussionServer discussions={discussions} />
    </article>
  )
}
```

## Live Example

Check out [blog.minghe.me](https://blog.minghe.me) to see it in action.

## License

MIT