"use client";

import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import api from '@/utils/api';
import { PostList } from '../../components/post-list';
import PostForm from '../../components/postForm';
import { Post, Posts } from '@/app/actions'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const HomePage = () => {
    const [posts, setPosts] = useState<Posts>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPosts = async () => {
        try {
            setError(null);
            const response = await api.get<Posts>('/posts');
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
        return <p className="p-5 text-white">Loading posts...</p>;
    }

    if (error) {
        return <p className="p-5 text-red-500">Error: {error}</p>;
    }

    if (posts.length === 0) {
        return (
            <div className="p-5 max-w-3xl mx-auto">
                <h1 className="text-xl font-bold mb-4 text-white">Latest Posts</h1>
                <PostForm onPostCreated={fetchPosts} />
                <p className="p-5 border border-dashed border-stone-600 text-stone-400">No posts found. Start posting!</p>
            </div>
        );
    }

    return (
        <div className="p-5 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-white">Latest Posts</h1>
            <p className="text-gray-600 mb-6">Data fetched from: <code>{API_BASE_URL}/posts</code></p>
            <PostForm onPostCreated={fetchPosts} />
            <PostList posts={posts} />
        </div>
    );
};

export default HomePage;