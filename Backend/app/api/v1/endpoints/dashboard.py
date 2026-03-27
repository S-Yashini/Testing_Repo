from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.deps import get_db
from app.schemas.dashboard import KPIOverviewResponse
from app.services.dashboard_service import KPIService

router = APIRouter()

 
@router.get("/overview", response_model=KPIOverviewResponse)
async def get_kpi_overview(
    recent_activity_days: int = Query(default=7, ge=1, le=365, description="Days window for recent activity"),
    db: AsyncSession = Depends(get_db),
):
    return await KPIService(db).get_overview(recent_activity_days=recent_activity_days)