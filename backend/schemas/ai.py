from pydantic import BaseModel


class AIAnalysisRequest(BaseModel):
    """Empty body — analysis always reviews the current plan."""
    pass


class ExerciseAdvice(BaseModel):
    name: str
    advice: str


class AIAnalysisResponse(BaseModel):
    summary: str
    covered_muscle_groups: list[str]
    missing_muscle_groups: list[str]
    new_exercises: list[str]  # NEW exercises for missing muscles
    general_tips: list[str]    # General coaching (rest, water, etc.)
    exercise_advice: list[ExerciseAdvice] # Specific advice for EVERY current exercise
