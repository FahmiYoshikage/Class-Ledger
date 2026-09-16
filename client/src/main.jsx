import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import App from './App.jsx';
import Login from './components/core/Login.jsx';
import ChangePassword from './components/core/ChangePassword.jsx';
import AuditLogs from './components/settings/AuditLogs.jsx';
import SessionManagement from './components/events/SessionManagement.jsx';
import PublicDashboard from './components/core/PublicDashboard.jsx';
import Leaderboard from './components/leaderboard/Leaderboard.jsx';
import QRPayment from './components/payments/QRPayment.jsx';
import QRPaymentAdmin from './components/payments/QRPaymentAdmin.jsx';
import ProtectedRoute from './components/core/ProtectedRoute.jsx';
import DashboardLayout from './components/core/DashboardLayout.jsx';
import NotFoundPage from './components/core/NotFoundPage.jsx';
import './index.css';

// Service Worker update checking (graceful, non-destructive)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                registration.update();
            }
        } catch {
            // Ignore SW errors silently
        }
    });
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <Routes>
                    {/* Public Route - Landing Page */}
                    <Route path="/" element={<PublicDashboard />} />

                    {/* Public Routes */}
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/qr-payment" element={<QRPayment />} />
                    <Route path="/login" element={<Login />} />

                    {/* Protected Routes (Bendahara Only) */}
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
                            element={<App />}
                        />
                        <Route
                            path="change-password"
                            element={<ChangePassword />}
                        />
                        <Route
                            path="profile"
                            element={<Navigate to="/app/dashboard" replace />}
                        />
                        <Route
                            path="sessions"
                            element={<SessionManagement />}
                        />
                        <Route
                            path="audit-logs"
                            element={<AuditLogs />}
                        />
                        <Route
                            path="qr-admin"
                            element={<QRPaymentAdmin />}
                        />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    </React.StrictMode>
);