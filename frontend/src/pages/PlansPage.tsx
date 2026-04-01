import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Plus, Star, Trash2, ClipboardList, Calendar } from 'lucide-react';
import { api } from '../api';
import type { WorkoutPlanSummary } from '../types';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const PlansPage: React.FC = () => {
    const [plans, setPlans] = useState<WorkoutPlanSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<string | null>(null);
    const [newPlan, setNewPlan] = useState({ name: '', total_days: 3, description: '' });

    const loadPlans = async () => {
        try {
            const data = await api.listPlans();
            setPlans(data);
        } catch (err) {
            console.error('Failed to load plans', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadPlans(); }, []);

    const handleCreate = async () => {
        if (!newPlan.name.trim()) return;
        try {
            await api.createPlan(newPlan);
            setShowCreate(false);
            setNewPlan({ name: '', total_days: 3, description: '' });
            loadPlans();
            toast.success('Plan created successfully!');
        } catch (err) {
            console.error('Failed to create plan', err);
            toast.error('Failed to create plan.');
        }
    };

    const handleSetCurrent = async (id: string) => {
        try {
            await api.setCurrentPlan(id);
            loadPlans();
            toast.success('Current plan updated!');
        } catch (err) {
            console.error('Failed to set current plan', err);
            toast.error('Failed to set current plan.');
        }
    };

    const handleDelete = async () => {
        if (!planToDelete) return;
        try {
            await api.deletePlan(planToDelete);
            setPlanToDelete(null);
            loadPlans();
            toast.success('Plan deleted.');
        } catch (err) {
            console.error('Failed to delete plan', err);
            toast.error('Failed to delete plan.');
        }
    };

    return (
        <div className="p-4 md:p-8 animate-slide-up flex flex-col gap-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Workout Plans</h1>
                    <p className="text-slate-400 text-sm mt-1">Create and manage your training programs</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="bg-gradient-to-r from-brand to-brand-dark hover:from-brand-light hover:to-brand text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg shadow-brand/20 cursor-pointer"
                >
                    <Plus size={16} />
                    New Plan
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass rounded-xl p-5 h-40 skeleton-shimmer"></div>
                    ))}
                </div>
            ) : plans.length === 0 ? (
                <EmptyState
                    icon={<ClipboardList size={48} />}
                    title="No Workout Plans Yet"
                    description="Create your first workout plan to start organizing your training routine."
                    action={
                        <button
                            onClick={() => setShowCreate(true)}
                            className="bg-brand hover:bg-brand-light text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                        >
                            Create Plan
                        </button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`glass rounded-xl p-5 transition-all duration-200 hover:border-brand/30 group ${
                                plan.is_current ? 'ring-1 ring-brand/40' : ''
                            }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <Link
                                    to={`/plans/${plan.id}`}
                                    className="text-lg font-bold text-white hover:text-brand-light transition-colors cursor-pointer"
                                >
                                    {plan.name}
                                </Link>
                                <div className="flex items-center gap-1">
                                    {plan.is_current && (
                                        <span className="text-xs bg-brand/20 text-brand-light px-2.5 py-1 rounded-full font-medium">
                                            Current
                                        </span>
                                    )}
                                </div>
                            </div>

                            {plan.description && (
                                <p className="text-slate-400 text-xs mb-3 line-clamp-2">{plan.description}</p>
                            )}

                             <div className="flex items-center gap-4 text-[10px] md:text-xs text-slate-500 mb-4">
                                <span className="flex items-center gap-1 font-bold uppercase tracking-tighter">
                                    <Calendar size={12} className="text-brand" />
                                    {plan.total_days} DAY SPLIT
                                </span>
                                <span className="hidden md:inline-flex items-center gap-1 opacity-60">
                                    CREATED {new Date(plan.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }).toUpperCase()}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 pt-3 border-t border-surface-600">
                                <Link
                                    to={`/plans/${plan.id}`}
                                    className="text-xs text-brand-light hover:text-brand font-medium transition-colors cursor-pointer"
                                >
                                    View Details →
                                </Link>
                                <div className="flex-1" />
                                {!plan.is_current && (
                                    <button
                                        onClick={() => handleSetCurrent(plan.id)}
                                        className="text-slate-400 hover:text-warning transition-colors p-1 cursor-pointer"
                                        title="Set as current"
                                    >
                                        <Star size={14} />
                                    </button>
                                )}
                                <button
                                    onClick={() => setPlanToDelete(plan.id)}
                                    className="text-slate-400 hover:text-danger transition-colors p-1 cursor-pointer"
                                    title="Delete plan"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Plan Modal */}
            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Plan">
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Plan Name</label>
                        <input
                            type="text"
                            value={newPlan.name}
                            onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
                            placeholder="e.g. Push/Pull/Legs Split"
                            className="w-full bg-surface-700 border border-surface-500 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Number of Days (Split)</label>
                        <div className="flex gap-2">
                            {[2, 3, 4, 5, 6].map(n => (
                                <button
                                    key={n}
                                    onClick={() => setNewPlan({ ...newPlan, total_days: n })}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                                        newPlan.total_days === n
                                            ? 'bg-brand text-white'
                                            : 'bg-surface-700 text-slate-400 hover:bg-surface-600'
                                    }`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Description (optional)</label>
                        <textarea
                            value={newPlan.description}
                            onChange={e => setNewPlan({ ...newPlan, description: e.target.value })}
                            placeholder="Brief description of this plan..."
                            rows={2}
                            className="w-full bg-surface-700 border border-surface-500 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-all resize-none"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setShowCreate(false)}
                            className="flex-1 bg-surface-700 hover:bg-surface-600 text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={!newPlan.name.trim()}
                            className="flex-1 bg-gradient-to-r from-brand to-brand-dark text-white py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create Plan
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!planToDelete} onClose={() => setPlanToDelete(null)} title="Delete Plan">
                <div className="flex flex-col gap-4">
                    <p className="text-slate-300 text-sm">
                        Are you sure you want to delete this workout plan? This action cannot be undone.
                    </p>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setPlanToDelete(null)}
                            className="flex-1 bg-surface-700 hover:bg-surface-600 text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex-1 bg-danger/20 hover:bg-danger text-danger hover:text-white py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
                        >
                            Delete Plan
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PlansPage;
