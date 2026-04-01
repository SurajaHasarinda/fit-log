from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.user_profile import UserProfile
from models.weight_log import WeightLog
from schemas.weight_log import WeightLogCreate


class WeightService:

    @staticmethod
    async def list_weights(db: AsyncSession, profile: UserProfile, limit: int = 100) -> list[WeightLog]:
        result = await db.execute(
            select(WeightLog)
            .where(WeightLog.user_id == profile.id)
            .order_by(WeightLog.recorded_date.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def log_weight(db: AsyncSession, profile: UserProfile, data: WeightLogCreate) -> WeightLog:
        entry = WeightLog(
            user_id=profile.id,
            weight_kg=data.weight_kg,
            recorded_date=data.recorded_date,
            notes=data.notes,
        )
        db.add(entry)
        await db.flush()
        return entry

    @staticmethod
    async def delete_weight(db: AsyncSession, weight_id: UUID, user_id: UUID) -> bool:
        result = await db.execute(select(WeightLog).where(WeightLog.id == weight_id, WeightLog.user_id == user_id))
        entry = result.scalar_one_or_none()
        if not entry:
            return False
        await db.delete(entry)
        await db.flush()
        return True
