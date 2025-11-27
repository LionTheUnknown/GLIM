'use client'

import { ReactElement, useState } from 'react'
import { Post, Comment } from '@/app/actions' 
import { CommentForm } from '@/components/commentForm'

interface PostCommentsSectionProps {
    postId: number;
    comments: Comment[];
    loadingComments: boolean;
    token: string | null;
    fetchComments: () => void;
}

const CommentItem = ({ comment, postId, comments, token, fetchComments }: { 
    comment: Comment, 
    postId: number,
    comments: Comment[], 
    token: string | null, 
    fetchComments: () => void 
}): ReactElement => {
    const [replyingTo, setReplyingTo] = useState<number | null>(null);

    const handleCommentCreated = () => {
        fetchComments();
        setReplyingTo(null);
    };

    return (
        <div className="mt-3">
            <div 
                className="p-3 border rounded-lg"
                style={{
                    background: 'rgba(31, 31, 31, 0.6)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    borderColor: 'rgba(42, 42, 42, 0.5)',
                }}
            >
                <p className="text-sm font-bold text-indigo-400">{comment.author_name}</p>
                <p className="mt-1 text-sm text-white whitespace-pre-wrap">{comment.content_text}</p>
                <div className="flex items-center text-xs text-stone-500 mt-2">
                    <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                    <button 
                        onClick={() => setReplyingTo(comment.comment_id)} 
                        className="ml-3 text-indigo-500 hover:text-indigo-400 font-medium"
                    >
                        Reply
                    </button>
                </div>
            </div>
            
            {replyingTo === comment.comment_id && (
                <CommentForm 
                    postId={postId} 
                    parentCommentId={comment.comment_id} 
                    onCommentCreated={handleCommentCreated} 
                    onClose={() => setReplyingTo(null)}
                    token={token}
                />
            )}

            <div 
                className="ml-6 border-l pl-4"
                style={{
                    borderColor: 'rgba(42, 42, 42, 0.5)',
                }}
            >
                {renderComments(comments, comment.comment_id, postId, token, fetchComments)}
            </div>
        </div>
    );
};

const renderComments = (
    commentList: Comment[], 
    parentId: number | null, 
    postId: number,
    token: string | null, 
    fetchComments: () => void
): ReactElement[] => {
    if (!Array.isArray(commentList)) {
        return [];
    }
    
    return commentList
        .filter(comment => comment.parent_comment_id === parentId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map(comment => (
            <CommentItem 
                key={comment.comment_id}
                comment={comment}
                postId={postId}
                comments={commentList}
                token={token}
                fetchComments={fetchComments}
            />
        ));
};


export default function PostCommentsSection({ postId, comments, loadingComments, token, fetchComments }: PostCommentsSectionProps): ReactElement {
    return (
        <>
            <CommentForm 
                postId={postId} 
                parentCommentId={null} 
                onCommentCreated={fetchComments}
                token={token}
            />
            {loadingComments ? (
                <p className="text-stone-500 mt-4">Loading comments...</p>
            ) : comments.length === 0 ? (
                <p className="text-stone-500 mt-4">No comments yet.</p>
            ) : (
                <div className="mt-6 space-y-4">
                    {renderComments(comments, null, postId, token, fetchComments)} 
                </div>
            )}
        </>
    );
}