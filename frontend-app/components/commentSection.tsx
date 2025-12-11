'use client'

import { ReactElement, useState, useEffect } from 'react'
import { Comment } from '@/app/actions' 
import { CommentForm } from '@/components/commentForm'
import CommentReactionField from './commentReactionField'
import { isAdmin } from '@/utils/auth'
import api from '@/utils/api'

interface PostCommentsSectionProps {
    postId: number;
    comments: Comment[];
    loadingComments: boolean;
    token: string | null;
    fetchComments: () => void;
}

const CommentItem = ({ comment, postId, comments, token, fetchComments, isAdminUser }: { 
    comment: Comment, 
    postId: number,
    comments: Comment[], 
    token: string | null, 
    fetchComments: () => void,
    isAdminUser: boolean
}): ReactElement => {
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleCommentCreated = () => {
        fetchComments();
        setReplyingTo(null);
    };

    const handleDeleteComment = async () => {
        if (!confirm('Are you sure you want to delete this comment?')) return;
        
        setDeleting(true);
        try {
            await api.delete(`/api/admin/posts/${postId}/comments/${comment.comment_id}`);
            fetchComments();
        } catch (err) {
            console.error('Failed to delete comment:', err);
        } finally {
            setDeleting(false);
        }
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
                    <div className="comment-header-right">
                        <span className="comment-date">{new Date(comment.created_at).toLocaleDateString()}</span>
                        {isAdminUser && (
                            <button 
                                className="comment-delete-btn"
                                onClick={handleDeleteComment}
                                disabled={deleting}
                                title="Delete comment"
                            >
                                <i className={deleting ? "pi pi-spin pi-spinner" : "pi pi-trash"} />
                            </button>
                        )}
                    </div>
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
                {renderComments(comments, comment.comment_id, postId, token, fetchComments, isAdminUser)}
            </div>
        </div>
    );
};

const renderComments = (
    commentList: Comment[], 
    parentId: number | null, 
    postId: number,
    token: string | null, 
    fetchComments: () => void,
    isAdminUser: boolean
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
                isAdminUser={isAdminUser}
            />
        ));
};


export default function PostCommentsSection({ postId, comments, loadingComments, token, fetchComments }: PostCommentsSectionProps): ReactElement {
    const [isAdminUser, setIsAdminUser] = useState(false);

    useEffect(() => {
        setIsAdminUser(isAdmin());
        
        const handleStorageChange = () => {
            setIsAdminUser(isAdmin());
        };
        
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

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
                    {renderComments(comments, null, postId, token, fetchComments, isAdminUser)} 
                </div>
            )}
        </div>
    );
}