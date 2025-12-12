'use client'

import { ReactElement } from 'react'
import { Post as PostType } from '@/app/actions'
import FlameTimer from './flameTimer'
import { Card } from 'primereact/card'
import DevTools from './DevTools'
import api from '@/utils/api'
import { toast } from '@/utils/toast'
import { useRouter } from 'next/navigation'

interface PostProps {
  post: PostType
  onPostDeleted?: () => void
  onPostUpdated?: () => void
  highlighted?: boolean
}

export default function Post({ post, onPostDeleted, onPostUpdated, highlighted = false }: PostProps): ReactElement {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return
    }

    try {
      await api.delete(`/api/admin/posts/${post.post_id}`)
      toast.success('Post deleted successfully')
      if (onPostDeleted) {
        onPostDeleted()
      } else {
        router.push('/home')
      }
    } catch (err) {
      toast.error('Failed to delete post')
      console.error('Delete error:', err)
    }
  }

  const handleRevive = async (duration: number) => {
    try {
      await api.patch(`/api/admin/posts/${post.post_id}/revive`, {
        duration_minutes: duration
      })
      toast.success(`Post revived for ${duration === 1 ? '1 minute' : duration === 60 ? '1 hour' : '1 day'}`)
      if (onPostUpdated) {
        onPostUpdated()
      } else if (highlighted) {
        router.refresh()
      }
    } catch (err) {
      toast.error('Failed to revive post')
      console.error('Revive error:', err)
    }
  }

  const handlePin = async () => {
    try {
      await api.patch(`/api/admin/posts/${post.post_id}/pin`)
      toast.success(post.pinned ? 'Post unpinned' : 'Post pinned')
      if (onPostUpdated) {
        onPostUpdated()
      } else if (highlighted) {
        router.refresh()
      }
    } catch (err) {
      toast.error('Failed to toggle pin')
      console.error('Pin error:', err)
    }
  }

  const legacyCategory = (post as { category?: string | null }).category ?? null
  const categoriesText = post.categories && post.categories.length > 0
    ? post.categories.map((cat: { category_name: string }) => cat.category_name).join(', ')
    : legacyCategory

  return (
    <Card 
      className={`post-card ${post.pinned ? 'post-pinned' : ''}`}
      style={highlighted ? { marginBottom: '2rem' } : undefined}
    >
      {post.pinned && (
        <div className="post-pinned-badge">📌 Pinned</div>
      )}
      <div className="post-content">
        <div className="post-header">
          <div className="post-author-avatar">
            {post.author_avatar_url ? (
              <img src={post.author_avatar_url} alt="" />
            ) : (
              post.author_name.charAt(0).toUpperCase()
            )}
          </div>
          <span className="post-author-name">{post.author_name}</span>
          {categoriesText && (
            <>
              <span className="post-header-separator">|</span>
              <span className="post-category">
                {categoriesText}
              </span>
            </>
          )}
        </div>
        <div className="post-content-wrapper">
          <div className="post-text">
            {post.content_text}
          </div>
          <FlameTimer 
            expiresAt={post.expires_at || null} 
            postId={post.post_id}
            userReaction={post.user_reaction_type || null}
            onExpirationUpdate={onPostUpdated ? () => onPostUpdated() : undefined}
          />
        </div>
        <DevTools
          postId={post.post_id}
          onDelete={handleDelete}
          onRevive={handleRevive}
          onPin={handlePin}
          isPinned={post.pinned}
        />
      </div>
    </Card>
  )
}

export { Post as Message }
