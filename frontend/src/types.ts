/**
 * FitLog - TypeScript Interfaces & Types
 */

export interface UserProfile {
    id: string;
    name: string;
    height_cm: number | null;
    date_of_birth: string | null;
    gender: string | null;
    gym_days: string[] | null;
    target_weight_kg: number | null;
    fitness_goal: string | null;
    created_at: string;
    updated_at: string;
}

export interface WorkoutPlanSummary {
    id: string;
    name: string;
    total_days: number;
    is_current: boolean;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export interface ExercisePR {
    id: string;
    weight: number;
    recorded_at: string;
}

export interface Exercise {
    id: string;
    name: string;
    sets: number;
    reps: number;
    sort_order: number;
    prs: ExercisePR[];
}

export interface WorkoutDay {
    id: string;
    day_number: number;
    label: string;
    sort_order: number;
    exercises: Exercise[];
}

export interface WorkoutPlan extends WorkoutPlanSummary {
    days: WorkoutDay[];
}

export interface WeightLog {
    id: string;
    weight_kg: number;
    recorded_date: string;
    notes: string | null;
    created_at: string;
}

export interface DashboardStats {
    current_weight: number | null;
    weight_change: number | null;
    total_weight_entries: number;
    target_weight_kg: number | null;
    fitness_goal: string | null;
}

export interface AIInsight {
    summary: string;
    covered_muscle_groups: string[];
    missing_muscle_groups: string[];
    recommendations: string[];
    improvement_suggestions?: string[];
}

export interface WeightTrendPoint {
    date: string;
    weight: number;
}
