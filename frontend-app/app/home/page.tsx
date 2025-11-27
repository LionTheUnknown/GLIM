"use client";

import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import api from '@/utils/api';
import { PostList } from '../../components/post-list';
import PostForm from '../../components/postForm';
import { Posts } from '@/app/actions'

const HomePage = () => {
    const [posts, setPosts] = useState<Posts>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPosts = async () => {
        try {
            setError(null);
            const response = await api.get<Posts>('/api/posts');
            setPosts(response.data);
        } catch (err: unknown) {
            let errorMessage: string = 'Failed to fetch posts. Check server connection.';

            if (axios.isAxiosError(err)) {
                const axiosError = err as AxiosError;
                errorMessage = (axiosError.response?.data as { error: string })?.error || axiosError.message;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    if (loading) {
        return (
            <div className="page-container">
                <p className="loading-text">
                    Loading posts...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container">
                <p className="error-message error-text">
                    Error: {error}
                </p>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="page-container">
                <h1 className="empty-posts-title">
                    Latest Posts
                </h1>
                <div className="home-content">
                    <PostForm onPostCreated={fetchPosts} />
                    <p className="empty-posts-message">
                        No posts found. Start posting!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 className="home-title">
                GLIM
            </h1>
            <div className="home-content">
                <PostForm onPostCreated={fetchPosts} />
                <PostList posts={posts} />
            </div>
        </div>
    );
};

export default HomePage;