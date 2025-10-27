import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Load user on mount
    useEffect(() => {
        const loadUser = async () => {
            const savedToken = localStorage.getItem('token');
            if (savedToken) {
                try {
                    const response = await authAPI.getMe();
                    setUser(response.data.user);
                    setToken(savedToken);
                } catch (error) {
                    console.error('Failed to load user:', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };

        loadUser();
    }, []);

    const login = async (credentials) => {
        try {
            const response = await authAPI.login(credentials);
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            setToken(token);
            setUser(user);

            return response.data;
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        await authAPI.logout();
        setToken(null);
        setUser(null);
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    // Check if user has permission
    const hasRole = (roles) => {
        if (!user) return false;
        if (typeof roles === 'string') {
            return user.role === roles;
        }
        return roles.includes(user.role);
    };

    const isAdmin = () => hasRole('admin');
    const isMember = () => hasRole(['member', 'admin']);

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        hasRole,
        isAdmin,
        isMember,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

export default AuthContext;
