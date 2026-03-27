import logging
import sys
from logging.handlers import RotatingFileHandler
import os


LOG_FORMAT = (
    "%(asctime)s | %(levelname)s | %(name)s | "
    "%(filename)s:%(lineno)d | %(message)s"
)


def setup_logging():
    """
    Production-grade logging configuration:
    - Console logging
    - File logging with rotation
    """
    os.makedirs("logs", exist_ok=True)

    # Root logger
    logging.basicConfig(level=logging.INFO)

    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # Prevent duplicate logs
    logger.handlers.clear()

    # -------------------------
    # Console Handler
    # -------------------------
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(logging.Formatter(LOG_FORMAT))

    # -------------------------
    # File Handler (Rotating)
    # -------------------------
    file_handler = RotatingFileHandler(
        "logs/app.log",
        maxBytes=5_000_000,  # 5 MB
        backupCount=5,
    )
    file_handler.setFormatter(logging.Formatter(LOG_FORMAT))

    # Add handlers
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    logging.getLogger("uvicorn").propagate = False
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    logger.info("Logging is configured successfully")
