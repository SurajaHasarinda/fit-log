from pydantic import BaseModel


class AIAnalysisRequest(BaseModel):
    """Empty body — analysis always reviews the current plan."""
    pass


class AIAnalysisResponse(BaseModel):
    summary: str
    covered_muscle_groups: list[str]
    missing_muscle_groups: list[str]
    recommendations: list[str]
