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

const LoginPage = () => {
    const router = useRouter();
    const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        identifier: '',
        password: '',
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

        if (!formData.identifier || !formData.password) {
            toast.error('Validation error', 'Please fill in username or email and password');
            return;
        }

        setLoading(true);

        try {
            const endpoint = `${API_BASE_URL}/api/users/login`;

            const payload = {
                identifier: formData.identifier,
                password: formData.password
            };

            const response = await axios.post(endpoint, payload);

            const { token, refresh_token } = response.data;

            localStorage.setItem('token', token);
            if (refresh_token) {
                localStorage.setItem('refresh_token', refresh_token);
            }

            toast.success('Login successful!');
            
            redirectTimeoutRef.current = setTimeout(() => {
                router.push('/home');
            }, 1000);

            import('../../utils/auth').then(({ getUserRole }) => {
                console.log('User Role:', getUserRole());
            });

        } catch (err: unknown) {
            let errorMessage = 'Login failed due to an unknown error.';

            if (axios.isAxiosError(err) && err.response) {
                errorMessage = err.response.data.details || err.response.data.error || 'Check server logs.';
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }

            toast.error('Login failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <Card 
                title="Login To Your Account"
                className="auth-card"
                style={{ maxWidth: '400px', width: '100%' }}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="p-field">
                        <label htmlFor="identifier" className="p-label">Username or Email</label>
                        <InputText
                            id="identifier"
                            value={formData.identifier}
                            onChange={(e) => setFormData(prev => ({ ...prev, identifier: e.target.value }))}
                            required
                            placeholder="Enter your username or email"
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div className="p-field">
                        <label htmlFor="password" className="p-label">Password</label>
                        <Password
                            id="password"
                            inputId="password"
                            value={formData.password}
                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            required
                            placeholder="Enter your password"
                            feedback={false}
                            toggleMask
                            style={{ width: '100%' }}
                        />
                    </div>
                    <Button 
                        type="submit" 
                        label="Login"
                        icon="pi pi-sign-in"
                        loading={loading}
                        disabled={loading}
                        style={{ width: '100%' }}
                    />
                </form>
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        Don&apos;t have an account?
                    </p>
                    <Button
                        label="Register"
                        icon="pi pi-user-plus"
                        onClick={() => router.push('/register')}
                        outlined
                        style={{ width: '100%' }}
                    />
                </div>
            </Card>
        </div>
    );
};

export default LoginPage;