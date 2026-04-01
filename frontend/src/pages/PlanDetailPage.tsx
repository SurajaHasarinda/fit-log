import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit3, ChevronLeft, Star, Save, X, Copy, ChevronDown, ChevronRight, Trophy, Menu, TrendingUp, PenLine } from 'lucide-react';
import { api } from '../api';
import type { WorkoutPlan, Exercise } from '../types';
import Modal from '../components/Modal';
import ExercisePRView from '../components/ExercisePRView';

const PlanDetailPage: React.FC = () => {
    const { planId } = useParams<{ planId: string }>();
    const navigate = useNavigate();
    const [plan, setPlan] = useState<WorkoutPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddExercise, setShowAddExercise] = useState<string | null>(null);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
    const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);
    const [editingDayId, setEditingDayId] = useState<string | null>(null);
    const [editDayLabel, setEditDayLabel] = useState('');
    const [editingPlanName, setEditingPlanName] = useState(false);
    const [editPlanNameValue, setEditPlanNameValue] = useState('');
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
    const [logPRModal, setLogPRModal] = useState<{ id: string; name: string } | null>(null);
    const [prWeight, setPrWeight] = useState('');
    const [prDate, setPrDate] = useState(new Date().toISOString().split('T')[0]);
    const [prUnit, setPrUnit] = useState<'kg' | 'lb'>('kg');
    const [isLoggingPR, setIsLoggingPR] = useState(false);
    const [newExercise, setNewExercise] = useState({
        name: '', sets: 3, reps: 10
    });

    const loadPlan = async () => {
        if (!planId) return;
        try {
            const data = await api.getPlan(planId);
            setPlan(data);
            setEditPlanNameValue(data.name);
        } catch (err) {
            console.error('Failed to load plan', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadPlan(); }, [planId]);

    const handleAddExercise = async (dayId: string) => {
        if (!newExercise.name.trim()) return;
        try {
            await api.addExercise(dayId, {
                name: newExercise.name,
                sets: newExercise.sets,
                reps: newExercise.reps,
            });
            setShowAddExercise(null);
            setNewExercise({ name: '', sets: 3, reps: 10 });
            loadPlan();
            toast.success('Exercise added!');
        } catch (err) {
            console.error('Failed to add exercise', err);
            toast.error('Failed to add exercise.');
        }
    };

    const handleUpdateExercise = async () => {
        if (!editingExercise) return;
        try {
            await api.updateExercise(editingExercise.id, editingExercise);
            setEditingExercise(null);
            loadPlan();
            toast.success('Exercise updated!');
        } catch (err) {
            console.error('Failed to update exercise', err);
            toast.error('Failed to update exercise.');
        }
    };

    const handleDeleteExercise = async () => {
        if (!exerciseToDelete) return;
        try {
            await api.deleteExercise(exerciseToDelete);
            setExerciseToDelete(null);
            loadPlan();
            toast.success('Exercise deleted.');
        } catch (err) {
            console.error('Failed to delete exercise', err);
            toast.error('Failed to delete exercise.');
        }
    };

    const handleSetCurrent = async () => {
        if (!planId) return;
        try {
            await api.setCurrentPlan(planId);
            loadPlan();
            toast.success('Plan set as current!');
        } catch (err) {
            console.error('Failed to set current', err);
            toast.error('Failed to set current plan.');
        }
    };

    const handleUpdateDayLabel = async (dayId: string) => {
        try {
            await api.updateDay(dayId, { label: editDayLabel });
            setEditingDayId(null);
            loadPlan();
            toast.success('Day label updated!');
        } catch (err) {
            console.error('Failed to update day', err);
            toast.error('Failed to update day label.');
        }
    };

    const handleUpdatePlanName = async () => {
        if (!planId || !editPlanNameValue.trim()) return;
        try {
            await api.updatePlan(planId, { name: editPlanNameValue });
            setEditingPlanName(false);
            loadPlan();
            toast.success('Plan name updated!');
        } catch (err) {
            console.error('Failed to update plan name', err);
            toast.error('Failed to update plan name.');
        }
    };

    const handleDuplicatePlan = async () => {
        if (!planId) return;
        setIsDuplicating(true);
        // Using toast.promise for duplicating to show a loading state
        toast.promise(
            api.duplicatePlan(planId).then(newPlan => {
                navigate(`/plans/${newPlan.id}`);
                return newPlan;
            }),
            {
                loading: 'Duplicating plan...',
                success: 'Plan duplicated successfully!',
                error: 'Failed to duplicate plan.'
            }
        ).finally(() => setIsDuplicating(false));
    };

    const handleLogPR = async () => {
        if (!logPRModal || !prWeight) return;
        setIsLoggingPR(true);
        let weightInKg = parseFloat(prWeight);
        if (prUnit === 'lb') {
            // Convert lb to kg (1 lb = 0.453592 kg)
            // Round to closest 0.5kg as requested (Gym standards)
            weightInKg = Math.round((weightInKg * 0.453592) * 2) / 2;
        }

        try {
            await api.logExercisePR(logPRModal.id, {
                weight: weightInKg,
                recorded_at: prDate + 'T12:00:00Z'
            });
            toast.success(`PR logged for ${logPRModal.name}! (${weightInKg} kg)`);
            setLogPRModal(null);
            setPrWeight('');
            loadPlan();
        } catch (err) {
            console.error(err);
            toast.error('Failed to log PR');
        } finally {
            setIsLoggingPR(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 md:p-8 animate-slide-up max-w-5xl mx-auto">
                <div className="h-8 skeleton-shimmer rounded w-48 mb-4"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass rounded-xl p-5 h-32 skeleton-shimmer"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="p-6 md:p-8 text-center text-slate-400">
                Plan not found. <Link to="/plans" className="text-brand-light hover:text-brand">Go back</Link>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 animate-slide-up flex flex-col gap-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex items-start gap-3 w-full md:w-auto">
                    <Link
                        to="/plans"
                        className="text-slate-400 hover:text-white transition-colors cursor-pointer mt-1 shrink-0"
                    >
                        <ChevronLeft size={20} />
                    </Link>
                    <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1 w-full">
                            {editingPlanName ? (
                                <div className="flex items-center gap-2 flex-1 max-w-sm">
                                    <input
                                        type="text"
                                        value={editPlanNameValue}
                                        onChange={e => setEditPlanNameValue(e.target.value)}
                                        className="bg-surface-700 border border-surface-500 rounded-lg px-3 py-1.5 text-lg font-bold text-white focus:outline-none focus:border-brand/50 w-full"
                                        autoFocus
                                    />
                                    <button onClick={handleUpdatePlanName} className="text-success hover:text-success/80 cursor-pointer p-1"><Save size={18} /></button>
                                    <button onClick={() => setEditingPlanName(false)} className="text-slate-400 hover:text-white cursor-pointer p-1"><X size={18} /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-bold tracking-tight">{plan.name}</h1>
                                    <button 
                                        onClick={() => { setEditPlanNameValue(plan.name); setEditingPlanName(true); }}
                                        className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer ml-1.5"
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                </div>
                            )}
                            
                            {plan.is_current && !editingPlanName && (
                                <span className="text-xs bg-brand/20 text-brand-light px-2.5 py-1 rounded-full font-medium w-fit mt-1 sm:mt-0">
                                    Current
                                </span>
                            )}
                        </div>
                        <p className="text-slate-400 text-sm mt-1">
                            {plan.total_days}-day split · {plan.days.reduce((a, d) => a + d.exercises.length, 0)} exercises
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 self-start pl-8 md:pl-0">
                    <button
                        onClick={handleDuplicatePlan}
                        disabled={isDuplicating}
                        className="glass hover:border-brand/30 text-brand-light px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        <Copy size={16} />
                        Duplicate Plan
                    </button>
                    {!plan.is_current && (
                        <button
                            onClick={handleSetCurrent}
                            className="bg-surface-700 hover:bg-surface-600 text-warning px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer border border-surface-600 hover:border-warning/30"
                        >
                            <Star size={16} />
                            Set Current
                        </button>
                    )}
                </div>
            </div>

            {/* Workout Days */}
            <div className="space-y-6">
                {plan.days.map((day) => (
                    <div key={day.id} className="glass rounded-xl overflow-hidden">
                        {/* Day Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-600">
                            {editingDayId === day.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        type="text"
                                        value={editDayLabel}
                                        onChange={e => setEditDayLabel(e.target.value)}
                                        className="bg-surface-700 border border-surface-500 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand/50 flex-1"
                                        autoFocus
                                    />
                                    <button onClick={() => handleUpdateDayLabel(day.id)} className="text-success hover:text-success/80 cursor-pointer"><Save size={16} /></button>
                                    <button onClick={() => setEditingDayId(null)} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand/20 to-accent/20 flex items-center justify-center text-sm font-bold text-brand-light">
                                        {day.day_number}
                                    </span>
                                    <h3 className="font-semibold text-white">{day.label}</h3>
                                    <button
                                        onClick={() => { setEditingDayId(day.id); setEditDayLabel(day.label); }}
                                        className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                                    >
                                        <Edit3 size={13} />
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={() => {
                                    setShowAddExercise(day.id);
                                    setNewExercise({ name: '', sets: 3, reps: 10 });
                                }}
                                className="text-xs text-brand-light hover:text-brand font-medium transition-colors flex items-center gap-1 cursor-pointer"
                            >
                                <Plus size={14} /> Add Exercise
                            </button>
                        </div>

                        {/* Exercise Content */}
                        {day.exercises.length > 0 ? (
                            <>
                                {/* Exercise List - Mobile Card View */}
                                <div className="md:hidden flex flex-col gap-3 p-3">
                                    {day.exercises.map((ex) => (
                                        <div key={ex.id} className="flex flex-col bg-surface-900/40 rounded-2xl border border-surface-700/50 overflow-hidden">
                                            <div className="p-4 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center text-slate-500 cursor-move">
                                                        <Menu size={16} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-white uppercase tracking-tight">{ex.name}</h4>
                                                        <div className="flex gap-3 mt-1">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{ex.sets} Sets</span>
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{ex.reps} Reps</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button 
                                                        onClick={() => setExpandedExerciseId(expandedExerciseId === ex.id ? null : ex.id)}
                                                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${expandedExerciseId === ex.id ? 'bg-brand text-white shadow-lg' : 'bg-surface-800 text-slate-400'}`}
                                                    >
                                                        <TrendingUp size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => setEditingExercise(ex)}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-800 text-slate-500 hover:text-white transition-colors"
                                                    >
                                                        <PenLine size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => setExerciseToDelete(ex.id)}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-800 text-slate-500 hover:text-danger transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="px-4 pb-4 flex items-center justify-between border-t border-surface-800/50 pt-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Best Record</span>
                                                    <span className="text-xs font-bold text-brand-light">
                                                        {ex.prs && ex.prs.length > 0 ? `${Math.max(...ex.prs.map(p => p.weight))} kg` : '—'}
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={() => setLogPRModal({ id: ex.id, name: ex.name })}
                                                    className="bg-brand/10 hover:bg-brand text-brand-light hover:text-white px-4 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1.5 border border-brand/20 shadow-lg shadow-brand/5 cursor-pointer uppercase tracking-wider"
                                                >
                                                    <Plus size={14} /> Log PR
                                                </button>
                                            </div>

                                            {expandedExerciseId === ex.id && (
                                                <div className="border-t border-surface-800 bg-surface-950 p-2">
                                                    <ExercisePRView 
                                                        exerciseId={ex.id} 
                                                        prs={ex.prs || []} 
                                                        onUpdate={loadPlan} 
                                                        onAddClick={() => setLogPRModal({ id: ex.id, name: ex.name })}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Exercise Table - Desktop View */}
                                <div className="hidden md:block overflow-x-auto scrollbar-hide">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest border-b border-surface-600/30">
                                                <th className="w-12 px-3 py-4"></th>
                                                <th className="text-left px-3 py-4 font-bold">Exercise</th>
                                                <th className="text-center px-3 py-4 font-bold">Sets</th>
                                                <th className="text-center px-3 py-4 font-bold">Reps</th>
                                                <th className="text-center px-3 py-4 font-bold">Best Record</th>
                                                <th className="text-right px-5 py-4 font-bold">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {day.exercises.map((ex) => (
                                                <React.Fragment key={ex.id}>
                                                    <tr className={`border-b border-surface-800/50 hover:bg-surface-700/20 transition-all duration-300 group ${expandedExerciseId === ex.id ? 'bg-surface-800/40 border-l-2 border-brand shadow-md' : ''}`}>
                                                        <td className="w-12 px-3 py-4">
                                                            <div className="text-slate-600 hover:text-slate-400 cursor-move transition-colors ml-1">
                                                                <Menu size={16} />
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-4">
                                                            <span className="font-bold text-white uppercase tracking-tight">{ex.name}</span>
                                                        </td>
                                                        <td className="px-3 py-4 text-center">
                                                            <span className="bg-surface-900 border border-surface-600 px-3 py-1 rounded-lg text-slate-300 font-bold text-xs">{ex.sets}</span>
                                                        </td>
                                                        <td className="px-3 py-4 text-center">
                                                            <span className="bg-surface-900 border border-surface-600 px-3 py-1 rounded-lg text-slate-300 font-bold text-xs">{ex.reps}</span>
                                                        </td>
                                                        <td className="px-3 py-4 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-brand-light font-bold text-xs">
                                                                    {ex.prs && ex.prs.length > 0 ? `${Math.max(...ex.prs.map(p => p.weight))} kg` : '—'}
                                                                </span>
                                                                {ex.prs && ex.prs.length > 0 && (
                                                                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter mt-0.5">Max Weight</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button 
                                                                    onClick={() => setExpandedExerciseId(expandedExerciseId === ex.id ? null : ex.id)}
                                                                    className={`p-2 rounded-xl transition-all duration-200 border cursor-pointer ${
                                                                        expandedExerciseId === ex.id 
                                                                            ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20' 
                                                                            : 'text-slate-400 bg-surface-900 border-surface-600 hover:border-brand/40 hover:text-brand-light'
                                                                    }`}
                                                                    title="Progress Tracking"
                                                                >
                                                                    <TrendingUp size={16} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => setLogPRModal({ id: ex.id, name: ex.name })}
                                                                    className="p-2 text-slate-400 bg-surface-900 border border-surface-600 rounded-xl hover:border-brand/40 hover:text-brand-light transition-all cursor-pointer"
                                                                    title="Log PR"
                                                                >
                                                                    <Plus size={16} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => setEditingExercise(ex)}
                                                                    className="p-2 text-slate-400 bg-surface-900 border border-surface-600 rounded-xl hover:border-accent/40 hover:text-accent transition-all cursor-pointer"
                                                                    title="Edit exercise"
                                                                >
                                                                    <PenLine size={16} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => setExerciseToDelete(ex.id)}
                                                                    className="p-2 text-slate-400 bg-surface-900 border border-surface-600 rounded-xl hover:border-danger/40 hover:text-danger transition-all cursor-pointer"
                                                                    title="Delete exercise"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {expandedExerciseId === ex.id && (
                                                        <tr className="bg-surface-900/50">
                                                            <td colSpan={6} className="p-0 border-t border-surface-700/30 shadow-inner">
                                                                <ExercisePRView 
                                                                    exerciseId={ex.id} 
                                                                    prs={ex.prs || []} 
                                                                    onUpdate={loadPlan} 
                                                                    onAddClick={() => setLogPRModal({ id: ex.id, name: ex.name })}
                                                                />
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="px-5 py-10 text-center text-slate-500 text-sm italic">
                                No exercises added yet. Click "Add Exercise" to start.
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Exercise Modal */}
            <Modal isOpen={!!showAddExercise} onClose={() => setShowAddExercise(null)} title="Add Exercise">
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Exercise Name</label>
                        <input
                            type="text"
                            value={newExercise.name}
                            onChange={e => setNewExercise({ ...newExercise, name: e.target.value })}
                            placeholder="e.g. Bench Press"
                            className="w-full bg-surface-700 border border-surface-500 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand/50 transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Sets</label>
                            <input
                                type="number"
                                value={newExercise.sets}
                                onChange={e => setNewExercise({ ...newExercise, sets: parseInt(e.target.value) || 0 })}
                                className="w-full bg-surface-700 border border-surface-500 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Reps</label>
                            <input
                                type="number"
                                value={newExercise.reps}
                                onChange={e => setNewExercise({ ...newExercise, reps: parseInt(e.target.value) || 0 })}
                                className="w-full bg-surface-700 border border-surface-500 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50 transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setShowAddExercise(null)} className="flex-1 bg-surface-700 hover:bg-surface-600 text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer">Cancel</button>
                        <button
                            onClick={() => showAddExercise && handleAddExercise(showAddExercise)}
                            disabled={!newExercise.name.trim()}
                            className="flex-1 bg-gradient-to-r from-brand to-brand-dark text-white py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
                        >
                            Add Exercise
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Edit Exercise Modal */}
            <Modal isOpen={!!editingExercise} onClose={() => setEditingExercise(null)} title="Edit Exercise">
                {editingExercise && (
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Name</label>
                            <input
                                type="text"
                                value={editingExercise.name}
                                onChange={e => setEditingExercise({ ...editingExercise, name: e.target.value })}
                                className="w-full bg-surface-700 border border-surface-500 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50 transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Sets</label>
                                <input
                                    type="number"
                                    value={editingExercise.sets}
                                    onChange={e => setEditingExercise({ ...editingExercise, sets: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-surface-700 border border-surface-500 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Reps</label>
                                <input
                                    type="number"
                                    value={editingExercise.reps}
                                    onChange={e => setEditingExercise({ ...editingExercise, reps: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-surface-700 border border-surface-500 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50 transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setEditingExercise(null)} className="flex-1 bg-surface-700 hover:bg-surface-600 text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer">Cancel</button>
                            <button
                                onClick={handleUpdateExercise}
                                className="flex-1 bg-gradient-to-r from-brand to-brand-dark text-white py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!exerciseToDelete} onClose={() => setExerciseToDelete(null)} title="Delete Exercise">
                <div className="flex flex-col gap-4">
                    <p className="text-slate-300 text-sm">
                        Are you sure you want to delete this exercise? This action cannot be undone.
                    </p>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setExerciseToDelete(null)}
                            className="flex-1 bg-surface-700 hover:bg-surface-600 text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteExercise}
                            className="flex-1 bg-danger/20 hover:bg-danger text-danger hover:text-white py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
                        >
                            Delete Exercise
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Log PR Modal - POPUP requested by user */}
            <Modal 
                isOpen={!!logPRModal} 
                onClose={() => setLogPRModal(null)} 
                title={`Record PR: ${logPRModal?.name}`}
            >
                <div className="flex flex-col gap-5 py-2">
                    <div className="p-4 bg-brand/10 border border-brand/20 rounded-2xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white">
                            <Trophy size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">New Personal Record!</h4>
                            <p className="text-[11px] text-brand-light uppercase tracking-widest font-semibold opacity-70">Focus on form</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Weight ({prUnit})</label>
                                <div className="flex items-center bg-surface-800 rounded-lg p-0.5 border border-surface-600">
                                    <button 
                                        onClick={() => setPrUnit('kg')}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${prUnit === 'kg' ? 'bg-brand text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        KG
                                    </button>
                                    <button 
                                        onClick={() => setPrUnit('lb')}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${prUnit === 'lb' ? 'bg-brand text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        LB
                                    </button>
                                </div>
                            </div>
                            <input
                                type="number"
                                step="0.5"
                                value={prWeight}
                                onChange={e => setPrWeight(e.target.value)}
                                placeholder="0.0"
                                className="w-full bg-surface-700 border border-surface-500 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-brand/50 transition-all"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Date Recorded</label>
                            <input
                                type="date"
                                value={prDate}
                                onChange={e => setPrDate(e.target.value)}
                                className="w-full bg-surface-700 border border-surface-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand/50 transition-all"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleLogPR}
                        disabled={!prWeight || isLoggingPR}
                        className="w-full bg-gradient-to-r from-brand to-brand-dark text-white py-4 rounded-2xl text-sm font-bold shadow-lg shadow-brand/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                        {isLoggingPR ? 'Saving Record...' : 'Complete Entry'}
                    </button>
                    
                    <button 
                        onClick={() => setLogPRModal(null)} 
                        className="w-full text-slate-500 hover:text-white text-xs font-medium py-1 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default PlanDetailPage;
