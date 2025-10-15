import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Set axios default headers
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    // Load user on mount
    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    const response = await axios.get('/api/auth/me');
                    setUser(response.data.data);
                } catch (error) {
                    console.error('Failed to load user:', error);
                    logout();
                }
            }
            setLoading(false);
        };

        loadUser();
    }, [token]);

    const login = async (username, password) => {
        try {
            const response = await axios.post('/api/auth/login', {
                username,
                password
            });

            const { token: newToken, user: userData } = response.data.data;
            
            localStorage.setItem('token', newToken);
            setToken(newToken);
            setUser(userData);
            
            toast.success('Login successful!');
            return userData;
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            toast.error(message);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
        toast.info('Logged out successfully');
    };

    const updateUser = (userData) => {
        setUser(userData);
    };

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'Admin',
        isReceptionist: user?.role === 'Receptionist',
        isGuest: user?.role === 'Guest'
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
