"use client";

import { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const RegisterPage = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
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
        
        if (!formData.username || !formData.email || !formData.password) {
             return setError('Please fill in username, email, and password.');
        }

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match.');
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

            setMessage('Registration successful! Please log in.');
            setTimeout(() => {
                router.push('/login'); 
            }, 2000);
            

        } catch (err: unknown) {
            let errorMessage = 'Registration failed due to an unknown error.';
            
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
                <h2 className="auth-title">Create Your Account</h2>
                
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username" className="label">Username</label>
                        <input 
                            type="text" 
                            id="username"
                            name="username" 
                            value={formData.username} 
                            onChange={handleChange} 
                            required 
                            className="input"
                            placeholder="Choose a username"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email" className="label">Email</label>
                        <input 
                            type="email" 
                            id="email"
                            name="email" 
                            value={formData.email} 
                            onChange={handleChange} 
                            required 
                            className="input"
                            placeholder="your.email@example.com"
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
                            placeholder="Create a secure password"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword" className="label">Confirm Password</label>
                        <input 
                            type="password" 
                            id="confirmPassword"
                            name="confirmPassword" 
                            value={formData.confirmPassword} 
                            onChange={handleChange} 
                            required 
                            className="input"
                            placeholder="Confirm your password"
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="btn btn-primary auth-submit-btn"
                    >
                        Register
                    </button>
                </form>
                {message && <p className="success-message auth-message">{message}</p>}
                {error && <p className="error-message auth-message">Error: {error}</p>}
            </div>
        </div>
    );
};

export default RegisterPage;