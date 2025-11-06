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
import PublicDashboard from './pages/PublicDashboard.jsx';
import ProfileEdit from './pages/ProfileEdit.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import './index.css';

// Register service worker with proper update handling
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                console.log('SW registered:', registration);

                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, 60000); // Check every minute

                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'activated') {
                            console.log(
                                'New service worker activated, reloading...'
                            );
                            // Reload to get new version
                            window.location.reload();
                        }
                    });
                });
            })
            .catch((err) => {
                console.log('SW registration failed:', err);
            });
    });
}

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
                    {/* Public Route - Landing Page */}
                    <Route path="/" element={<PublicDashboard />} />

                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />

                    {/* Protected Routes */}
                    <Route
                        path="/app"
                        element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route
                            index
                            element={<Navigate to="/app/dashboard" replace />}
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
                        <Route path="profile" element={<ProfileEdit />} />
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
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);
