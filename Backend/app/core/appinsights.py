import logging
from azure.monitor.opentelemetry import configure_azure_monitor
from app.core.keyvault import get_secret_from_keyvault

logger = logging.getLogger(__name__)


def setup_app_insights():
    """
    Configure Azure App Insights safely.
    App should still start even if telemetry fails.
    """

    try:
        connection_string = get_secret_from_keyvault(
            "APPINSIGHTS_CONNECTION_STRING"
        )

        configure_azure_monitor(connection_string=connection_string)

        logger.info("Azure Application Insights configured successfully")

    except Exception as e:
        logger.error(
            "Failed to configure Azure Application Insights. "
            "App will continue without telemetry.",
            exc_info=True,
        )

        # # Don't dump full traceback
        # logger.warning(
        #     "Azure Application Insights disabled (startup will continue). Reason: %s",
        #     str(e),
        # )
