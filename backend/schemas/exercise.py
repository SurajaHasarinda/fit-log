from uuid import UUID
from pydantic import BaseModel
from datetime import datetime

class ExercisePRCreate(BaseModel):
    weight: float
    recorded_at: datetime | None = None

class ExercisePRRead(BaseModel):
    id: UUID
    weight: float
    recorded_at: datetime
    model_config = {"from_attributes": True}

class ExerciseCreate(BaseModel):
    name: str
    sets: int = 3
    reps: int = 10
    sort_order: int | None = None


class ExerciseUpdate(BaseModel):
    name: str | None = None
    sets: int | None = None
    reps: int | None = None
    sort_order: int | None = None


class ExerciseRead(BaseModel):
    id: UUID
    name: str
    sets: int
    reps: int
    sort_order: int
    prs: list[ExercisePRRead] = []

    model_config = {"from_attributes": True}


class ExerciseReorder(BaseModel):
    exercise_ids: list[UUID]
