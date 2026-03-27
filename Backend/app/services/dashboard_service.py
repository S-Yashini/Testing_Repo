from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.dashboard_repo import KPIRepository
from app.schemas.dashboard import ClassificationCounts, ComplianceRate, ComplianceStatus, KPIOverviewResponse, SystemStatus


class KPIService:

    def __init__(self, db: AsyncSession):
        self.repo = KPIRepository(db)

    @staticmethod
    def _compliance_rate(approved: int, total: int) -> ComplianceRate:
        percentage = round((approved / total) * 100, 1) if total > 0 else 0.0
        return ComplianceRate(approved=approved, total=total, percentage=percentage)

    async def get_overview(self, recent_activity_days: int = 7) -> KPIOverviewResponse:
        total, pending, approved, rejected, avg_time, recent, last_update = (
            await self.repo.get_total_classifications(),
            await self.repo.get_pending_reviews(),
            await self.repo.get_approved(),
            await self.repo.get_rejected(),
            await self.repo.get_avg_review_time(),
            await self.repo.get_recent_activity(recent_activity_days),
            await self.repo.get_last_update(),
        )

        last_update_days_ago = None
        if last_update and last_update["last_update"]:
            last_dt = last_update["last_update"]
            if isinstance(last_dt, str):
                last_dt = datetime.fromisoformat(last_dt)
            last_update_days_ago = (datetime.now(timezone.utc).replace(tzinfo=None) - last_dt).days

        avg_review = None
        if avg_time and avg_time["avg_review_days"] is not None:
            avg_review = round(avg_time["avg_review_days"], 1)

        approved_raw_ghs = approved["approved_raw_ghs"] or 0
        approved_raw_dg = approved["approved_raw_dg"] or 0
        approved_extenders_dg = approved["approved_extenders_dg"] or 0
        total_raw_ghs = total["total_raw_ghs"] or 0
        total_raw_dg = total["total_raw_dg"] or 0
        total_extenders_dg = total["total_extenders_dg"] or 0

        return KPIOverviewResponse(
            total_classifications=ClassificationCounts(
                raw_ghs=total_raw_ghs,
                raw_dg=total_raw_dg,
                extenders_dg=total_extenders_dg,
            ),
            pending_reviews=ClassificationCounts(
                raw_ghs=pending["pending_raw_ghs"] or 0,
                raw_dg=pending["pending_raw_dg"] or 0,
                extenders_dg=pending["pending_extenders_dg"] or 0,
            ),
            approved=ClassificationCounts(
                raw_ghs=approved_raw_ghs,
                raw_dg=approved_raw_dg,
                extenders_dg=approved_extenders_dg,
            ),
            rejected=ClassificationCounts(
                raw_ghs=rejected["rejected_raw_ghs"] or 0,
                raw_dg=rejected["rejected_raw_dg"] or 0,
                extenders_dg=rejected["rejected_extenders_dg"] or 0,
            ),
            compliance_status=ComplianceStatus(
                raw_materials_ghs=self._compliance_rate(approved_raw_ghs, total_raw_ghs),
                raw_materials_dg=self._compliance_rate(approved_raw_dg, total_raw_dg),
                extenders_dg=self._compliance_rate(approved_extenders_dg, total_extenders_dg),
            ),
            system_status=SystemStatus(
                overall_avg_review_time_days=avg_review,
                recent_raw_materials=recent["recent_raw_materials"] or 0,
                recent_extenders=recent["recent_extenders"] or 0,
                recent_activity_days=recent_activity_days,
                last_update_days_ago=last_update_days_ago,
            ),
        )