"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { isAuthenticated } from '@/utils/auth';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { toast } from '@/utils/toast';

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

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/api/users/me');
            setProfile(response.data);
        } catch (err) {
            console.error('Error fetching profile:', err);
            const errorMsg = 'Failed to load profile';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated()) {
            setLoading(false);
            return;
        }

        fetchProfile();
    }, [fetchProfile, router]);

    if (!isAuthenticated()) {
        return (
            <div className="page-container">
                <Card title="Profile" className="profile-card">
                    <div className="profile-header">
                        <p className="profile-username" style={{ marginBottom: '2rem' }}>
                            Please log in to view your profile
                        </p>
                    </div>
                    <div className="profile-actions">
                        <Button
                            label="Log In"
                            icon="pi pi-sign-in"
                            onClick={() => router.push('/login')}
                            className="profile-action-btn"
                        />
                        <Button
                            label="Sign Up"
                            icon="pi pi-user-plus"
                            onClick={() => router.push('/register')}
                            outlined
                            className="profile-action-btn"
                        />
                    </div>
                </Card>
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
                <Card className="profile-card">
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            {error || 'Profile not found'}
                        </p>
                        <Button
                            label="Retry"
                            icon="pi pi-refresh"
                            onClick={() => {
                                setLoading(true);
                                setError(null);
                                fetchProfile();
                            }}
                        />
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="page-container">
            <Card className="profile-card">
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
                    <Button
                        label="Back to Feed"
                        icon="pi pi-home"
                        onClick={() => router.push('/home')}
                        outlined
                        className="profile-action-btn"
                    />
                    <Button
                        label="Logout"
                        icon="pi pi-sign-out"
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('refresh_token');
                            toast.info('Logged out successfully');
                            router.push('/login');
                        }}
                        outlined
                        className="profile-action-btn"
                    />
                </div>
            </Card>
        </div>
    );
}

