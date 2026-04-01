from uuid import UUID
from datetime import date, datetime
from pydantic import BaseModel


class UserProfileRead(BaseModel):
    id: UUID
    name: str
    height_cm: float | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    gym_days: list[str] | None = None
    target_weight_kg: float | None = None
    fitness_goal: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    name: str | None = None
    height_cm: float | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    target_weight_kg: float | None = None
    fitness_goal: str | None = None


class GymDaysUpdate(BaseModel):
    gym_days: list[str]
