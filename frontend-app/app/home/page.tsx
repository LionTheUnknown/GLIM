"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import api from '@/utils/api';
import { PostList } from '../../components/post-list';
import PostForm from '../../components/postForm';
import { Posts } from '@/app/actions';
import { isAuthenticated } from '@/utils/auth';

const HomePage = () => {
    const router = useRouter();
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
        if (isAuthenticated()) {
            fetchPosts();
        } else {
            setLoading(false);
        }
    }, []);

    if (!isAuthenticated()) {
        return (
            <div className="page-container">
                <h1 className="home-title">
                    GLIM
                </h1>
                <div className="home-content">
                    <div className="card profile-card">
                        <div className="profile-header">
                            <h1 className="profile-name">Welcome to GLIM</h1>
                            <p className="profile-username" style={{ marginBottom: '2rem' }}>
                                Please log in to view and create posts
                            </p>
                        </div>
                        <div className="profile-actions">
                            <button
                                onClick={() => router.push('/login')}
                                className="btn btn-primary profile-action-btn"
                            >
                                Log In
                            </button>
                            <button
                                onClick={() => router.push('/register')}
                                className="btn btn-secondary profile-action-btn"
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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