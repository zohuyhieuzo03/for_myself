import logging
import sentry_sdk
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.core.config import settings
from app.services.scheduler_service import start_gmail_sync_scheduler, stop_gmail_sync_scheduler

logger = logging.getLogger(__name__)


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting Gmail sync scheduler...")
    try:
        start_gmail_sync_scheduler()
        logger.info("Gmail sync scheduler started successfully")
    except Exception as e:
        logger.error(f"Failed to start Gmail sync scheduler: {e}")
    
    yield
    
    # Shutdown
    logger.info("Stopping Gmail sync scheduler...")
    try:
        stop_gmail_sync_scheduler()
        logger.info("Gmail sync scheduler stopped successfully")
    except Exception as e:
        logger.error(f"Failed to stop Gmail sync scheduler: {e}")


if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
    lifespan=lifespan,
)

# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)
