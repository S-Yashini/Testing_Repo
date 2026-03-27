import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.exceptions import AppException
from app.core.responses import ErrorResponse

logger = logging.getLogger(__name__)


async def app_exception_handler(request: Request, exc: AppException):
    """
    Handles all custom AppException errors.
    """

    logger.warning(
        "AppException: %s - %s",
        exc.code,
        exc.message,
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error={"code": exc.code, "message": exc.message}
        ).dict(),
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handles request validation errors.
    """

    logger.warning("Validation error: %s", exc.errors())

    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            error={
                "code": "VALIDATION_ERROR",
                "message": "Invalid input data",
            }
        ).dict(),
    )


async def global_exception_handler(request: Request, exc: Exception):
    """
    Handles unexpected server errors.
    """

    logger.error("Unhandled exception occurred", exc_info=True)

    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Something went wrong. Please try again later.",
            }
        ).dict(),
    )
