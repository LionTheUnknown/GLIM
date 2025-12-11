"use client";

import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import api from '@/utils/api';
import { PostList } from '../../components/post-list';
import PostForm from '../../components/postForm';
import { Posts } from '@/app/actions';
import { isAuthenticated } from '@/utils/auth';
import { Button } from 'primereact/button';
import { toast } from '@/utils/toast';

const HomePage = () => {
    const [posts, setPosts] = useState<Posts>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState<boolean>(false);

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
            toast.error('Failed to load posts', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchPosts();
    }, []);

    if (!mounted || loading) {
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
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        {error}
                    </p>
                    <Button
                        label="Retry"
                        icon="pi pi-refresh"
                        onClick={() => {
                            setLoading(true);
                            setError(null);
                            fetchPosts();
                        }}
                    />
                </div>
            </div>
        );
    }

    const isLoggedIn = isAuthenticated();

    if (posts.length === 0) {
        return (
            <div className="page-container">
                <div className="home-content">
                    {isLoggedIn && <PostForm onPostCreated={fetchPosts} />}
                    <p className="empty-posts-message">
                        No posts found. {isLoggedIn ? 'Start posting!' : 'Log in to create posts!'}
                    </p>
                    <PostList posts={[]} onPostDeleted={fetchPosts} onPostUpdated={fetchPosts} />
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="home-content">
                {isLoggedIn && <PostForm onPostCreated={fetchPosts} />}
                <PostList posts={posts} onPostDeleted={fetchPosts} onPostUpdated={fetchPosts} />
            </div>
        </div>
    );
};

export default HomePage;