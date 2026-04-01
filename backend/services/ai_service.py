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
                        "current_max_kg": max([p.weight for p in ex.prs]) if ex.prs else None,
                        "recent_prs": [
                            {"weight": p.weight, "date": p.recorded_at.strftime("%Y-%m-%d")} 
                            # Sort by date descending and take last 5
                            for p in sorted(ex.prs, key=lambda p: p.recorded_at, reverse=True)[:5]
                        ],
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
                "new_exercises": response_json.get("new_exercises", []),
                "general_tips": response_json.get("general_tips", []),
                "exercise_advice": response_json.get("exercise_advice", []),
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
                "new_exercises": ["Ensure GEMINI_API_KEY is set in your .env file."],
                "general_tips": [],
                "exercise_advice": []
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
            # Simple check if it's the old schema and adapt it
            insights = plan.ai_insights
            if "recommendations" in insights:
                insights["new_exercises"] = insights.get("recommendations", [])
            if "improvement_suggestions" in insights:
                insights["general_tips"] = insights.get("improvement_suggestions", [])
            if "exercise_advice" not in insights:
                insights["exercise_advice"] = []
            return insights
        return None

    @staticmethod
    def _build_prompt(user_data: dict, plan_data: dict) -> str:
        return f"""You are an expert fitness coach and exercise scientist.

Review the following workout plan, user profile, and performance data (PRs). Your job is to:
1. Identify which major muscle groups are already covered by the plan.
2. Identify any major muscle groups that are MISSING or underrepresented.
3. Provide specific exercise recommendations to fill the gaps.
4. PROGRESSIVE OVERLOAD ANALYSIS: Analyze the `recent_prs` history for each exercise. 
   - If the weight has been stagnant for more than 3 sessions (plateau), suggest specific ways to break it (e.g., fractional plates, change in rep range).
   - If the weight is increasing consistently, suggest the next weight jump (e.g., 2.5kg for upper body, 5kg for lower body).
   - If there are no PRs recorded yet, suggest a starting weight or testing strategy.

MAJOR MUSCLE GROUPS:
Chest, Back, Shoulders, Biceps, Triceps, Forearms, Core/Abs, Quads, Hamstrings, Glutes, Calves

USER PROFILE & METADATA:
{json.dumps(user_data, indent=2)}

CURRENT WORKOUT PLAN & PERFORMANCE (PRs):
{json.dumps(plan_data, indent=2)}

Respond with a JSON object exactly matching this structure:
- "summary": A brief, high-level summary of the current workout plan effectiveness.
- "covered_muscle_groups": An array of muscle groups already targeted.
- "missing_muscle_groups": An array of major muscle groups that should be ADDED.
- "new_exercises": An array of 3-6 specific NEW exercises to add (e.g., "Face Pulls - 3x15 - Rear Delts").
- "general_tips": An array of general coaching tips (e.g., rest days, hydration, warming up).
- "exercise_advice": An array of "ExerciseAdvice" objects, ONE FOR EVERY CURRENT EXERCISE in the plan.
  Example: {{"name": "Bench Press", "advice": "Plateau detected at 60kg for last 4 weeks. Try 5x5 instead of 3x10 next session."}}

IMPORTANT: Provide advice for EVERY CURRENT exercise. Keep suggestions concise and actionable.
"""
