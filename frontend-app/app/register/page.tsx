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
        displayName: '',
        bio: ''
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

        try {
            const endpoint = `${API_BASE_URL}/api/users/register`;
            
            const payload = {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            
            display_name: formData.displayName.trim() || formData.username,
            
            bio: formData.bio 
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
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
            <div className="w-full max-w-md bg-neutral-900 shadow-2xl rounded-xl p-8 border border-neutral-700">
                <h2 className="text-3xl font-extrabold text-white text-center mb-6">Create Your Account</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-neutral-300">Username (required):</label>
                        <input 
                            type="text" 
                            id="username"
                            name="username" 
                            value={formData.username} 
                            onChange={handleChange} 
                            required 
                            className="mt-1 block w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md shadow-sm placeholder-neutral-500 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-neutral-300">Email (required):</label>
                        <input 
                            type="email" 
                            id="email"
                            name="email" 
                            value={formData.email} 
                            onChange={handleChange} 
                            required 
                            className="mt-1 block w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md shadow-sm placeholder-neutral-500 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-neutral-300">Password (required):</label>
                        <input 
                            type="password" 
                            id="password"
                            name="password" 
                            value={formData.password} 
                            onChange={handleChange} 
                            required 
                            className="mt-1 block w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md shadow-sm placeholder-neutral-500 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>      
                    <hr className="border-neutral-700 my-4" /> 
                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-neutral-300">Display Name (Optional):</label>
                        <input 
                            type="text" 
                            id="displayName"
                            name="displayName" 
                            value={formData.displayName} 
                            onChange={handleChange} 
                            className="mt-1 block w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md shadow-sm placeholder-neutral-500 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-neutral-300">Bio (Optional):</label>
                        <textarea 
                            id="bio"
                            name="bio" 
                            value={formData.bio} 
                            onChange={handleChange}
                            rows={3}
                            className="mt-1 block w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md shadow-sm placeholder-neutral-500 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        ></textarea>
                    </div>
                    <button 
                        type="submit" 
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
                    >
                        Register
                    </button>
                </form>
                {message && <p className="mt-4 text-center text-sm font-medium text-green-400">{message}</p>}
                {error && <p className="mt-4 text-center text-sm font-medium text-red-400">Error: {error}</p>}
            </div>
        </div>
    );
};

export default RegisterPage;