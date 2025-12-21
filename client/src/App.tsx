import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DelegateDashboard } from './pages/DelegateDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ConferencePage } from './pages/ConferencePage';
import { CommitteePage } from './pages/CommitteePage';
import { useEffect } from 'react';
import { useSocket } from './hooks/useSocket';

function App() {
    const { token, loadUser, isLoading, user } = useAuthStore();

    // Initialize socket connection
    useSocket();

    useEffect(() => {
        if (token) {
            loadUser();
        }
    }, [token, loadUser]);

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: '#0f172a',
                color: '#f8fafc'
            }}>
                Loading...
            </div>
        );
    }

    const getDashboardRoute = () => {
        if (!user) return '/login';
        switch (user.role) {
            case 'admin':
                return '/admin';
            case 'staff':
                return '/staff';
            default:
                return '/delegate';
        }
    };

    return (
        <Routes>
            <Route path="/login" element={!token ? <LoginPage /> : <Navigate to={getDashboardRoute()} />} />
            <Route path="/register" element={!token ? <RegisterPage /> : <Navigate to={getDashboardRoute()} />} />

            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/delegate" element={<DelegateDashboard />} />
                <Route path="/staff" element={<StaffDashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/conference/:id" element={<ConferencePage />} />
                <Route path="/committee/:id" element={<CommitteePage />} />
            </Route>

            <Route path="/" element={<Navigate to={token ? getDashboardRoute() : '/login'} />} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

export default App;
