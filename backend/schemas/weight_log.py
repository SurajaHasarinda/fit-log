from uuid import UUID
from datetime import date, datetime
from pydantic import BaseModel


class WeightLogCreate(BaseModel):
    weight_kg: float
    recorded_date: date
    notes: str | None = None


class WeightLogRead(BaseModel):
    id: UUID
    weight_kg: float
    recorded_date: date
    notes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
