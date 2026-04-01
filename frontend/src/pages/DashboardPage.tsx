import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Scale, TrendingUp, Target, Sparkles, ClipboardList } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api';
import type { DashboardStats, WeightTrendPoint } from '../types';
import StatCard from '../components/StatCard';

const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [weightTrend, setWeightTrend] = useState<WeightTrendPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [s, w] = await Promise.all([
                    api.dashboardStats(),
                    api.weightTrend(30),
                ]);
                setStats(s);
                setWeightTrend(w);
            } catch (err) {
                console.error('Failed to load dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <div className="p-4 md:p-8 animate-slide-up flex flex-col gap-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Your fitness journey at a glance
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/plans"
                        className="bg-gradient-to-r from-brand to-brand-dark hover:from-brand-light hover:to-brand text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg shadow-brand/20 cursor-pointer"
                    >
                        <ClipboardList size={16} />
                        My Plans
                    </Link>
                    <Link
                        to="/ai-insights"
                        className="glass hover:border-accent/30 text-accent px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer"
                    >
                        <Sparkles size={16} />
                        AI Analysis
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    label="Current Weight"
                    value={stats?.current_weight ? `${stats.current_weight}kg` : null}
                    icon={<Scale size={20} />}
                    change={stats?.weight_change ? `${stats.weight_change > 0 ? '+' : ''}${stats.weight_change}kg` : undefined}
                    changeType={stats?.weight_change ? (stats.weight_change > 0 ? 'negative' : 'positive') : 'neutral'}
                    loading={loading}
                />
                <StatCard
                    label="Target Weight"
                    value={stats?.target_weight_kg ? `${stats.target_weight_kg}kg` : '—'}
                    icon={<Target size={20} />}
                    change={stats?.fitness_goal || undefined}
                    changeType="neutral"
                    loading={loading}
                />
                <StatCard
                    label="Weight Entries"
                    value={stats?.total_weight_entries ?? 0}
                    icon={<TrendingUp size={20} />}
                    change="total logged"
                    changeType="neutral"
                    loading={loading}
                />
            </div>

            {/* Weight Trend Chart */}
            <div className="glass rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Weight Trend</h2>
                    <Link to="/weight" className="text-xs text-brand-light hover:text-brand transition-colors cursor-pointer">
                        View All →
                    </Link>
                </div>
                {weightTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={weightTrend}>
                            <defs>
                                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ff5722" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ff5722" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                tick={{ fill: '#64748b', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis
                                tick={{ fill: '#64748b', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                domain={['dataMin - 2', 'dataMax + 2']}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: '#131720',
                                    border: '1px solid rgba(255,87,34,0.3)',
                                    borderRadius: '12px',
                                    color: '#f8fafc',
                                    fontSize: 12,
                                }}
                                labelFormatter={(v) => new Date(v).toLocaleDateString()}
                                formatter={(value: number) => [`${value} kg`, 'Weight']}
                            />
                            <Area
                                type="monotone"
                                dataKey="weight"
                                stroke="#ff5722"
                                strokeWidth={2}
                                fill="url(#weightGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-[280px] text-slate-500 text-sm">
                        No weight data yet. Start tracking!
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
