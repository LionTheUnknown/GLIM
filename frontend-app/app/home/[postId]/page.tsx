'use client'

import { useState, useEffect, useCallback, ReactElement, use } from 'react'
import axios from 'axios'
import { Post, Comment } from '@/app/actions' 
import HighlightedPost from '@/components/highlighted-post' 
import PostCommentsSection from '@/components/commentSection' 

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
const getToken = () => localStorage.getItem('token')

interface PostWithReactions extends Post {
    reaction_counts: {
        like_count: number;
        dislike_count: number;
    };
    user_reaction_type: 'like' | 'dislike' | null;
}

export default function PostPage({ params }: { params: Promise<{ postId: string }> }): ReactElement {
    const { postId } = use(params); 
    const [postData, setPostData] = useState<PostWithReactions | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingPost, setLoadingPost] = useState(true);
    const [loadingComments, setLoadingComments] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null)

    const fetchComments = useCallback(async () => {
        setLoadingComments(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/posts/${postId}/comments`); 
            setComments(response.data); 
        } catch (err) {
            console.error("Failed to load comments:", err);
            setComments([]); 
        } finally {
            setLoadingComments(false);
        }
    }, [postId]);

    useEffect(() => {
        const authToken = getToken();
        setToken(authToken); 
        
        if (!authToken) {
            window.location.replace('/login');
            return;
        }

        const loadPostData = async () => {
            setLoadingPost(true);
            
            try {
                const postRes = await axios.get<PostWithReactions>(
                    `${API_BASE_URL}/posts/${postId}`,{ headers: { Authorization: `Bearer ${authToken}` } }
                );

                setPostData(postRes.data);
                setError(null);

            } catch (err: unknown) {
                console.error('Initial post load failed:', err);
                if (axios.isAxiosError(err) && err.response?.status === 404) {
                    setError('Post not found (404).');
                } else {
                    setError('Failed to load post details.');
                }
                setPostData(null);
            } finally {
                setLoadingPost(false);
            }
        };

        loadPostData();
        fetchComments();

    }, [postId, fetchComments]);
    
    
    if (loadingPost) {
        return <div className="text-white p-6">Loading Post...</div>;
    }

    if (error) {
        return <div className="text-red-400 p-6">Error: {error}</div>;
    }

    if (!postData) {
        return <div className="text-white p-6">Post Not Found.</div>;
    }

    return (
        <div className="container mx-auto p-4 max-w-3xl">
            <div className="bg-neutral-900 border border-stone-600 rounded-lg p-6 shadow-xl mb-8">
                <HighlightedPost post={postData} /> 
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