from sqlalchemy.ext.asyncio import AsyncSession

from models.user_profile import UserProfile
from schemas.user_profile import UserProfileUpdate, GymDaysUpdate


class UserService:

    @staticmethod
    async def update_profile(db: AsyncSession, profile: UserProfile, data: UserProfileUpdate) -> UserProfile:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(profile, key, value)
        await db.flush()
        return profile

    @staticmethod
    async def update_gym_days(db: AsyncSession, profile: UserProfile, data: GymDaysUpdate) -> UserProfile:
        profile.gym_days = data.gym_days
        await db.flush()
        return profile
