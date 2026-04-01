import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import PlansPage from './pages/PlansPage';
import PlanDetailPage from './pages/PlanDetailPage';
import WeightPage from './pages/WeightPage';
import ProfilePage from './pages/ProfilePage';
import AIInsightsPage from './pages/AIInsightsPage';
import AuthPage from './pages/AuthPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const AppRoutes = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-surface-900 flex flex-col items-center justify-center p-4">
               <img src="/fit-log.svg" alt="Loading FitLog" className="w-16 h-16 animate-pulse drop-shadow-lg mb-6" />
                <div className="flex gap-2 text-slate-400 items-center">
                    <div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                    <span>Loading FitLog...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return <AuthPage />;
    }

    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<Layout><DashboardPage /></Layout>} />
                <Route path="/plans" element={<Layout><PlansPage /></Layout>} />
                <Route path="/plans/:planId" element={<Layout><PlanDetailPage /></Layout>} />
                <Route path="/weight" element={<Layout><WeightPage /></Layout>} />
                <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
                <Route path="/ai-insights" element={<Layout><AIInsightsPage /></Layout>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </HashRouter>
    );
};

function App() {
    return (
        <AuthProvider>
            <Toaster 
                position="top-right"
                toastOptions={{
                    className: 'bg-surface-800 text-white border border-surface-600 shadow-xl',
                    style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' },
                    success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                    error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
                }} 
            />
            <AppRoutes />
        </AuthProvider>
    );
}

export default App;
