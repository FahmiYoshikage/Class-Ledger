import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-white/[0.04] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white/60">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Check role if required
    if (requiredRole) {
        const roles = Array.isArray(requiredRole)
            ? requiredRole
            : [requiredRole];
        if (!roles.includes(user.role)) {
            return (
                <div className="min-h-screen bg-white/[0.04] flex items-center justify-center p-4">
                    <div className="rounded-xl bg-white/[0.035] border border-white/[0.1]-apple p-8 max-w-md text-center">
                        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🚫</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Access Denied
                        </h2>
                        <p className="text-white/60 mb-4">
                            You don't have permission to access this page.
                        </p>
                        <p className="text-sm text-white/60">
                            Required role: <strong>{roles.join(' or ')}</strong>
                            <br />
                            Your role: <strong>{user.role}</strong>
                        </p>
                    </div>
                </div>
            );
        }
    }

    return children;
};

export default ProtectedRoute;
