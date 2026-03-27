from sqlalchemy.ext.asyncio import AsyncSession
from app.db.executor import SQLExecutor
from app.db.queries.material_details_queries import MaterialDetailsQueries
from app.db.queries.sds_jurisdiction_queries import JurisdictionQueries
import logging

logger = logging.getLogger(__name__)

class JurisdictionRepository:

    def __init__(self, db):
        self.executor = SQLExecutor(db)

    async def get_by_material_code(self, material_code: str):

        try:
            result = await self.executor.fetch_all(
                JurisdictionQueries.GET_BY_MATERIAL,
                {"material_code": material_code}
            )
            return result

        except Exception:
            logger.exception(
                f"Failed querying sds_jurisdiction_master for material_code={material_code}"
            )
            raise


    async def delete_by_material_code(self, material_code: str):
        """
        Delete existing jurisdiction rows
        before inserting fresh classification
        """
        return await self.executor.execute(
            JurisdictionQueries.DELETE_BY_MATERIAL_CODE,
            {"material_code": material_code}
        )


    async def insert_new_material_row(
        self,
        material_code: str,
        authority_country: str,
        un_number: str,
        psn: str,
        packaging_group: str,
        hazard_class: str
    ):
        """
        Insert jurisdiction classification row
        """

        return await self.executor.execute(
            JurisdictionQueries.INSERT_NEW_ROW,
            {
                "material_code": material_code,
                "authority_country": authority_country,
                "un_number": un_number,
                "psn": psn,
                "packaging_group": packaging_group,
                "hazard_class": hazard_class
            }
        )
    
    # --------------------------------------------------
    # GET JURISDICTIONS FROM LOCAL TABLE
    # --------------------------------------------------
    async def get_jurisdiction_local(self, parent_code: str):

        rows = await self.executor.fetch_all(
            JurisdictionQueries.GET_JURISDICTION_BY_PARENT,
            {"material_code": parent_code}
        )

        if not rows:
            return []

        return rows