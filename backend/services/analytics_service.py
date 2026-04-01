from datetime import date, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.user_profile import UserProfile
from models.weight_log import WeightLog


class AnalyticsService:

    @staticmethod
    async def get_weight_trend(db: AsyncSession, profile: UserProfile, days: int = 90) -> list[dict]:
        """Get weight entries for the last N days."""
        cutoff = date.today() - timedelta(days=days)
        result = await db.execute(
            select(WeightLog)
            .where(
                WeightLog.user_id == profile.id,
                WeightLog.recorded_date >= cutoff,
            )
            .order_by(WeightLog.recorded_date.asc())
        )
        return [
            {"date": str(w.recorded_date), "weight": w.weight_kg}
            for w in result.scalars().all()
        ]

    @staticmethod
    async def get_dashboard_stats(db: AsyncSession, profile: UserProfile) -> dict:
        """Get summary stats for the dashboard."""
        # Latest weight
        weight_result = await db.execute(
            select(WeightLog)
            .where(WeightLog.user_id == profile.id)
            .order_by(WeightLog.recorded_date.desc())
            .limit(2)
        )
        weights = weight_result.scalars().all()
        current_weight = weights[0].weight_kg if weights else None
        weight_change = round(weights[0].weight_kg - weights[1].weight_kg, 1) if len(weights) >= 2 else None

        # Total weight entries
        total_result = await db.execute(
            select(func.count(WeightLog.id))
            .where(WeightLog.user_id == profile.id)
        )
        total_entries = total_result.scalar() or 0

        return {
            "current_weight": current_weight,
            "weight_change": weight_change,
            "total_weight_entries": total_entries,
            "target_weight_kg": profile.target_weight_kg,
            "fitness_goal": profile.fitness_goal,
        }
