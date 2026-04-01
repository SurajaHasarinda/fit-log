import React, { useState, useEffect } from 'react';
import { Scale, Plus, Trash2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api';
import type { WeightLog } from '../types';
import Modal from '../components/Modal';

const WeightPage: React.FC = () => {
    const [weights, setWeights] = useState<WeightLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ weight_kg: '', recorded_date: new Date().toISOString().split('T')[0], notes: '' });

    const load = async () => {
        try { setWeights(await api.listWeights()); } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const handleAdd = async () => {
        if (!form.weight_kg) return;
        try {
            await api.logWeight({ weight_kg: parseFloat(form.weight_kg), recorded_date: form.recorded_date, notes: form.notes || undefined });
            setShowAdd(false); setForm({ weight_kg: '', recorded_date: new Date().toISOString().split('T')[0], notes: '' }); load();
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: string) => {
        try { await api.deleteWeight(id); load(); } catch (e) { console.error(e); }
    };

    const chartData = [...weights].reverse().map(w => ({ date: w.recorded_date, weight: w.weight_kg }));

    return (
        <div className="p-6 md:p-8 animate-slide-up flex flex-col gap-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div><h1 className="text-2xl font-bold">Weight Tracker</h1><p className="text-slate-400 text-sm mt-1">Monitor your body weight over time</p></div>
                <button onClick={() => setShowAdd(true)} className="bg-gradient-to-r from-brand to-brand-dark text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-brand/20 cursor-pointer">
                    <Plus size={16}/>Log Weight
                </button>
            </div>

            {/* Chart */}
            <div className="glass rounded-xl p-5">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Weight Trend</h2>
                {chartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={chartData}>
                            <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff5722" stopOpacity={0.3}/><stop offset="95%" stopColor="#ff5722" stopOpacity={0}/></linearGradient></defs>
                            <XAxis dataKey="date" tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>new Date(v).toLocaleDateString('en',{month:'short',day:'numeric'})}/>
                            <YAxis tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false} domain={['dataMin-2','dataMax+2']}/>
                            <Tooltip contentStyle={{background:'#131720',border:'1px solid rgba(255,87,34,0.3)',borderRadius:'12px',color:'#f8fafc',fontSize:12}} formatter={(v:number)=>[`${v} kg`,'Weight']}/>
                            <Area type="monotone" dataKey="weight" stroke="#ff5722" strokeWidth={2} fill="url(#wg)"/>
                        </AreaChart>
                    </ResponsiveContainer>
                ) : <div className="h-[280px] flex items-center justify-center text-slate-500 text-sm">Add at least 2 entries to see the trend</div>}
            </div>

            {/* History */}
            <div className="glass rounded-xl">
                <div className="px-5 py-4 border-b border-surface-600"><h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">History</h2></div>
                {weights.length > 0 ? (
                    <div className="divide-y divide-surface-700/50">
                        {weights.map(w => (
                            <div key={w.id} className="flex items-center justify-between px-5 py-3 hover:bg-surface-700/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Scale size={14} className="text-brand-light"/></div>
                                    <div>
                                        <span className="text-sm font-bold text-white">{w.weight_kg} kg</span>
                                        <p className="text-xs text-slate-500">{new Date(w.recorded_date).toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric',year:'numeric'})}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {w.notes && <span className="text-xs text-slate-500 max-w-[150px] truncate">{w.notes}</span>}
                                    <button onClick={()=>handleDelete(w.id)} className="text-slate-500 hover:text-danger transition-colors cursor-pointer"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <div className="p-8 text-center text-slate-500 text-sm">No weight entries yet</div>}
            </div>

            <Modal isOpen={showAdd} onClose={()=>setShowAdd(false)} title="Log Weight">
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Weight (kg)</label>
                        <input type="number" step="0.1" value={form.weight_kg} onChange={e=>setForm({...form,weight_kg:e.target.value})} placeholder="75.5"
                            className="w-full bg-surface-700 border border-surface-500 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand/50"/>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Date</label>
                        <input type="date" value={form.recorded_date} onChange={e=>setForm({...form,recorded_date:e.target.value})}
                            className="w-full bg-surface-700 border border-surface-500 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50"/>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Notes</label>
                        <input type="text" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Optional"
                            className="w-full bg-surface-700 border border-surface-500 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand/50"/>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={()=>setShowAdd(false)} className="flex-1 bg-surface-700 hover:bg-surface-600 text-slate-300 py-2.5 rounded-xl text-sm cursor-pointer">Cancel</button>
                        <button onClick={handleAdd} disabled={!form.weight_kg} className="flex-1 bg-gradient-to-r from-brand to-brand-dark text-white py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-50">Save</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default WeightPage;
