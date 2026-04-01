import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface AuthUser {
    user_id: string;
    username: string;
    name: string;
}

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string, name: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

const API_BASE = '/api/auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('fitlog_token'));
    const [isLoading, setIsLoading] = useState(true);

    // Validate existing token on mount
    useEffect(() => {
        const validateToken = async () => {
            const stored = localStorage.getItem('fitlog_token');
            if (!stored) {
                setIsLoading(false);
                return;
            }
            try {
                const res = await axios.get(`${API_BASE}/me`, {
                    headers: { Authorization: `Bearer ${stored}` },
                });
                setUser({
                    user_id: res.data.user_id,
                    username: res.data.username,
                    name: res.data.name,
                });
                setToken(stored);
            } catch {
                // Token expired or invalid
                localStorage.removeItem('fitlog_token');
                setToken(null);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        validateToken();
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        const res = await axios.post(`${API_BASE}/login`, { username, password });
        const { access_token, user_id, username: resUsername, name } = res.data;
        localStorage.setItem('fitlog_token', access_token);
        setToken(access_token);
        setUser({ user_id, username: resUsername, name });
    }, []);

    const register = useCallback(async (username: string, password: string, name: string) => {
        const res = await axios.post(`${API_BASE}/register`, { username, password, name });
        const { access_token, user_id, username: resUsername, name: userName } = res.data;
        localStorage.setItem('fitlog_token', access_token);
        setToken(access_token);
        setUser({ user_id, username: resUsername, name: userName });
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('fitlog_token');
        setToken(null);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
