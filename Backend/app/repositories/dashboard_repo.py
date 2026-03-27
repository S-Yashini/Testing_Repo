from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.executor import SQLExecutor
from app.db.queries.dashboard_queries import KPIQueries


class KPIRepository:

    def __init__(self, db: AsyncSession):
        self.executor = SQLExecutor(db)

    async def get_total_classifications(self) -> dict:
        return await self.executor.fetch_one(KPIQueries.TOTAL_CLASSIFICATIONS)

    async def get_pending_reviews(self) -> dict:
        return await self.executor.fetch_one(KPIQueries.PENDING_REVIEWS)

    async def get_approved(self) -> dict:
        return await self.executor.fetch_one(KPIQueries.APPROVED)

    async def get_rejected(self) -> dict:
        return await self.executor.fetch_one(KPIQueries.REJECTED)

    async def get_avg_review_time(self) -> dict:
        return await self.executor.fetch_one(KPIQueries.AVG_REVIEW_TIME)

    async def get_recent_activity(self, days: int) -> dict:
        since = datetime.utcnow() - timedelta(days=days)
        return await self.executor.fetch_one(
            KPIQueries.RECENT_ACTIVITY,
            {"since": since},
        )

    async def get_last_update(self) -> dict:
        return await self.executor.fetch_one(KPIQueries.LAST_UPDATE)