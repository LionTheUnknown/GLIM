"use client";

import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
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
            
            const response = await axios.get<Posts>(`${API_BASE_URL}/posts`);
            
            setPosts(response.data);

        } catch (err: unknown) {
            let errorMessage: string = 'Failed to fetch posts. Check server connection.';
            
            if (axios.isAxiosError(err)) {
                const axiosError = err as AxiosError;
                errorMessage = (axiosError.response?.data as {error: string})?.error || axiosError.message;
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
        return <p style={{ padding: '20px' }}>Loading posts...</p>;
    }

    if (error) {
        return <p style={{ color: 'red', padding: '20px' }}>Error: {error}</p>;
    }

    if (posts.length === 0) {
        return (
            <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
                <h1 className="text-xl font-bold mb-4">Latest Posts</h1>
                <PostForm onPostCreated={fetchPosts}/>
                <p style={{ padding: '20px', border: '1px dashed #ccc' }}>No posts found. Start posting!</p>
            </div>
        );
    }
    
    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
            <h1 className="text-2xl font-bold mb-6">Latest Posts</h1>
            <p className="text-gray-600 mb-6">Data fetched from: <code>{API_BASE_URL}/posts</code></p>
            <PostForm onPostCreated={fetchPosts} /> 
            <PostList posts={posts} />
        </div>
    );
};

export default HomePage;