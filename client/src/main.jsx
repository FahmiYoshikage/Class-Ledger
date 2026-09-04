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
import Leaderboard from './components/Leaderboard.jsx';
import ProfileEdit from './pages/ProfileEdit.jsx';
import QRPayment from './pages/QRPayment.jsx';
import QRPaymentAdmin from './pages/QRPaymentAdmin.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import './index.css';

// Clean up old service workers and caches on load
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            // Get all registrations
            const registrations =
                await navigator.serviceWorker.getRegistrations();

            // Unregister ALL old service workers
            for (const registration of registrations) {
                await registration.unregister();
                console.log('✅ Unregistered old service worker');
            }

            // Clear all caches
            const cacheNames = await caches.keys();
            for (const cacheName of cacheNames) {
                await caches.delete(cacheName);
                console.log(`✅ Deleted cache: ${cacheName}`);
            }

            console.log('🔄 All service workers and caches cleared');

            // Try to register new service worker (if exists)
            try {
                const registration = await navigator.serviceWorker.register(
                    '/sw.js',
                    {
                        updateViaCache: 'none',
                    }
                );

                console.log('✅ SW registered:', registration);

                // Force update check
                await registration.update();

                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'activated') {
                            console.log('🆕 New SW activated');
                            // Don't auto-reload, let user decide
                        }
                    });
                });
            } catch (swError) {
                // SW file not found or error - not critical, continue without it
                console.log(
                    'ℹ️ Service worker not available, running without PWA features'
                );
            }
        } catch (err) {
            console.error('❌ Cache cleanup error:', err);
        }
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
                    <Route path="/leaderboard" element={<Leaderboard />} />
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
                        <Route
                            path="qr-payment"
                            element={
                                <ProtectedRoute
                                    requiredRole={['admin', 'member']}
                                >
                                    <QRPayment />
                                </ProtectedRoute>
                            }
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
                        <Route
                            path="qr-admin"
                            element={
                                <ProtectedRoute requiredRole="admin">
                                    <QRPaymentAdmin />
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
