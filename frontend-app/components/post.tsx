'use client'

import { Post } from '@/app/actions'

export default function Message({ post }: { post: Post }) {
  return (
    <div className="post-card">
      <div className="post-grid">
        <div className="post-author">
          {post.author_name}
        </div>
        <div className="post-content">
          {post.content_text}
        </div>
      </div>
    </div>
  )
}