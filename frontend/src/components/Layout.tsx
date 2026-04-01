import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, ClipboardList, Scale, Sparkles, User, LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Home' },
    { to: '/plans', icon: ClipboardList, label: 'Plans' },
    { to: '/weight', icon: Scale, label: 'Log' },
    { to: '/ai-insights', icon: Sparkles, label: 'AI' },
    { to: '/profile', icon: User, label: 'Me' },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user, logout } = useAuth();

    return (
        <div className="h-screen bg-surface-900 text-slate-200 flex flex-col md:flex-row overflow-hidden font-mono">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-surface-800 border-r border-surface-600 p-5 shrink-0 h-screen overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-3 mb-10 px-2 mt-4">
                    <img src="/fit-log.svg" alt="FitLog" className="w-10 h-10 drop-shadow-md" />
                    <span className="font-bold text-xl gradient-text tracking-widest uppercase">FitLog</span>
                </div>

                <nav className="space-y-2 flex-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({ isActive }) =>
                                `flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                                    isActive
                                        ? 'bg-brand/20 text-brand-light border border-brand/30 shadow-lg shadow-brand/10'
                                        : 'text-slate-500 hover:bg-surface-700 hover:text-slate-200'
                                }`
                            }
                        >
                            <item.icon size={20} />
                            <span className="text-sm font-bold tracking-tight">{item.label === 'Me' ? 'Profile' : item.label === 'Log' ? 'Weight' : item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Desktop User Footer */}
                {user && (
                    <div className="mt-auto pt-6 border-t border-surface-700/50">
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-900/50 border border-surface-700/30">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-9 h-9 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0">
                                    <span className="text-sm font-bold text-brand-light uppercase">
                                        {user.name.charAt(0)}
                                    </span>
                                </div>
                                <div className="flex flex-col truncate">
                                    <span className="text-xs font-bold text-white truncate">{user.name}</span>
                                    <span className="text-[10px] text-slate-500 truncate uppercase mt-0.5 tracking-tighter">{user.username}</span>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 text-slate-500 hover:text-danger hover:bg-danger/10 rounded-xl transition-all cursor-pointer"
                                title="Log out"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </aside>

            {/* Mobile Top Bar */}
            <div className="md:hidden flex items-center justify-center py-4 bg-surface-900/80 backdrop-blur-md border-b border-surface-800 sticky top-0 z-30">
                <div className="flex items-center gap-2">
                    <img src="/fit-log.svg" alt="FitLog" className="w-7 h-7 drop-shadow-lg" />
                    <span className="font-bold text-lg gradient-text tracking-widest uppercase">FitLog</span>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 h-full overflow-y-auto custom-scrollbar pb-24 md:pb-0 scroll-smooth">
                <div className="min-h-full">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-surface-800/90 backdrop-blur-xl border-t border-surface-700/50 flex items-center justify-around px-2 z-40 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.4)]">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-2xl transition-all duration-300 ${
                                isActive ? 'text-brand-light scale-110' : 'text-slate-500 opacity-60'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 2} />
                                <span className={`text-[10px] font-bold uppercase tracking-tighter ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                    {item.label}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

export default Layout;
