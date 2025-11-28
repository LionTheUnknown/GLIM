"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { isAuthenticated } from '@/utils/auth';

interface UserProfile {
    user_id: number;
    username: string;
    display_name: string;
    bio: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated()) {
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                const response = await api.get('/api/users/me');
                setProfile(response.data);
            } catch (err) {
                console.error('Error fetching profile:', err);
                setError('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    if (!isAuthenticated()) {
        return (
            <div className="page-container">
                <div className="card profile-card">
                    <div className="profile-header">
                        <h1 className="profile-name">Profile</h1>
                        <p className="profile-username" style={{ marginBottom: '2rem' }}>
                            Please log in to view your profile
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
        );
    }

    if (loading) {
        return (
            <div className="page-container">
                <p className="loading-text">Loading profile...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="page-container">
                <p className="error-message error-text">{error || 'Profile not found'}</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="card profile-card">
                <div className="profile-header">
                    <div className="profile-avatar">
                        {profile.username.charAt(0).toUpperCase()}
                    </div>
                    <h1 className="profile-name">
                        {profile.display_name || profile.username}
                    </h1>
                    <p className="profile-username">
                        @{profile.username}
                    </p>
                </div>

                {profile.bio && (
                    <div className="profile-bio-section">
                        <h2 className="profile-bio-label">
                            Bio
                        </h2>
                        <p className="profile-bio-text">
                            {profile.bio}
                        </p>
                    </div>
                )}

                <div className="profile-actions">
                    <button
                        onClick={() => router.push('/home')}
                        className="btn btn-secondary profile-action-btn"
                    >
                        Back to Feed
                    </button>
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('refresh_token');
                            router.push('/login');
                        }}
                        className="btn btn-secondary profile-action-btn"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}

