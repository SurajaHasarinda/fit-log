import React, { useState } from 'react';
import { ArrowRight, UserPlus, LogIn, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login, register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(username, password);
            } else {
                if (!name.trim()) throw new Error('Name is required');
                await register(username, password, name);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Background Lights */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md z-10 animate-slide-up">
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-3">
                        <img src="/fit-log.svg" alt="FitLog Logo" className="w-10 h-10 drop-shadow-md" />
                        <span className="font-bold text-3xl gradient-text tracking-wider">FitLog</span>
                    </div>
                </div>

                <div className="glass p-8 rounded-2xl shadow-2xl border-surface-600/50">
                    <h2 className="text-2xl font-bold text-white mb-2 text-center">
                        {isLogin ? 'Welcome Back' : 'Join FitLog'}
                    </h2>
                    <p className="text-slate-400 text-center mb-8 text-sm">
                        {isLogin 
                            ? 'Log in to track your workouts and progress.' 
                            : 'Create an account to start your fitness journey.'}
                    </p>

                    {error && (
                        <div className="mb-6 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User size={18} className="text-slate-500" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-surface-800 border-surface-600 border rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-inner"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Username</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User size={18} className="text-slate-500" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full bg-surface-800 border-surface-600 border rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-inner"
                                    placeholder="johndoe"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-slate-500" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-surface-800 border-surface-600 border rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-inner"
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-6 py-3 rounded-lg bg-gradient-to-r from-brand to-brand-light hover:from-brand-light hover:to-brand text-white font-semibold shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    {isLogin ? <LogIn size={18} className="group-hover:translate-x-1 transition-transform" /> : <UserPlus size={18} className="group-hover:translate-x-1 transition-transform" />}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-surface-600/50 flex flex-col items-center">
                        <p className="text-slate-400 text-sm mb-4">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                        </p>
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                            className="text-brand-light hover:text-white font-medium flex items-center gap-2 transition-colors group"
                        >
                            {isLogin ? 'Sign up for FitLog' : 'Log in instead'}
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
