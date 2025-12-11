'use client'

import { ReactElement, useState, useEffect } from 'react'
import Message from './post' 
import Link from 'next/link'
import { Posts } from '@/app/actions'
import { useRouter } from 'next/navigation'

export function PostList({ posts, onPostDeleted, onPostUpdated }: { posts : Posts, onPostDeleted?: () => void, onPostUpdated?: () => void }): ReactElement {
    const router = useRouter()
    const [visiblePosts, setVisiblePosts] = useState<Posts>(posts)
    const [expiringPosts, setExpiringPosts] = useState<Set<number>>(new Set())

    useEffect(() => {
        const now = Date.now()
        const freshPosts = posts.filter(p => !p.expires_at || new Date(p.expires_at).getTime() > now)

        setVisiblePosts(prev => {
            const animatingPosts = prev.filter(p => expiringPosts.has(p.post_id))
            
            const newVisiblePosts = freshPosts.filter(p => !expiringPosts.has(p.post_id))
            
            return [...newVisiblePosts, ...animatingPosts]
        })
    }, [posts, expiringPosts])


    useEffect(() => {
        if (visiblePosts.length === 0) return

        const interval = setInterval(() => {
            const now = new Date().getTime()
            const newExpiringPosts = new Set<number>()

            visiblePosts.forEach(post => {
                if (!post.expires_at || expiringPosts.has(post.post_id)) {
                    return
                }

                const expiration = new Date(post.expires_at).getTime()
                const timeUntilExpiration = expiration - now

                if (timeUntilExpiration <= 1000) {
                    newExpiringPosts.add(post.post_id)
                }
            })

            if (newExpiringPosts.size > 0) {
                setExpiringPosts(prev => new Set([...prev, ...newExpiringPosts]))
                
                setTimeout(() => {
                    setVisiblePosts(prev => prev.filter(p => !newExpiringPosts.has(p.post_id)))
                    setExpiringPosts(prev => {
                        const updated = new Set(prev)
                        newExpiringPosts.forEach(id => updated.delete(id))
                        return updated
                    })
                }, 500)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [visiblePosts, expiringPosts])

    if (!posts || posts.length === 0) {
        return (
            <div style={{ 
                textAlign: 'center', 
                padding: '2.5rem 1rem',
                color: 'var(--text-muted)'
            }}>
                No posts to display yet. Start following people!
            </div>
        );
    }
    
        return (
            <div className="post-list-container">
                {visiblePosts.map((postItem) => (
                    <div
                        key={postItem.post_id}
                        className={`post-list-item ${expiringPosts.has(postItem.post_id) ? 'post-expiring' : ''}`}
                    >
                        <Link 
                            href={`/home/${postItem.post_id}`}
                            style={{ textDecoration: 'none', display: 'block' }}
                        >
                            <Message 
                                post={postItem}
                                onPostDeleted={onPostDeleted || (() => router.refresh())}
                                onPostUpdated={onPostUpdated || (() => router.refresh())}
                            />
                        </Link>
                    </div>
                ))}
            </div>
        );
}