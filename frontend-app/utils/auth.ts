import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    user_id: number;
    username: string;
    role: string;
    exp: number;
}

export const getUserRole = (): string | null => {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const decoded = jwtDecode<DecodedToken>(token);
        return decoded.role || null;
    } catch (error) {
        console.error('Failed to decode token:', error);
        return null;
    }
};

export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
};

export const isAdmin = (): boolean => {
    return getUserRole() === 'admin';
};
