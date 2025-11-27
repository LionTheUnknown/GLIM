'use client'

import { ReactElement } from 'react'
import Message from './post' 
import Link from 'next/link'
import { Posts } from '@/app/actions'

export function PostList({ posts }: { posts : Posts}): ReactElement {
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
            {posts.map((postItem) => (
                <Link 
                    key={postItem.post_id} 
                    href={`/home/${postItem.post_id}`}
                    className="post-list-item"
                >
                    <Message 
                        post={postItem} 
                    />
                </Link>
            ))}
        </div>
    ); 
}