'use client'

import { ReactElement } from 'react'
import Message from './post' 
import Link from 'next/link'
import { Posts } from '@/app/actions'

export function PostList({ posts }: { posts : Posts}): ReactElement {
    if (!posts || posts.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500">
                No posts to display yet. Start following people!
            </div>
        );
    }
    
    return (
        <div className="space-y-6 max-w-xl mx-auto p-4">
            
            {posts.map((postItem) => (
                <Link 
                    key={postItem.post_id} 
                    href={`/home/${postItem.post_id}`} 
                    className="block hover:bg-neutral-800 transition duration-150 rounded-lg"
                >
                    <Message 
                        post={postItem} 
                    />
                </Link>
            ))}
        </div>
    ); 
}