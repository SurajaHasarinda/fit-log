from uuid import UUID
from pydantic import BaseModel

from schemas.exercise import ExerciseRead


class WorkoutDayCreate(BaseModel):
    day_number: int
    label: str
    sort_order: int | None = None


class WorkoutDayUpdate(BaseModel):
    label: str | None = None
    sort_order: int | None = None


class WorkoutDayRead(BaseModel):
    id: UUID
    day_number: int
    label: str
    sort_order: int
    exercises: list[ExerciseRead] = []

    model_config = {"from_attributes": True}
