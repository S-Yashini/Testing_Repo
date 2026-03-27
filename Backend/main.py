from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from app.api.v1.router import api_router as api_router_v1
from contextlib import asynccontextmanager

from app.core.appinsights import setup_app_insights
from app.core.database import engine, Base
from app.core.logging import setup_logging
from app.core.middleware import LoggingMiddleware
from app import models
from app.core.exceptions import AppException
from app.core.error_handlers import (
    app_exception_handler,
    validation_exception_handler,
    global_exception_handler,
)
from fastapi.staticfiles import StaticFiles



# Lifespan event handler (startup + shutdown)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ---- Startup Logic ----
    # Setup logging first
    setup_logging()
    # setup_app_insights()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    # ---- Shutdown Logic ----
    await engine.dispose()

app = FastAPI(title="ELC-EHS AI", lifespan=lifespan)

app.add_middleware(LoggingMiddleware)


# ✅ Register centralized exception handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

app.include_router(api_router_v1, prefix="/api/v1")
app.mount("/sds_sheets", StaticFiles(directory="sds_sheets"), name="sds_sheets")
