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
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
                    Loading posts...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container">
                <p className="error-message" style={{ textAlign: 'center', fontSize: '1.125rem' }}>
                    Error: {error}
                </p>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="page-container">
                <h1 style={{ 
                    fontSize: '2rem', 
                    fontWeight: '700', 
                    marginBottom: '2rem',
                    background: 'linear-gradient(135deg, var(--flame-gold), var(--flame-orange))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    Latest Posts
                </h1>
                <PostForm onPostCreated={fetchPosts} />
                <p style={{ 
                    padding: '2rem', 
                    border: '1px dashed var(--border)', 
                    color: 'var(--text-muted)', 
                    textAlign: 'center', 
                    borderRadius: '8px', 
                    marginTop: '2rem',
                    background: 'var(--bg-card)'
                }}>
                    No posts found. Start posting!
                </p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: '700', 
                marginBottom: '1.5rem',
                background: 'linear-gradient(135deg, var(--flame-gold), var(--flame-orange))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
            }}>
                Latest Posts
            </h1>
            <PostForm onPostCreated={fetchPosts} />
            <PostList posts={posts} />
        </div>
    );
};

export default HomePage;