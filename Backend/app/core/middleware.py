import logging
import time
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("request")


class LoggingMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request, call_next):
        start_time = time.time()

        response = await call_next(request)

        duration = time.time() - start_time

        logger.info(
            "%s %s -> %s (%.2f sec)",
            request.method,
            request.url.path,
            response.status_code,
            duration,
        )

        return response
