import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the auth token to every request
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor (optional, but good for global error handling)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // You could handle 401 (Unauthorized) here by redirecting to login
        // if (error.response && error.response.status === 401) {
        //     window.location.href = '/login';
        // }
        return Promise.reject(error);
    }
);

export default api;
