'use client'

import { ReactElement, useState, useEffect } from 'react'
import Message from './post' 
import Link from 'next/link'
import { Posts } from '@/app/actions'

export function PostList({ posts }: { posts : Posts}): ReactElement {
    const [visiblePosts, setVisiblePosts] = useState<Posts>(posts)
    const [expiringPosts, setExpiringPosts] = useState<Set<number>>(new Set())

    useEffect(() => {
        // When new posts arrive, merge with existing visible posts (avoid removing posts that are animating out)
        setVisiblePosts(prev => {
            const prevIds = new Set(prev.map(p => p.post_id))
            const newPosts = posts.filter(p => !prevIds.has(p.post_id))
            return [...prev.filter(p => !expiringPosts.has(p.post_id)), ...newPosts]
        })
    }, [posts, expiringPosts])


    useEffect(() => {
        if (visiblePosts.length === 0) return

        // Check for expired posts every second
        const interval = setInterval(() => {
            const now = new Date().getTime()
            const newExpiringPosts = new Set<number>()

            visiblePosts.forEach(post => {
                if (!post.expires_at || expiringPosts.has(post.post_id)) {
                    return
                }

                const expiration = new Date(post.expires_at).getTime()
                const timeUntilExpiration = expiration - now

                if (timeUntilExpiration <= 0) {
                    // Post has expired - mark for animation
                    newExpiringPosts.add(post.post_id)
                }
            })

            if (newExpiringPosts.size > 0) {
                setExpiringPosts(prev => new Set([...prev, ...newExpiringPosts]))
                
                // Remove posts after animation completes (500ms for slide-out)
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
                <Link 
                    key={postItem.post_id} 
                    href={`/home/${postItem.post_id}`}
                    className={`post-list-item ${expiringPosts.has(postItem.post_id) ? 'post-expiring' : ''}`}
                >
                    <Message 
                        post={postItem} 
                    />
                </Link>
            ))}
        </div>
    ); 
}