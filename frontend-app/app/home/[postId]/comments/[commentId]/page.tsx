'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/utils/api'
import { Comment } from '@/app/actions'
import PostCommentsSection from '@/components/commentSection'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface CommentWithReplies extends Comment {
    replies?: Comment[];
}

export default function CommentPage({
    params,
}: {
    params: Promise<{ postId: string; commentId: string }>;
}) {
    const { postId, commentId } = use(params);
    const router = useRouter();
    const [commentData, setCommentData] = useState<CommentWithReplies | null>(null);
    const [replies, setReplies] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingReplies, setLoadingReplies] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    const fetchReplies = async () => {
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
    };

    useEffect(() => {
        const authToken = localStorage.getItem('token');
        setToken(authToken);

        if (!authToken) {
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
    }, [postId, commentId, router]);

    if (loading) {
        return (
            <div className="page-container">
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Comment...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container">
                <p className="error-message" style={{ textAlign: 'center' }}>Error: {error}</p>
            </div>
        );
    }

    if (!commentData) {
        return (
            <div className="page-container">
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Comment Not Found.</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="card" style={{ marginBottom: '2rem' }}>
                {/* Main Comment Display */}
                <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <span style={{ color: 'var(--accent)', fontWeight: '500' }}>
                            {commentData.author_name || 'Anonymous'}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            {new Date(commentData.created_at).toLocaleString()}
                        </span>
                    </div>
                    <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem', lineHeight: '1.6' }}>
                        {commentData.content_text}
                    </p>
                </div>

                {/* Replies Section */}
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
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
