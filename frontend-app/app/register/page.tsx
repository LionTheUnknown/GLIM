"use client";

import { useState, FormEvent, useRef, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { toast } from '@/utils/toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const RegisterPage = () => {
    const router = useRouter();
    const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        return () => {
            if (redirectTimeoutRef.current) {
                clearTimeout(redirectTimeoutRef.current);
            }
        };
    }, []);


    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!formData.username || !formData.email || !formData.password) {
            toast.error('Validation error', 'Please fill in username, email, and password');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Password mismatch', 'Passwords do not match');
            return;
        }

        try {
            const endpoint = `${API_BASE_URL}/api/users/register`;
            
            const payload = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                display_name: formData.username
            };

            await axios.post(endpoint, payload);

            toast.success('Registration successful!', 'Please log in');
            
            redirectTimeoutRef.current = setTimeout(() => {
                router.push('/login'); 
            }, 1500);

        } catch (err: unknown) {
            let errorMessage = 'Registration failed due to an unknown error.';
            
            if (axios.isAxiosError(err) && err.response) {
                errorMessage = err.response.data.details || err.response.data.error || 'Check server logs.';
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            
            toast.error('Registration failed', errorMessage);
        }
    };

    return (
        <div className="auth-container">
            <Card 
                title="Create Your Account"
                style={{ maxWidth: '400px', width: '100%' }}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="p-field">
                        <label htmlFor="username" className="p-label">Username</label>
                        <InputText
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                            required
                            placeholder="Choose a username"
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div className="p-field">
                        <label htmlFor="email" className="p-label">Email</label>
                        <InputText
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            required
                            placeholder="your.email@example.com"
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div className="p-field">
                        <label htmlFor="password" className="p-label">Password</label>
                        <Password
                            id="password"
                            value={formData.password}
                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            required
                            placeholder="Create a secure password"
                            feedback={false}
                            toggleMask
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div className="p-field">
                        <label htmlFor="confirmPassword" className="p-label">Confirm Password</label>
                        <Password
                            id="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            required
                            placeholder="Confirm your password"
                            feedback={false}
                            toggleMask
                            style={{ width: '100%' }}
                        />
                    </div>
                    <Button 
                        type="submit" 
                        label="Register"
                        icon="pi pi-user-plus"
                        style={{ width: '100%' }}
                    />
                </form>
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        Already have an account?
                    </p>
                    <Button
                        label="Login"
                        icon="pi pi-sign-in"
                        onClick={() => router.push('/login')}
                        outlined
                        style={{ width: '100%' }}
                    />
                </div>
            </Card>
        </div>
    );
};

export default RegisterPage;