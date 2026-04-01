import React from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Plus, Trash2 } from 'lucide-react';
import { api } from '../api';
import type { ExercisePR } from '../types';
import toast from 'react-hot-toast';

interface Props {
    exerciseId: string;
    prs: ExercisePR[];
    onUpdate: () => void;
    onAddClick: () => void;
}

const ExercisePRView: React.FC<Props> = ({ exerciseId, prs, onUpdate, onAddClick }) => {
    const sorted = [...prs].sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
    const chartData = sorted.map(pr => ({
        date: new Date(pr.recorded_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        weight: pr.weight
    }));

    const handleDelete = async (prId: string) => {
        try {
            await api.deleteExercisePR(prId);
            toast.success('PR deleted');
            onUpdate();
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete PR');
        }
    };

    return (
        <div className="p-5 flex flex-col md:flex-row gap-8 animate-fade-in">
            <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Trophy size={14} className="text-brand" /> Weight Progress
                    </h4>
                    <button 
                        onClick={onAddClick}
                        className="text-xs bg-brand/20 hover:bg-brand text-brand-light hover:text-white px-3 py-1.5 rounded-lg font-semibold transition-all border border-brand/30 flex items-center gap-1.5 cursor-pointer"
                    >
                        <Plus size={14} /> Log New PR
                    </button>
                </div>
                
                {chartData.length > 0 ? (
                    <div className="h-[220px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id={`grad-${exerciseId}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff5722" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ff5722" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ background: '#131720', border: '1px solid rgba(255,87,34,0.3)', borderRadius: '12px', color: '#f8fafc', fontSize: 12 }}
                                    formatter={(v: number) => [`${v} kg`, 'Personal Record']}
                                />
                                <Area type="monotone" dataKey="weight" stroke="#ff5722" strokeWidth={2.5} fill={`url(#grad-${exerciseId})`} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[220px] w-full border border-dashed border-surface-600 rounded-2xl flex flex-col items-center justify-center text-slate-500 bg-surface-800/30 gap-2">
                        <Trophy size={24} className="opacity-20" />
                        <p className="text-sm">No PRs logged yet. Let's record your first one!</p>
                    </div>
                )}
            </div>
            
            <div className="w-full md:w-72 flex flex-col pt-1">
                <div className="bg-surface-800/50 rounded-2xl p-5 border border-surface-600/50 flex-1 min-h-[200px] flex flex-col shadow-inner">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">History Log</h4>
                    {sorted.length > 0 ? (
                        <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 max-h-[160px]">
                            {sorted.slice().reverse().map(pr => (
                                <div key={pr.id} className="flex items-center justify-between text-sm group group py-2 border-b border-surface-700/50 last:border-0 hover:bg-surface-700/20 px-2 rounded-lg transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold">{pr.weight} kg</span>
                                        <span className="text-[10px] text-slate-500">{new Date(pr.recorded_at).toLocaleDateString()}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(pr.id)} 
                                        className="text-slate-500 hover:text-danger opacity-0 group-hover:opacity-100 transition-all cursor-pointer p-1.5 hover:bg-danger/10 rounded-lg"
                                        title="Delete entry"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-xs text-slate-600 italic">
                            Your PR history will appear here
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExercisePRView;
