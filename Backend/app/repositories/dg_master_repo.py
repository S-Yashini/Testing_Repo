from sqlalchemy.ext.asyncio import AsyncSession
from app.db.executor import SQLExecutor
from app.db.queries.dg_master_queries import DGMasterQueries
from app.db.queries.material_details_queries import MaterialDetailsQueries

class DGMasterRepository:

    def __init__(self, db):
        self.executor = SQLExecutor(db)

    async def get_by_un_number(self, un_number):
        return await self.executor.fetch_one(
            DGMasterQueries.GET_BY_UN,
            {"un_number": un_number}
        )
    

    async def get_by_un_pg_hazard(self, un_number, pg, hazard_category):
        return await self.executor.fetch_one(
            DGMasterQueries.GET_BY_UN_PG_HAZARD,
            {
                "un_number": un_number,
                "pg": pg,
                "hazard_category": hazard_category
            }
        )