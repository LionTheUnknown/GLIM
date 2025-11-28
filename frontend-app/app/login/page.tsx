"use client";

import { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const LoginPage = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        identifier: '',
        password: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        if (!formData.identifier || !formData.password) {
            return setError('Please fill in username or email and password.');
        }

        try {
            const endpoint = `${API_BASE_URL}/api/users/login`;

            const payload = {
                identifier: formData.identifier,
                password: formData.password
            };

            const response = await axios.post(endpoint, payload);

            setMessage('Login successful!');
            setTimeout(() => {
                router.push('/home');
            }, 2000);

            const { token, refresh_token } = response.data;

            localStorage.setItem('token', token);
            if (refresh_token) {
                localStorage.setItem('refresh_token', refresh_token);
            }

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

            setError(errorMessage);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Login To Your Account</h2>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="identifier" className="label">Username or Email</label>
                        <input
                            type="text"
                            id="identifier"
                            name="identifier"
                            value={formData.identifier}
                            onChange={handleChange}
                            required
                            className="input"
                            placeholder="Enter your username or email"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password" className="label">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="input"
                            placeholder="Enter your password"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary auth-submit-btn">
                        Login
                    </button>
                </form>
                {message && <p className="success-message auth-message">{message}</p>}
                {error && <p className="error-message auth-message">Error: {error}</p>}
            </div>
        </div>
    );
};

export default LoginPage;