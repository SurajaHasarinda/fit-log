from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import logging
import sys

from config import get_settings
from database import create_tables
from controllers.auth_controller import router as auth_router
from controllers.user_controller import router as user_router
from controllers.plan_controller import router as plan_router
from controllers.exercise_controller import router as exercise_router
from controllers.weight_controller import router as weight_router
from controllers.analytics_controller import router as analytics_router
from controllers.ai_controller import router as ai_router
from starlette.middleware.base import BaseHTTPMiddleware
import time

logger = logging.getLogger("fitlog")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter('%(asctime)s | %(levelname)-8s | %(name)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S'))
    logger.addHandler(handler)

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        logger.info(f"INCOMING | {request.method:7} | {request.url.path}")
        try:
            response = await call_next(request)
            process_time = (time.time() - start_time) * 1000
            logger.info(f"COMPLETE | {request.method:7} | {request.url.path} | {response.status_code} | {process_time:.2f}ms")
            return response
        except Exception as e:
            process_time = (time.time() - start_time) * 1000
            logger.error(f"ERROR    | {request.method:7} | {request.url.path} | FAILED | {process_time:.2f}ms | {str(e)}")
            raise e from None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup & shutdown events."""
    logger.info("Starting FitLog Backend Services...")
    try:
        await create_tables()
        logger.info("Successfully connected to the database and initialized tables.")
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}", exc_info=True)
    yield
    logger.info("Shutting down FitLog Backend Services...")


settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    description="Gym progress tracking API",
    version="1.0.0",
    lifespan=lifespan,
    debug=settings.DEBUG,
)

# CORS - allow configured origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoggingMiddleware)

# Register all routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(plan_router)
app.include_router(exercise_router)
app.include_router(weight_router)
app.include_router(analytics_router)
app.include_router(ai_router)


@app.get("/api/health")
async def health_check():
    logger.info("Health check endpoint was called")
    return {"status": "healthy", "app": "FitLog"}


# ── Static Files (Frontend) ───────────────────────────────────────────────────

from fastapi.staticfiles import StaticFiles
from pathlib import Path

# Serve frontend static files if available (for production/docker)
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    # Use uvicorn runner when main.py is executed directly
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=9281,
        reload=settings.DEBUG,
        access_log=True
    )
