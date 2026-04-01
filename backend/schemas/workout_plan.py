from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

from schemas.workout_day import WorkoutDayRead


class WorkoutPlanCreate(BaseModel):
    name: str
    total_days: int = 1
    description: str | None = None


class WorkoutPlanUpdate(BaseModel):
    name: str | None = None
    total_days: int | None = None
    description: str | None = None


class WorkoutPlanSummary(BaseModel):
    id: UUID
    name: str
    total_days: int
    is_current: bool
    description: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkoutPlanRead(BaseModel):
    id: UUID
    name: str
    total_days: int
    is_current: bool
    description: str | None = None
    days: list[WorkoutDayRead] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
