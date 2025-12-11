'use client'

import { ReactElement, useState, useEffect } from 'react'
import { Post } from '@/app/actions' 
import FlameTimer from './flameTimer';
import DevTools from './DevTools';
import { isDevMode } from '@/utils/devMode';
import api from '@/utils/api';
import { toast } from '@/utils/toast';
import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';

interface HighlightedPostProps {
    post: Post;
    onPostDeleted?: () => void;
    onPostUpdated?: () => void;
}

export default function HighlightedPost({ post, onPostDeleted, onPostUpdated }: HighlightedPostProps): ReactElement {
    const router = useRouter()
    const [devMode, setDevMode] = useState(false)
    const legacyCategory = (post as { category?: string | null }).category ?? null;
    const categoriesText = post.categories && post.categories.length > 0
        ? post.categories.map((cat: { category_name: string }) => cat.category_name).join(', ')
        : legacyCategory;

    useEffect(() => {
        setDevMode(isDevMode())
        
        const handleDevModeChange = (e: CustomEvent) => {
            setDevMode(e.detail)
        }
        
        window.addEventListener('devModeChanged', handleDevModeChange as EventListener)
        
        return () => {
            window.removeEventListener('devModeChanged', handleDevModeChange as EventListener)
        }
    }, [])

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this post? (Dev Mode)')) {
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
            } else {
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
            } else {
                router.refresh()
            }
        } catch (err) {
            toast.error('Failed to toggle pin')
            console.error('Pin error:', err)
        }
    }

    return (
        <Card className={`post-card ${post.pinned ? 'post-pinned' : ''}`} style={{ marginBottom: '2rem' }}>
            {post.pinned && (
                <div className="post-pinned-badge">📌 Pinned</div>
            )}
            <div className="post-content">
                <div className="post-header">
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
                        onExpirationUpdate={(_newExpiresAt) => {
                            if (onPostUpdated) {
                                onPostUpdated();
                            }
                        }}
                    />
                </div>
                {devMode && (
                    <DevTools
                        postId={post.post_id}
                        onDelete={handleDelete}
                        onRevive={handleRevive}
                        onPin={handlePin}
                        isPinned={post.pinned}
                    />
                )}
            </div>
        </Card>
    );
}