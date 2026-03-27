from fastapi import APIRouter
from app.api.v1.endpoints import analytics, dashboard, materials, mock_rds

api_router = APIRouter()

api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(materials.router, prefix="/materials", tags=["Materials"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])

api_router.include_router(mock_rds.router, prefix="/rds", tags=["Mock RDS"])
