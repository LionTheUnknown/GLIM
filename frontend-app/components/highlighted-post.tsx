'use client'

import { ReactElement } from 'react'
import Image from 'next/image'
import { Post } from '@/app/actions' 
import ReactionField from './reactionField';

interface HighlightedPostProps {
    post: Post;
}

export default function HighlightedPost({ post }: HighlightedPostProps): ReactElement {
    return (
        <>
            <h1 className="text-3xl font-extrabold text-white mb-2">
                {post.content_text.substring(0, 50)}...
            </h1>
            <p className="text-sm text-stone-400 mb-4">
                By {post.author_name} on {new Date(post.created_at).toLocaleDateString()}
            </p>
            
            <div className="text-lg text-white whitespace-pre-wrap mb-6">
                {post.content_text}
            </div>
            
            {post.media_url && (
                <Image 
                    src={post.media_url} 
                    alt="Post Media" 
                    width={800}
                    height={400}
                    className="w-full max-h-96 object-contain rounded-md mb-6" 
                />
            )}
            <ReactionField 
                postId={post.post_id}
                initialCounts={post.reaction_counts}
                initialUserReaction={post.user_reaction_type}
            />
            <h2 className="text-xl font-bold text-white mt-8 mb-4">Comments</h2>
        </>
    );
}