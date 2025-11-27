"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

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
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
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

    if (loading) {
        return (
            <div className="page-container">
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading profile...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="page-container">
                <p className="error-message" style={{ textAlign: 'center' }}>{error || 'Profile not found'}</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--flame-orange), var(--flame-bright))',
                        margin: '0 auto 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        fontWeight: '700',
                        color: 'white'
                    }}>
                        {profile.username.charAt(0).toUpperCase()}
                    </div>
                    <h1 style={{
                        fontSize: '1.875rem',
                        fontWeight: '700',
                        marginBottom: '0.5rem',
                        background: 'linear-gradient(135deg, var(--flame-gold), var(--flame-orange))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        {profile.display_name || profile.username}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        @{profile.username}
                    </p>
                </div>

                {profile.bio && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            Bio
                        </h2>
                        <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>
                            {profile.bio}
                        </p>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => router.push('/home')}
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                    >
                        Back to Feed
                    </button>
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            router.push('/login');
                        }}
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}

