'use client'

import { useState, useEffect, use, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/utils/api'
import { Comment } from '@/app/actions'
import PostCommentsSection from '@/components/commentSection'
import { toast } from '@/utils/toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface CommentWithReplies extends Comment {
    replies?: Comment[];
}

export default function CommentPage({
    params,
}: {
    params: Promise<{ postId: string; commentId: string }>;
}) {
    const unwrappedParams = use(params);
    const { postId, commentId } = unwrappedParams;
    const router = useRouter();
    const [commentData, setCommentData] = useState<CommentWithReplies | null>(null);
    const [replies, setReplies] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingReplies, setLoadingReplies] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const hasRedirected = useRef(false);

    const fetchReplies = useCallback(async () => {
        setLoadingReplies(true);
        try {
            const response = await api.get(`${API_BASE_URL}/api/posts/${postId}/comments/${commentId}/replies`);
            setReplies(response.data);
        } catch (err) {
            console.error("Failed to load replies:", err);
            setReplies([]);
        } finally {
            setLoadingReplies(false);
        }
    }, [postId, commentId]);

    useEffect(() => {
        const authToken = localStorage.getItem('token');
        setToken(authToken);

        if (!authToken && !hasRedirected.current) {
            hasRedirected.current = true;
            toast.info('Please log in to view posts and comments');
            router.push('/login');
            return;
        }

        const loadCommentData = async () => {
            setLoading(true);
            try {
                const response = await api.get<CommentWithReplies>(`${API_BASE_URL}/api/posts/${postId}/comments/${commentId}`);
                setCommentData(response.data);
                setError(null);
            } catch (err: unknown) {
                console.error('Failed to load comment:', err);
                setError('Failed to load comment details.');
                setCommentData(null);
            } finally {
                setLoading(false);
            }
        };

        loadCommentData();
        fetchReplies();
    }, [postId, commentId, router, fetchReplies]);

    if (loading) {
        return (
            <div className="page-container">
                <p className="loading-text">Loading Comment...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container">
                <p className="error-message error-text">Error: {error}</p>
            </div>
        );
    }

    if (!commentData) {
        return (
            <div className="page-container">
                <p className="loading-text">Comment Not Found.</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="card comment-detail-card">
                <div className="comment-detail-main">
                    <div className="comment-detail-header">
                        <span className="comment-detail-author">
                            {commentData.author_name || 'Anonymous'}
                        </span>
                        <span className="comment-detail-date">
                            {new Date(commentData.created_at).toLocaleString()}
                        </span>
                    </div>
                    <p className="comment-detail-content">
                        {commentData.content_text}
                    </p>
                </div>

                <div>
                    <h2 className="comment-detail-replies-title">
                        Replies ({replies.length})
                    </h2>
                    <PostCommentsSection
                        postId={parseInt(postId)}
                        comments={replies}
                        loadingComments={loadingReplies}
                        token={token}
                        fetchComments={fetchReplies}
                    />
                </div>
            </div>
        </div>
    );
}
