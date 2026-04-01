import json
import asyncio
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from models.user_profile import UserProfile
from models.workout_plan import WorkoutPlan
from models.workout_day import WorkoutDay
from models.exercise import Exercise
from models.weight_log import WeightLog

settings = get_settings()


class AIService:
    """AI service: reviews workout plan for muscle group coverage."""

    @staticmethod
    def _get_client():
        from google import genai
        return genai.Client(api_key=settings.GEMINI_API_KEY)

    @staticmethod
    async def analyze_plan(db: AsyncSession, profile: UserProfile) -> dict:
        """Analyze the user's current workout plan and recommend missing muscle groups."""

        # Get current workout plan with days and exercises
        result = await db.execute(
            select(WorkoutPlan)
            .where(
                WorkoutPlan.user_id == profile.id,
                WorkoutPlan.is_current == True,
            )
            .options(
                selectinload(WorkoutPlan.days).selectinload(WorkoutDay.exercises).selectinload(Exercise.prs)
            )
        )
        plan = result.scalar_one_or_none()

        if not plan:
            return {
                "summary": "No current workout plan found. Create a plan and set it as current to get AI recommendations.",
                "covered_muscle_groups": [],
                "missing_muscle_groups": [],
                "recommendations": ["Create a workout plan first, then come back for AI analysis."],
            }

        # Build plan data for AI
        plan_data = {
            "name": plan.name,
            "description": plan.description,
            "total_days": plan.total_days,
            "days": [],
        }
        for day in sorted(plan.days, key=lambda d: d.sort_order):
            day_data = {
                "day_number": day.day_number,
                "label": day.label,
                "exercises": [
                    {
                        "name": ex.name,
                        "sets": ex.sets,
                        "reps": ex.reps,
                        "max_pr_kg": max([p.weight for p in ex.prs]) if ex.prs else None,
                        "pr_count": len(ex.prs) if ex.prs else 0,
                    }
                    for ex in sorted(day.exercises, key=lambda e: e.sort_order)
                ],
            }
            plan_data["days"].append(day_data)

        # Get latest weight
        weight_result = await db.execute(
            select(WeightLog)
            .where(WeightLog.user_id == profile.id)
            .order_by(WeightLog.recorded_date.desc())
            .limit(1)
        )
        latest_weight = weight_result.scalar_one_or_none()

        # Build user context
        user_data = {
            "name": profile.name,
            "height_cm": profile.height_cm,
            "gender": profile.gender,
            "target_weight_kg": profile.target_weight_kg,
            "fitness_goal": profile.fitness_goal,
            "gym_days": profile.gym_days,
            "current_weight_kg": latest_weight.weight_kg if latest_weight else None,
        }

        prompt = AIService._build_prompt(user_data, plan_data)

        try:
            from google.genai import types
            client = AIService._get_client()
            
            def _generate():
                return client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                    ),
                )
            
            # Run the synchronous API call in a thread to prevent blocking FastAPI
            response = await asyncio.to_thread(_generate)
            
            response_json = json.loads(response.text)
            
            insights_data = {
                "summary": response_json.get("summary", ""),
                "covered_muscle_groups": response_json.get("covered_muscle_groups", []),
                "missing_muscle_groups": response_json.get("missing_muscle_groups", []),
                "recommendations": response_json.get("recommendations", []),
                "improvement_suggestions": response_json.get("improvement_suggestions", []),
            }
            
            # Save the new insights to the plan
            plan.ai_insights = insights_data
            await db.flush()
            
            return insights_data
        except Exception as e:
            print(f"AI ERROR: {str(e)}")
            return {
                "summary": f"AI analysis is currently unavailable: {str(e)}",
                "covered_muscle_groups": [],
                "missing_muscle_groups": [],
                "recommendations": ["Ensure GEMINI_API_KEY is set in your .env file."],
                "improvement_suggestions": [],
            }

    @staticmethod
    async def get_insights(db: AsyncSession, profile: UserProfile) -> dict | None:
        """Get the cached AI insights for the current plan without calling the API."""
        result = await db.execute(
            select(WorkoutPlan)
            .where(
                WorkoutPlan.user_id == profile.id,
                WorkoutPlan.is_current == True,
            )
        )
        plan = result.scalar_one_or_none()
        if plan and plan.ai_insights:
            return plan.ai_insights
        return None

    @staticmethod
    def _build_prompt(user_data: dict, plan_data: dict) -> str:
        return f"""You are an expert fitness coach and exercise scientist.

Review the following workout plan, user profile, and performance data (PRs). Your job is to:
1. Identify which major muscle groups are already covered by the plan.
2. Identify any major muscle groups that are MISSING or underrepresented.
3. Provide specific exercise recommendations to fill the gaps.
4. ANALYZE the current PRs and suggest IMPROVEMENTS for existing exercises (e.g., progressive overload tips, set/rep adjustments based on current strength).

MAJOR MUSCLE GROUPS:
Chest, Back, Shoulders, Biceps, Triceps, Forearms, Core/Abs, Quads, Hamstrings, Glutes, Calves

USER PROFILE & METADATA:
{json.dumps(user_data, indent=2)}

CURRENT WORKOUT PLAN & PERFORMANCE (PRs):
{json.dumps(plan_data, indent=2)}

Respond with a JSON object containing:
- "summary": A 2-3 sentence assessment of the plan's overall coverage and user progress
- "covered_muscle_groups": An array of muscle group names that are well-covered
- "missing_muscle_groups": An array of muscle group names that are missing
- "recommendations": An array of 3-6 specific NEW exercises to add. Format: "Exercise Name - Reps x Sets - Target Muscle"
- "improvement_suggestions": An array of 3-5 specific tips to improve CURRENT exercises based on PRs. 
  Example: "Increase weight on Bench Press by 2.5kg next week to break your 80kg plateau." or "Try 4 sets of 12 for Squats to improve hypertrophy for your goal."

IMPORTANT: Keep suggestions concise and actionable.
"""
