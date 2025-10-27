import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import App from './App.jsx';
import Login from './pages/Login.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import UserManagement from './pages/UserManagement.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import SessionManagement from './pages/SessionManagement.jsx';
import MemberDashboard from './pages/MemberDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import './index.css';

// Dashboard Router Component
function DashboardRouter() {
    const { user } = useAuth();

    // If member, show member dashboard
    if (user?.role === 'member') {
        return <MemberDashboard />;
    }

    // If admin, show full dashboard
    return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />

                    {/* Protected Routes */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route
                            index
                            element={<Navigate to="/dashboard" replace />}
                        />
                        <Route
                            path="dashboard"
                            element={
                                <ProtectedRoute
                                    requiredRole={['admin', 'member']}
                                >
                                    <DashboardRouter />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="change-password"
                            element={<ChangePassword />}
                        />
                        <Route
                            path="sessions"
                            element={<SessionManagement />}
                        />

                        {/* Admin Only Routes */}
                        <Route
                            path="users"
                            element={
                                <ProtectedRoute requiredRole="admin">
                                    <UserManagement />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="audit-logs"
                            element={
                                <ProtectedRoute requiredRole="admin">
                                    <AuditLogs />
                                </ProtectedRoute>
                            }
                        />
                    </Route>

                    {/* Fallback */}
                    <Route
                        path="*"
                        element={<Navigate to="/dashboard" replace />}
                    />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);
