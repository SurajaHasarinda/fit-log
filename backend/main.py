from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
import logging
import sys
import time

from config import get_settings
from database import create_tables
from controllers.auth_controller import router as auth_router
from controllers.user_controller import router as user_router
from controllers.plan_controller import router as plan_router
from controllers.exercise_controller import router as exercise_router
from controllers.weight_controller import router as weight_router
from controllers.analytics_controller import router as analytics_router
from controllers.ai_controller import router as ai_router

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
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        logger.info(f"COMPLETE | {request.method:7} | {request.url.path} | {response.status_code} | {process_time:.2f}ms")
        return response

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting FitLog")
    try:
        await create_tables()
    except Exception as e:
        logger.error(f"DB Error: {str(e)}", exc_info=True)
    yield
    logger.info("Shutting down FitLog")

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan,
    debug=settings.DEBUG,
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"FATAL | {request.method} {request.url.path} | {str(exc)}", exc_info=True)
    if not settings.DEBUG:
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})
    return JSONResponse(
        status_code=500, 
        content={"detail": str(exc), "type": exc.__class__.__name__}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoggingMiddleware)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(plan_router)
app.include_router(exercise_router)
app.include_router(weight_router)
app.include_router(analytics_router)
app.include_router(ai_router)

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "app": "FitLog"}

from fastapi.staticfiles import StaticFiles
from pathlib import Path
static_dir = Path("/app/static")
if not static_dir.exists():
    static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=9281, reload=settings.DEBUG)
