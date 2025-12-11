"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { isAuthenticated } from '@/utils/auth';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { toast } from '@/utils/toast';
import { Posts } from '@/app/actions';
import { PostList } from '@/components/post-list';

interface UserProfile {
    user_id: number;
    username: string;
    display_name: string;
    bio: string;
    avatar_url?: string | null;
}

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<Posts>([]);
    const [loading, setLoading] = useState(true);
    const [postsLoading, setPostsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [editingBio, setEditingBio] = useState(false);
    const [bioText, setBioText] = useState('');
    const [savingBio, setSavingBio] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

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

    const fetchMyPosts = useCallback(async () => {
        try {
            setPostsLoading(true);
            const response = await api.get('/api/users/me/posts');
            setPosts(response.data);
        } catch (err) {
            console.error('Error fetching posts:', err);
        } finally {
            setPostsLoading(false);
        }
    }, []);

    const handleSelectFile = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowed.includes(file.type)) {
            toast.error('Invalid file type', 'Please upload png, jpg, jpeg, or webp.');
            e.target.value = '';
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File too large', 'Max size is 5MB.');
            e.target.value = '';
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await api.post('/api/users/me/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setProfile(res.data);
            toast.success('Avatar updated');
        } catch (_err) {
            toast.error('Upload failed', 'Could not upload avatar.');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleRemoveAvatar = async () => {
        setRemoving(true);
        try {
            await api.delete('/api/users/me/avatar');
            setProfile(prev => (prev ? { ...prev, avatar_url: null } : prev));
            toast.success('Avatar removed');
        } catch (_err) {
            toast.error('Remove failed', 'Could not remove avatar.');
        } finally {
            setRemoving(false);
        }
    };

    const handleEditBio = () => {
        setBioText(profile?.bio || '');
        setEditingBio(true);
    };

    const handleCancelBio = () => {
        setEditingBio(false);
        setBioText('');
    };

    const handleSaveBio = async () => {
        setSavingBio(true);
        try {
            const response = await api.put('/api/users/me', { bio: bioText });
            setProfile(response.data);
            setEditingBio(false);
            toast.success('Bio updated');
        } catch (_err) {
            toast.error('Save failed', 'Could not update bio.');
        } finally {
            setSavingBio(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated()) {
            setLoading(false);
            return;
        }

        fetchProfile();
        fetchMyPosts();
    }, [fetchProfile, fetchMyPosts, router]);

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
                <button
                    className="profile-logout-btn"
                    onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('refresh_token');
                        toast.info('Logged out successfully');
                        router.push('/login');
                    }}
                    title="Logout"
                >
                    <i className="pi pi-sign-out"></i>
                </button>
                <div className="profile-header">
                    <div className="profile-avatar-container">
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                        <div 
                            className={`profile-avatar profile-avatar-clickable ${uploading ? 'profile-avatar-uploading' : ''}`}
                            onClick={handleSelectFile}
                            title="Click to change avatar"
                        >
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="avatar" />
                            ) : (
                                profile.username.charAt(0).toUpperCase()
                            )}
                            <div className="profile-avatar-overlay">
                                <i className={`pi ${uploading ? 'pi-spin pi-spinner' : 'pi-camera'}`}></i>
                            </div>
                        </div>
                        {profile.avatar_url && (
                            <button
                                className="profile-avatar-delete"
                                onClick={handleRemoveAvatar}
                                disabled={removing}
                                title="Remove avatar"
                            >
                                {removing ? (
                                    <i className="pi pi-spin pi-spinner"></i>
                                ) : (
                                    <i className="pi pi-times"></i>
                                )}
                            </button>
                        )}
                    </div>
                    <h1 className="profile-name">
                        {profile.display_name || profile.username}
                    </h1>
                    <p className="profile-username">
                        @{profile.username}
                    </p>
                </div>

                <div className="profile-bio-section">
                    <div className="profile-bio-header">
                        <h2 className="profile-bio-label">Bio</h2>
                        {!editingBio && (
                            <button 
                                className="profile-bio-edit-btn"
                                onClick={handleEditBio}
                                title="Edit bio"
                            >
                                <i className="pi pi-pencil"></i>
                            </button>
                        )}
                    </div>
                    {editingBio ? (
                        <div className="profile-bio-edit">
                            <InputTextarea
                                value={bioText}
                                onChange={(e) => setBioText(e.target.value)}
                                rows={4}
                                placeholder="Write something about yourself..."
                                className="profile-bio-textarea"
                                maxLength={500}
                                autoResize
                            />
                            <div className="profile-bio-actions">
                                <Button
                                    label="Cancel"
                                    icon="pi pi-times"
                                    onClick={handleCancelBio}
                                    outlined
                                    size="small"
                                    disabled={savingBio}
                                />
                                <Button
                                    label="Save"
                                    icon="pi pi-check"
                                    onClick={handleSaveBio}
                                    size="small"
                                    loading={savingBio}
                                />
                            </div>
                        </div>
                    ) : (
                        <p className="profile-bio-text">
                            {profile.bio || <span className="profile-bio-empty">No bio yet. Click the pencil to add one!</span>}
                        </p>
                    )}
                </div>

            </Card>

            <div className="profile-posts-section">
                <div className="profile-posts-separator"></div>
                {postsLoading ? (
                    <p className="loading-text">Loading posts...</p>
                ) : posts.length === 0 ? (
                    <p className="profile-no-posts">You haven't created any posts yet.</p>
                ) : (
                    <PostList 
                        posts={posts} 
                        onPostDeleted={fetchMyPosts}
                        onPostUpdated={fetchMyPosts}
                    />
                )}
            </div>
        </div>
    );
}

