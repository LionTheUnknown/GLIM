'use client'

import { Post } from '@/app/actions'
import FlameTimer from './flameTimer'
import { Card } from 'primereact/card'

export default function Message({ post }: { post: Post }) {
  return (
    <Card className="post-card">
      <div className="post-grid">
        <div className="post-author">
          <div className="post-author-name">{post.author_name}</div>
          {post.category && (
            <div className="post-category">{post.category}</div>
          )}
        </div>
        <div className="post-author-divider"></div>
        <div className="post-content">
          <div className="post-content-wrapper">
            <div className="post-text">
              {post.content_text}
            </div>
            {post.expires_at && (
              <>
                <div className="post-divider"></div>
                <div className="post-flame-container">
                  <FlameTimer expiresAt={post.expires_at} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}