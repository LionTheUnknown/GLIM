'use client'

import { ReactElement, useState } from 'react'
import { Comment } from '@/app/actions' 
import { CommentForm } from '@/components/commentForm'
import CommentReactionField from './commentReactionField'

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
        <div className="comment-item">
            <div className="comment-card">
                <div className="comment-header">
                    <div className="comment-author-info">
                        <div className="comment-author-avatar">
                            {comment.author_avatar_url ? (
                                <img src={comment.author_avatar_url} alt="" />
                            ) : (
                                comment.author_name.charAt(0).toUpperCase()
                            )}
                        </div>
                        <span className="comment-author">{comment.author_name}</span>
                    </div>
                    <span className="comment-date">{new Date(comment.created_at).toLocaleDateString()}</span>
                </div>
                <div className="comment-content-wrapper">
                    <p className="comment-content">{comment.content_text}</p>
                    {comment.reaction_counts && (
                        <CommentReactionField
                            postId={postId}
                            commentId={comment.comment_id}
                            initialCounts={comment.reaction_counts}
                            initialUserReaction={comment.user_reaction_type || null}
                        />
                    )}
                </div>
                <div className="comment-actions">
                    <button 
                        onClick={() => setReplyingTo(comment.comment_id)} 
                        className="comment-reply-btn"
                    >
                        Reply
                    </button>
                </div>
            </div>
            
            {replyingTo === comment.comment_id && (
                <div className="comment-reply-form">
                    <CommentForm 
                        postId={postId} 
                        parentCommentId={comment.comment_id} 
                        onCommentCreated={handleCommentCreated} 
                        onClose={() => setReplyingTo(null)}
                        token={token}
                    />
                </div>
            )}

            <div className="comment-replies">
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
        <div className="comments-section">
            <div className="comments-form-container">
                <CommentForm 
                    postId={postId} 
                    parentCommentId={null} 
                    onCommentCreated={fetchComments}
                    token={token}
                />
            </div>
            {loadingComments ? (
                <p className="comments-loading">Loading comments...</p>
            ) : comments.length === 0 ? (
                <p className="comments-empty">No comments yet.</p>
            ) : (
                <div className="comments-list">
                    {renderComments(comments, null, postId, token, fetchComments)} 
                </div>
            )}
        </div>
    );
}