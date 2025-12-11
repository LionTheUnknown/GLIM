'use client'

import { useState, useEffect, useCallback, ReactElement, use } from 'react'
import axios from 'axios'
import api from '@/utils/api'
import { useRouter } from 'next/navigation'
import { Post, Comment } from '@/app/actions'
import HighlightedPost from '@/components/highlighted-post'
import PostCommentsSection from '@/components/commentSection'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface PostWithReactions extends Post {
    reaction_counts: {
        like_count: number;
        dislike_count: number;
    };
    user_reaction_type: 'like' | 'dislike' | null;
}

export default function PostPage({ params }: { params: Promise<{ postId: string }> }): ReactElement {
    const { postId } = use(params);
    const router = useRouter();
    const [postData, setPostData] = useState<PostWithReactions | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingPost, setLoadingPost] = useState(true);
    const [loadingComments, setLoadingComments] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null)

    const fetchComments = useCallback(async () => {
        setLoadingComments(true);
        try {
            const response = await api.get(`${API_BASE_URL}/api/posts/${postId}/comments`);
            const commentsData = response.data;
            
            // Fetch reaction data for each comment
            const token = localStorage.getItem('token');
            const commentsWithReactions = await Promise.all(
                commentsData.map(async (comment: Comment) => {
                    try {
                        // Fetch reaction counts
                        const countsResponse = await api.get(
                            `${API_BASE_URL}/api/posts/${postId}/comments/${comment.comment_id}/reactions`
                        );
                        
                        let userReaction: 'like' | 'dislike' | null = null;
                        if (token) {
                            try {
                                // Fetch user's reaction if authenticated
                                const userReactionResponse = await axios.get(
                                    `${API_BASE_URL}/api/posts/${postId}/comments/${comment.comment_id}/reactions/me`,
                                    { headers: { Authorization: `Bearer ${token}` } }
                                );
                                userReaction = userReactionResponse.data?.user_reaction_type || null;
                            } catch (_err) {
                                // 404 means no reaction, which is fine
                                userReaction = null;
                            }
                        }
                        
                        return {
                            ...comment,
                            reaction_counts: countsResponse.data || { like_count: 0, dislike_count: 0 },
                            user_reaction_type: userReaction
                        };
                    } catch (_err) {
                        // If reaction fetch fails, return comment without reactions
                        return {
                            ...comment,
                            reaction_counts: { like_count: 0, dislike_count: 0 },
                            user_reaction_type: null
                        };
                    }
                })
            );
            
            setComments(commentsWithReactions);
        } catch (err) {
            console.error("Failed to load comments:", err);
            setComments([]);
        } finally {
            setLoadingComments(false);
        }
    }, [postId]);

    const loadPostData = useCallback(async () => {
        setLoadingPost(true);

        try {
            const postRes = await api.get<PostWithReactions>(`/api/posts/${postId}`);

            setPostData(postRes.data);
            setError(null);

        } catch (err: unknown) {
            console.error('Post load failed:', err);
            if (axios.isAxiosError(err) && err.response?.status === 404) {
                setError('Post not found (404).');
            } else {
                setError('Failed to load post details.');
            }
            setPostData(null);
        } finally {
            setLoadingPost(false);
        }
    }, [postId]);

    useEffect(() => {
        const authToken = localStorage.getItem('token');
        setToken(authToken);

        if (!authToken) {
            router.push('/login');
            return;
        }

        loadPostData();
        fetchComments();

    }, [postId, fetchComments, router, loadPostData]);


    if (loadingPost) {
        return (
            <div className="page-container">
                <p className="loading-text">Loading Post...</p>
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

    if (!postData) {
        return (
            <div className="page-container">
                <p className="loading-text">Post Not Found.</p>
            </div>
        );
    }

    const handlePostDeleted = () => {
        router.push('/home')
    }

    const handlePostUpdated = () => {
        loadPostData()
    }

    return (
        <div className="page-container">
            <div className="card post-detail-card">
                <HighlightedPost 
                    post={postData} 
                    onPostDeleted={handlePostDeleted}
                    onPostUpdated={handlePostUpdated}
                />
                <PostCommentsSection
                    postId={postData.post_id}
                    comments={comments}
                    loadingComments={loadingComments}
                    token={token}
                    fetchComments={fetchComments}
                />
            </div>
        </div>
    );
}