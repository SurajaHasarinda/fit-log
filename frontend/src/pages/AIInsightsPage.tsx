import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, Brain, Loader2, ArrowRight, Plus, TrendingUp } from 'lucide-react';
import { api } from '../api';
import type { AIInsight, WorkoutDay } from '../types';
import Modal from '../components/Modal';

const AIInsightsPage: React.FC = () => {
    const [insight, setInsight] = useState<AIInsight | null>(null);
    const [loading, setLoading] = useState(true);
    const [planDays, setPlanDays] = useState<WorkoutDay[]>([]);
    const [addingExercise, setAddingExercise] = useState<{name: string, sets: number, reps: number} | null>(null);
    const [selectedDayId, setSelectedDayId] = useState<string>('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        const fetchCached = async () => {
            try {
                const data = await api.getInsights();
                if (data.covered_muscle_groups.length > 0 || data.missing_muscle_groups.length > 0) {
                    setInsight(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        const loadPlanDays = async () => {
            try {
                const plans = await api.listPlans();
                const current = plans.find(p => p.is_current);
                if (current) {
                    const fullPlan = await api.getPlan(current.id);
                    setPlanDays(fullPlan.days);
                    if (fullPlan.days.length > 0) {
                        setSelectedDayId(fullPlan.days[0].id);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };

        fetchCached();
        loadPlanDays();
    }, []);

    const analyze = async () => {
        setLoading(true);
        try {
            const data = await api.analyzePlan();
            setInsight(data);
            toast.success('Analysis complete!');
        } catch (e) {
            console.error(e);
            toast.error('Failed to run AI analysis.');
            setInsight({
                summary: 'Failed to get AI analysis. Check your API key or ensure you have a current workout plan.',
                covered_muscle_groups: [],
                missing_muscle_groups: [],
                recommendations: [],
                improvement_suggestions: []
            });
        } finally {
            setLoading(false);
        }
    };

    const submitAddExercise = async () => {
        if (!addingExercise || !selectedDayId) return;
        setIsAdding(true);
        try {
            await api.addExercise(selectedDayId, {
                name: addingExercise.name,
                sets: addingExercise.sets,
                reps: addingExercise.reps,
            });
            setAddingExercise(null);
            toast.success('Added to your plan!');
        } catch (e) {
            console.error(e);
            toast.error('Failed to add exercise to plan.');
        } finally {
            setIsAdding(false);
        }
    };

    const handleAddClick = (name: string, setsReps: string) => {
        const srParts = setsReps.toLowerCase().split('x');
        let reps = 10, sets = 3;
        
        if (srParts.length === 2) {
            // First part is usually reps according to the DB format we asked for, 
            // but sometimes AI flips it. Let's just strip non-digits.
            const rRaw = srParts[0].replace(/[^0-9]/g, '');
            const sRaw = srParts[1].replace(/[^0-9]/g, '');
            if (rRaw) reps = parseInt(rRaw) || 10;
            if (sRaw) sets = parseInt(sRaw) || 3;
            
            // Heuristic: if sets > reps (like 10x3 where 10 was mapped to sets), flip them.
            if (sets > 10 && reps < 10) {
                const temp = sets;
                sets = reps;
                reps = temp;
            }
        }
        
        setAddingExercise({ name, sets, reps });
        if (planDays.length > 0 && !selectedDayId) {
            setSelectedDayId(planDays[0].id);
        }
    };

    const renderRecommendation = (rawText: string, index: number) => {
        const parts = rawText.split(' - ');
        if (parts.length === 3) {
            return (
                <div key={index} className="flex gap-4 items-center bg-surface-800/50 p-4 rounded-xl border border-surface-700/50 hover:border-brand/30 transition-colors">
                    <span className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-accent text-white text-sm font-bold flex items-center justify-center shrink-0 shadow-lg shadow-brand/20">
                        {index + 1}
                    </span>
                    <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                            <p className="text-base font-semibold text-slate-200">{parts[0].trim()}</p>
                            <p className="text-sm text-slate-400">{parts[1].trim()}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-3 md:mt-0">
                            <div className="px-3 py-1.5 rounded-lg bg-surface-700/50 whitespace-nowrap flex items-center gap-2">
                                <ArrowRight size={14} className="text-brand" />
                                <span className="text-xs font-medium text-slate-300">Focus: {parts[2].trim()}</span>
                            </div>
                            {planDays.length > 0 && (
                                <button 
                                    onClick={() => handleAddClick(parts[0].trim(), parts[1].trim())}
                                    className="bg-brand/20 hover:bg-brand text-brand-light hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-brand/10 border border-brand/30"
                                >
                                    <Plus size={14} /> Add
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            );
        }
        
        // Fallback if AI didn't follow the format perfectly
        return (
            <div key={index} className="flex gap-4 items-start bg-surface-800/50 p-4 rounded-xl border border-surface-700/50">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-accent text-white text-sm font-bold flex items-center justify-center shrink-0 shadow-lg shadow-brand/20">
                    {index + 1}
                </span>
                <p className="text-sm text-slate-200 leading-relaxed mt-1.5">{rawText}</p>
            </div>
        );
    };

    return (
        <div className="p-6 md:p-8 animate-slide-up flex flex-col gap-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={24} className="text-accent" />
                        <h1 className="text-2xl font-bold gradient-text">AI Plan Analysis</h1>
                    </div>
                    <p className="text-slate-400 text-sm">
                        Get AI-powered analysis of your current workout plan's muscle group coverage and recommendations.
                    </p>
                </div>
                <div className="flex items-center shrink-0">
                    {(insight || !loading) && (
                        <button
                            onClick={analyze}
                            disabled={loading}
                            className="bg-surface-700 hover:bg-surface-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} className="text-brand-light" />}
                            Run New Analysis
                        </button>
                    )}
                </div>
            </div>

            {loading && !insight && (
                <div className="glass rounded-xl p-16 flex flex-col items-center gap-4 animate-fade-in">
                    <div className="relative">
                        <div className="absolute inset-0 bg-brand/30 rounded-full blur-xl animate-pulse"></div>
                        <Brain size={56} className="text-brand relative z-10 animate-pulse" />
                    </div>
                    <p className="text-brand-light text-lg font-medium">Analyzing your workout plan...</p>
                    <p className="text-sm text-slate-400">Looking for missing muscle groups and generating exercise recommendations</p>
                </div>
            )}

            {insight && (
                <div className={`flex flex-col gap-5 ${loading ? 'opacity-50 pointer-events-none' : 'animate-slide-up'}`}>
                    <div className="glass rounded-xl p-6">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Analysis Summary</h3>
                        <p className="text-slate-200 leading-relaxed text-lg">{insight.summary}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="glass rounded-xl p-6 border-t-2 border-t-emerald-500/50 hover:border-t-emerald-400 transition-colors">
                            <h3 className="text-xs font-semibold text-emerald-400/80 uppercase tracking-widest mb-4">Covered Muscle Groups</h3>
                            {insight.covered_muscle_groups.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {insight.covered_muscle_groups.map((item, i) => (
                                        <span key={i} className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/20">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 italic">No covered groups detected.</p>
                            )}
                        </div>

                        <div className="glass rounded-xl p-6 border-t-2 border-t-rose-500/50 hover:border-t-rose-400 transition-colors">
                            <h3 className="text-xs font-semibold text-rose-400/80 uppercase tracking-widest mb-4">Missing Muscle Groups</h3>
                            {insight.missing_muscle_groups.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {insight.missing_muscle_groups.map((item, i) => (
                                        <span key={i} className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-sm font-medium border border-rose-500/20">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 italic">Great job! No major missing muscle groups.</p>
                            )}
                        </div>
                    </div>

                    {insight.recommendations.length > 0 && (
                        <div className="glass rounded-xl p-6 mt-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                            
                            <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-light to-accent uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Sparkles size={18} className="text-brand" />
                                Actionable Recommendations
                            </h3>
                            
                            <div className="space-y-4">
                                {insight.recommendations.map((item, i) => renderRecommendation(item, i))}
                            </div>
                        </div>
                    )}

                    {insight.improvement_suggestions && insight.improvement_suggestions.length > 0 && (
                        <div className="glass rounded-xl p-6 mt-2 relative overflow-hidden border-l-4 border-l-brand/50">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-warning/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                            
                            <h3 className="text-sm font-bold text-warning uppercase tracking-widest mb-6 flex items-center gap-2">
                                <TrendingUp size={18} />
                                Performance Improvements
                            </h3>
                            
                            <div className="space-y-3">
                                {insight.improvement_suggestions.map((suggestion, i) => (
                                    <div key={i} className="flex gap-3 items-start bg-surface-900/40 p-4 rounded-xl border border-surface-700/30">
                                        <div className="w-6 h-6 rounded-lg bg-warning/20 text-warning text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                            {i + 1}
                                        </div>
                                        <p className="text-sm text-slate-200 leading-relaxed italic">{suggestion}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!insight && !loading && (
                <div className="glass rounded-xl p-16 text-center flex flex-col items-center animate-fade-in shadow-xl shadow-black/20">
                    <div className="w-24 h-24 rounded-3xl bg-surface-700/50 flex items-center justify-center mb-6 border border-surface-600">
                        <Brain size={48} className="text-brand-light opacity-80" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Ready to analyze your plan?</h2>
                    <p className="text-slate-400 text-base max-w-lg mx-auto mb-10 leading-relaxed">
                        FitLog AI will thoroughly review your current workout plan, identify any missing or underrepresented muscle groups, and precisely recommend exercises to fill those gaps.
                    </p>
                    <button
                        onClick={analyze}
                        className="bg-gradient-to-r from-brand to-brand-dark hover:from-brand-light hover:to-brand text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all shadow-lg shadow-brand/20 cursor-pointer flex items-center gap-3 transform hover:-translate-y-0.5"
                    >
                        <Brain size={20} />
                        Run AI Analysis Now
                    </button>
                </div>
            )}

            {/* Add to Plan Modal */}
            <Modal isOpen={!!addingExercise} onClose={() => setAddingExercise(null)} title="Add to Plan">
                {addingExercise && (
                    <div className="flex flex-col gap-5">
                        <div className="bg-surface-800/50 p-4 rounded-xl border border-brand/20 flex flex-col items-center justify-center shadow-[inset_0_0_20px_rgba(255,87,34,0.05)]">
                            <h4 className="text-lg font-bold text-white mb-1">{addingExercise.name}</h4>
                            <p className="text-brand-light text-sm font-medium">{addingExercise.sets} Sets × {addingExercise.reps} Reps</p>
                        </div>
                        
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-semibold">Select Day</label>
                            <select
                                value={selectedDayId}
                                onChange={e => setSelectedDayId(e.target.value)}
                                className="w-full bg-surface-700 border border-surface-500 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-brand/50 transition-all cursor-pointer shadow-inner"
                            >
                                {planDays.map(day => (
                                    <option key={day.id} value={day.id}>
                                        Day {day.day_number}: {day.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-semibold">Sets</label>
                                <input
                                    type="number"
                                    value={addingExercise.sets}
                                    onChange={e => setAddingExercise({...addingExercise, sets: parseInt(e.target.value) || 0})}
                                    className="w-full bg-surface-700 border border-surface-500 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50 transition-all shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-semibold">Reps</label>
                                <input
                                    type="number"
                                    value={addingExercise.reps}
                                    onChange={e => setAddingExercise({...addingExercise, reps: parseInt(e.target.value) || 0})}
                                    className="w-full bg-surface-700 border border-surface-500 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50 transition-all shadow-inner"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setAddingExercise(null)} className="flex-1 bg-surface-700 hover:bg-surface-600 text-slate-300 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer">Cancel</button>
                            <button
                                onClick={submitAddExercise}
                                disabled={isAdding}
                                className="flex-1 bg-gradient-to-r from-brand to-brand-dark hover:from-brand-light hover:to-brand text-white py-3 rounded-xl text-sm font-medium transition-all shadow-lg shadow-brand/20 cursor-pointer disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {isAdding ? <Loader2 size={16} className="animate-spin" /> : 'Add to Day'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AIInsightsPage;

