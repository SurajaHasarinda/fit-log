import React from 'react';

interface StatCardProps {
    label: string;
    value: string | number | null;
    icon: React.ReactNode;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, change, changeType, loading }) => {
    return (
        <div className="glass rounded-xl p-5 flex flex-col gap-3 hover:border-brand/30 transition-all duration-300 group">
            <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs uppercase tracking-wider font-medium">{label}</span>
                <div className="text-brand-light opacity-60 group-hover:opacity-100 transition-opacity">
                    {icon}
                </div>
            </div>
            {loading ? (
                <div className="h-9 skeleton-shimmer rounded w-24"></div>
            ) : (
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-white">{value ?? '—'}</span>
                    {change && (
                        <span className={`text-xs font-medium pb-1 ${
                            changeType === 'positive' ? 'text-success' :
                            changeType === 'negative' ? 'text-danger' :
                            'text-slate-400'
                        }`}>
                            {change}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default StatCard;
