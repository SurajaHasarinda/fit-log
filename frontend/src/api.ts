import axios from 'axios';
import type {
    UserProfile, WorkoutPlanSummary, WorkoutPlan, WeightLog,
    DashboardStats, AIInsight, WeightTrendPoint, Exercise, WorkoutDay,
} from './types';

const apiClient = axios.create({
    baseURL: '/api',
    timeout: 120000,
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('fitlog_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
        if (!isAuthEndpoint && (error.response?.status === 401 || error.response?.status === 403)) {
            localStorage.removeItem('fitlog_token');
            window.location.reload(); 
        }
        return Promise.reject(error);
    }
);

export const api = {
    // Profile
    getProfile: () => apiClient.get<UserProfile>('/profile').then(r => r.data),
    updateProfile: (data: Partial<UserProfile>) => apiClient.put<UserProfile>('/profile', data).then(r => r.data),
    updateGymDays: (gym_days: string[]) => apiClient.put<UserProfile>('/profile/gym-days', { gym_days }).then(r => r.data),

    // Plans
    listPlans: () => apiClient.get<WorkoutPlanSummary[]>('/plans').then(r => r.data),
    createPlan: (data: { name: string; total_days: number; description?: string }) =>
        apiClient.post<WorkoutPlan>('/plans', data).then(r => r.data),
    getPlan: (id: string) => apiClient.get<WorkoutPlan>(`/plans/${id}`).then(r => r.data),
    updatePlan: (id: string, data: { name?: string; total_days?: number; description?: string }) =>
        apiClient.put<WorkoutPlan>(`/plans/${id}`, data).then(r => r.data),
    deletePlan: (id: string) => apiClient.delete(`/plans/${id}`),
    setCurrentPlan: (id: string) => apiClient.put<WorkoutPlan>(`/plans/${id}/set-current`).then(r => r.data),
    duplicatePlan: (id: string) => apiClient.post<WorkoutPlan>(`/plans/${id}/duplicate`).then(r => r.data),

    // Days
    addDay: (planId: string, data: { day_number: number; label: string }) =>
        apiClient.post<WorkoutDay>(`/plans/${planId}/days`, data).then(r => r.data),
    updateDay: (dayId: string, data: { label?: string }) =>
        apiClient.put<WorkoutDay>(`/plans/days/${dayId}`, data).then(r => r.data),
    deleteDay: (dayId: string) => apiClient.delete(`/plans/days/${dayId}`),

    // Exercises
    addExercise: (dayId: string, data: { name: string; sets: number; reps: number }) =>
        apiClient.post<Exercise>(`/days/${dayId}/exercises`, data).then(r => r.data),
    updateExercise: (id: string, data: Partial<Exercise>) =>
        apiClient.put<Exercise>(`/exercises/${id}`, data).then(r => r.data),
    deleteExercise: (id: string) => apiClient.delete(`/exercises/${id}`),
    logExercisePR: (exerciseId: string, data: { weight: number; recorded_at?: string }) =>
        apiClient.post(`/exercises/${exerciseId}/prs`, data).then(r => r.data),
    deleteExercisePR: (prId: string) => apiClient.delete(`/prs/${prId}`),

    // Weight
    listWeights: (limit = 100) => apiClient.get<WeightLog[]>(`/weight?limit=${limit}`).then(r => r.data),
    logWeight: (data: { weight_kg: number; recorded_date: string; notes?: string }) =>
        apiClient.post<WeightLog>('/weight', data).then(r => r.data),
    deleteWeight: (id: string) => apiClient.delete(`/weight/${id}`),

    // Analytics
    weightTrend: (days = 90) => apiClient.get<WeightTrendPoint[]>(`/analytics/weight-trend?days=${days}`).then(r => r.data),
    dashboardStats: () => apiClient.get<DashboardStats>('/analytics/dashboard-stats').then(r => r.data),

    // AI
    analyzePlan: () =>
        apiClient.post<AIInsight>('/ai/analyze').then(r => r.data),
    getInsights: () =>
        apiClient.get<AIInsight>('/ai/insights').then(r => r.data),
};
