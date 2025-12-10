'use client'

import { Post } from '@/app/actions'
import FlameTimer from './flameTimer'

export default function Message({ post }: { post: Post }) {
  return (
    <div className="post-card">
      <div className="post-grid">
        <div className="post-author">
          {post.author_name}
        </div>
        <div className="post-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.5rem' }}>
            <span>{post.content_text}</span>
            {post.expires_at && <FlameTimer expiresAt={post.expires_at} />}
          </div>
        </div>
      </div>
    </div>
  )
}