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
        return <div className="text-white p-6">Loading Comment...</div>;
    }

    if (error) {
        return <div className="text-red-400 p-6">Error: {error}</div>;
    }

    if (!commentData) {
        return <div className="text-white p-6">Comment Not Found.</div>;
    }

    return (
        <div className="container mx-auto p-4 max-w-3xl">
            <div className="bg-neutral-900 border border-stone-600 rounded-lg p-6 shadow-xl mb-8">
                {/* Main Comment Display */}
                <div className="mb-6 pb-6 border-b border-stone-700">
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-blue-400 font-medium">
                                    {commentData.author_name || 'Anonymous'}
                                </span>
                                <span className="text-gray-500 text-sm">
                                    {new Date(commentData.created_at).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-white text-lg">{commentData.content_text}</p>
                        </div>
                    </div>
                </div>

                {/* Replies Section */}
                <div className="mt-6">
                    <h2 className="text-xl font-semibold text-white mb-4">
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
