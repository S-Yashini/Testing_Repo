from sqlalchemy.ext.asyncio import AsyncSession
from app.db.executor import SQLExecutor
from app.db.queries.material_details_queries import MaterialDetailsQueries

class MaterialDetailsRepository:

    def __init__(self, db):
        self.executor = SQLExecutor(db)

    async def get_master(self, material_code):
        return await self.executor.fetch_one(
            MaterialDetailsQueries.MASTER,
            {"material_code": material_code}
        )

    async def get_sds_info(self, material_code):
        return await self.executor.fetch_one(
            MaterialDetailsQueries.SDS_INFO,
            {"material_code": material_code}
        )

    async def get_hazards(self, material_code):
        return await self.executor.fetch_one(
            MaterialDetailsQueries.HAZARDS,
            {"material_code": material_code}
        )

    async def get_composition(self, material_id):
        return await self.executor.fetch_all(
            MaterialDetailsQueries.COMPOSITION,
            {"material_id": material_id}
        )

    async def get_properties(self, material_code):
        return await self.executor.fetch_one(
            MaterialDetailsQueries.PROPERTIES,
            {"material_code": material_code}
        )

    async def get_transport(self, material_code):
        return await self.executor.fetch_one(
            MaterialDetailsQueries.TRANSPORT,
            {"material_code": material_code}
        )

    async def get_ghs(self, material_code):
        return await self.executor.fetch_one(
            MaterialDetailsQueries.GHS,
            {"material_code": material_code}
        )

    async def get_dg(self, material_code):
        return await self.executor.fetch_one(
            MaterialDetailsQueries.DG,
            {"material_code": material_code}
        )


    async def get_toxicology(self, material_id):
        return await self.executor.fetch_all(
            MaterialDetailsQueries.TOXICOLOGY,
            {"material_id": material_id}
        )
    
    async def get_hazard_codes(self, material_code):
        return await self.executor.fetch_all(
            MaterialDetailsQueries.HAZARDS_CODES,
            {"material_code": material_code}
        )