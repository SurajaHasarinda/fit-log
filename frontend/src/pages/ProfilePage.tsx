import React, { useState, useEffect } from 'react';
import { User, Save } from 'lucide-react';
import { api } from '../api';
import type { UserProfile } from '../types';
import WeekDaySelector from '../components/WeekDaySelector';

const ProfilePage: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile|null>(null);
    const [form, setForm] = useState({name:'',height_cm:'',date_of_birth:'',gender:'',target_weight_kg:'',fitness_goal:''});
    const [gymDays, setGymDays] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(()=>{
        const load = async()=>{
            try{
                const p = await api.getProfile();
                setProfile(p);
                setForm({name:p.name||'',height_cm:p.height_cm?.toString()||'',date_of_birth:p.date_of_birth||'',gender:p.gender||'',target_weight_kg:p.target_weight_kg?.toString()||'',fitness_goal:p.fitness_goal||''});
                setGymDays(p.gym_days||[]);
            }catch(e){console.error(e);}
            finally{setLoading(false);}
        };
        load();
    },[]);

    const handleSave = async()=>{
        setSaving(true);
        try{
            await api.updateProfile({
                name:form.name, height_cm:form.height_cm?parseFloat(form.height_cm):null,
                date_of_birth:form.date_of_birth||null, gender:form.gender||null,
                target_weight_kg:form.target_weight_kg?parseFloat(form.target_weight_kg):null,
                fitness_goal:form.fitness_goal||null,
            } as any);
            await api.updateGymDays(gymDays);
            setSaved(true); setTimeout(()=>setSaved(false),2000);
        }catch(e){console.error(e);}
        finally{setSaving(false);}
    };

    if(loading) return <div className="p-8"><div className="h-8 skeleton-shimmer rounded w-48 mb-6"></div></div>;

    return (
        <div className="p-6 md:p-8 animate-slide-up flex flex-col gap-6 max-w-3xl mx-auto">
            <div><h1 className="text-2xl font-bold">Profile</h1><p className="text-slate-400 text-sm mt-1">Your personal information</p></div>

            <div className="glass rounded-xl p-6 flex flex-col gap-5">
                <div className="flex items-center gap-4 pb-4 border-b border-surface-600">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-accent flex items-center justify-center">
                        <User size={28} className="text-white"/>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">{form.name||'Your Name'}</h2>
                        <p className="text-xs text-slate-500">Member since {profile?new Date(profile.created_at).toLocaleDateString('en',{month:'long',year:'numeric'}):''}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Name</label>
                        <input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}
                            className="w-full bg-surface-700 border border-surface-500 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50"/>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Height (cm)</label>
                        <input type="number" value={form.height_cm} onChange={e=>setForm({...form,height_cm:e.target.value})} placeholder="175"
                            className="w-full bg-surface-700 border border-surface-500 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand/50"/>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Date of Birth</label>
                        <input type="date" value={form.date_of_birth} onChange={e=>setForm({...form,date_of_birth:e.target.value})}
                            className="w-full bg-surface-700 border border-surface-500 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50"/>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Gender</label>
                        <select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}
                            className="w-full bg-surface-700 border border-surface-500 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50 cursor-pointer">
                            <option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Target Weight (kg)</label>
                        <input type="number" step="0.1" value={form.target_weight_kg} onChange={e=>setForm({...form,target_weight_kg:e.target.value})} placeholder="70"
                            className="w-full bg-surface-700 border border-surface-500 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand/50"/>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Fitness Goal</label>
                        <select value={form.fitness_goal} onChange={e=>setForm({...form,fitness_goal:e.target.value})}
                            className="w-full bg-surface-700 border border-surface-500 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50 cursor-pointer">
                            <option value="">Select</option><option value="bulk">Bulk</option><option value="cut">Cut</option><option value="maintain">Maintain</option><option value="strength">Strength</option><option value="endurance">Endurance</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Gym Days</label>
                    <WeekDaySelector selectedDays={gymDays} onChange={setGymDays}/>
                </div>

                <button onClick={handleSave} disabled={saving}
                    className={`mt-2 px-6 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${saved?'bg-success text-white':'bg-gradient-to-r from-brand to-brand-dark text-white shadow-lg shadow-brand/20'} disabled:opacity-50`}>
                    {saving?'Saving...':saved?<><span>✓</span> Saved!</>:<><Save size={16}/> Save Profile</>}
                </button>
            </div>
        </div>
    );
};

export default ProfilePage;
