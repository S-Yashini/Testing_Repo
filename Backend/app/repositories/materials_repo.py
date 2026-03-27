from sqlalchemy.ext.asyncio import AsyncSession
from app.db.executor import SQLExecutor
from app.db.queries.material_queries import MaterialQueries
from app.utils.helpers import extract_dg_class
import json
import re
import logging

logger = logging.getLogger(__name__)

class MaterialRepository:

    def __init__(self, db):
        self.executor = SQLExecutor(db)

    async def get_materials_by_type(self, material_type: str):
        return await self.executor.fetch_all(
            MaterialQueries.GET_MASTER_BY_TYPE,
            {"material_type": material_type}
        )
    
    async def get_material_by_code(self, material_code: str):
        return await self.executor.fetch_one(
            MaterialQueries.GET_MATERIAL_BY_CODE,
            {"material_code": material_code}
        )

    async def get_material_code_by_id(self, material_code: str):
        result = await self.executor.fetch_one(
            MaterialQueries.GET_MATERIAL_CODE_BY_ID,
            {"material_code": material_code},
        )

        return result["material_code"] if result else None

    # async def count_materials(
    #     self,
    #     material_type: str,
    #     search: str | None,
    # ):
    #     conditions = ["source_material_type = :material_type"]
    #     params = {"material_type": material_type}

    #     if search:
    #         conditions.append("""
    #             (
    #                 LOWER(material_code) LIKE :search_like
    #                 OR LOWER(material_name) LIKE :search_like
    #             )
    #         """)
    #         params["search_like"] = f"%{search.lower()}%"

       

    #     query = f"""
    #         SELECT COUNT(*) as total
    #         FROM sds_master
    #         WHERE {" AND ".join(conditions)}
    #     """

    #     result = await self.executor.fetch_one(query, params)
    #     return result["total"]


    def build_status_condition(self,material_type: str, status: str | None):
        """
        Returns SQL condition string for status filtering.
        """

        if not status or status == "all":
            return None

        # Normalize (optional but safer)
        status = status.lower()
        material_type = material_type.lower()

        # 🔹 EXTENDERS → ONLY DG
        if material_type == "extenders":
            if status == "approved":
                return "d.dg_status = 'Approved'"

            elif status == "pending":
                return """
                    (
                        d.dg_status = 'Pending Review'
                        OR d.dg_status IS NULL
                    )
                """

            elif status == "rejected":
                return "d.dg_status = 'Rejected'"

        # 🔹 OTHER MATERIALS → DG + GHS
        else:
            if status == "approved":
                return """
                    (
                        g.ghs_status = 'Approved'
                        OR d.dg_status = 'Approved'
                    )
                """

            elif status == "pending":
                return """
                    (
                        g.ghs_status = 'Pending Review'
                        OR d.dg_status = 'Pending Review'
                        OR g.ghs_status IS NULL
                        OR d.dg_status IS NULL
                    )
                """

            elif status == "rejected":
                return """
                    (
                        g.ghs_status = 'Rejected'
                        OR d.dg_status = 'Rejected'
                    )
                """

        return None

    async def count_materials(
        self,
        material_type: str,
        dg_class: str | None,
        ghs_class: str | None,
        search: str | None,
        status: str | None,
    ):
        conditions = ["LOWER(m.source_material_type) = LOWER(:material_type)"]
        params = {"material_type": material_type}

        if search:
            conditions.append("""
                (
                    LOWER(m.material_code) LIKE :search_like
                    OR LOWER(m.material_name) LIKE :search_like
                )
            """)
            params["search_like"] = f"%{search.lower()}%"

        # STATUS FILTER
        # if status and status != "all":
        #     if status == "approved":
        #         conditions.append("""
        #             g.ghs_status = 'approved'
        #             AND d.dg_status = 'approved'
        #         """)
        #     elif status == "pending":
        #         conditions.append("""
        #             (
        #                 g.ghs_status = 'pending'
        #                 OR d.dg_status = 'pending'
        #                 OR g.ghs_status IS NULL
        #                 OR d.dg_status IS NULL
        #             )
        #         """)
        #     elif status == "rejected":
        #         conditions.append("""
        #             (
        #                 g.ghs_status = 'rejected'
        #                 OR d.dg_status = 'rejected'
        #             )
        #         """)

        status_condition = self.build_status_condition(material_type, status)

        if status_condition:
            conditions.append(status_condition)
            

        if dg_class and dg_class.lower() != "all":
            conditions.append("LOWER(d.dg_classification) LIKE :dg_class")
            params["dg_class"] = f"%{dg_class.lower()}%"

        if ghs_class and ghs_class.lower() != "all":
            conditions.append("LOWER(h.pictograms) LIKE :ghs_class")
            params["ghs_class"] = f"%{ghs_class.lower()}%"


        query = f"""
            SELECT COUNT(DISTINCT m.material_id) as total
            FROM sds_master m
            LEFT JOIN dg_classification d
                ON d.material_code = m.material_code
            LEFT JOIN ghs_classification g
                ON g.material_code = m.material_code
            LEFT JOIN sds_hazards_sec2 h
                ON h.material_code = m.material_code

            WHERE {" AND ".join(conditions)}
        """

        result = await self.executor.fetch_one(query, params)
        return result["total"]


    # async def get_materials(
    #     self,
    #     material_type: str,
    #     search: str | None,
    #     limit: int,
    #     offset: int,
    # ):
    #     conditions = ["source_material_type = :material_type"]
    #     params = {
    #         "material_type": material_type,
    #         "limit": limit,
    #         "offset": offset,
    #     }

    #     if search:
    #         conditions.append("""
    #             (
    #                 LOWER(material_code) LIKE :search_like
    #                 OR LOWER(material_name) LIKE :search_like
    #             )
    #         """)
    #         params["search_like"] = f"%{search.lower()}%"

       
    #     query = f"""
    #         SELECT *
    #         FROM sds_master
    #         WHERE {" AND ".join(conditions)}
    #         ORDER BY created_date DESC
    #         LIMIT :limit OFFSET :offset
    #     """

    #     return await self.executor.fetch_all(query, params)

    
    async def get_materials(
        self,
        dg_class: str | None,
        ghs_class: str | None,
        material_type: str,
        search: str | None,
        limit: int,
        offset: int,
        status: str | None,
    ):
        conditions = ["LOWER(m.source_material_type) = LOWER(:material_type)"]
        params = {
            "material_type": material_type,
            "limit": limit,
            "offset": offset,
        }

        if search:
            conditions.append("""
                (
                    LOWER(m.material_code) LIKE :search_like
                    OR LOWER(m.material_name) LIKE :search_like
                )
            """)
            params["search_like"] = f"%{search.lower()}%"

        status_condition = self.build_status_condition(material_type, status)

        if status_condition:
            conditions.append(status_condition)

        if dg_class and dg_class.lower() != "all":
            conditions.append("LOWER(d.dg_classification) LIKE :dg_class")
            params["dg_class"] = f"%{dg_class.lower()}%"

        if ghs_class and ghs_class.lower() != "all":
            conditions.append("LOWER(h.pictograms) LIKE :ghs_class")
            params["ghs_class"] = f"%{ghs_class.lower()}%"


        query = f"""
            SELECT DISTINCT m.*
            FROM sds_master m
            LEFT JOIN dg_classification d
                ON d.material_code = m.material_code
            LEFT JOIN ghs_classification g
                ON g.material_code = m.material_code
            LEFT JOIN sds_hazards_sec2 h
                ON h.material_code = m.material_code

            WHERE {" AND ".join(conditions)}
            ORDER BY m.created_date DESC
            LIMIT :limit OFFSET :offset
        """

        return await self.executor.fetch_all(query, params)


    def _build_available_base_query(self, material_type):
        joins = """
            FROM sds_master m
            LEFT JOIN dg_classification d
                ON d.material_code = m.material_code
            LEFT JOIN ghs_classification g
                ON g.material_code = m.material_code
            LEFT JOIN sds_hazards_sec2 h
                ON h.material_code = m.material_code
        """

        where_clause = "m.source_material_type = :material_type"

        params = {"material_type": material_type}

        return joins, where_clause, params
    

    async def get_available_dg_classes(self, material_type):
        joins, where_clause, params = self._build_available_base_query(
            material_type
        )

        query = f"""
            SELECT DISTINCT d.dg_classification
            {joins}
            WHERE {where_clause}
            AND d.dg_classification IS NOT NULL
        """

        rows = await self.executor.fetch_all(query, params)

        classes = {
            extract_dg_class(row["dg_classification"])
            for row in rows
            if row["dg_classification"]
        }

        return sorted(c for c in classes if c)
            


    async def get_available_ghs_classes(self, material_type):
        joins, where_clause, params = self._build_available_base_query(
            material_type
        )

        query = f"""
            SELECT DISTINCT h.pictograms
            {joins}
            WHERE {where_clause}
            AND h.pictograms IS NOT NULL
        """

        rows = await self.executor.fetch_all(query, params)

        ghs_set = set()

        for row in rows:
            pictos = row["pictograms"]
            if pictos:
                try:
                    parsed = json.loads(pictos)

                    if isinstance(parsed, list):
                        ghs_set.update([p.strip() for p in parsed if p])
                    elif isinstance(parsed, str):
                        parts = re.split(r"[|,]", parsed)
                        ghs_set.update([p.strip() for p in parts if p])

                except:
                    parts = re.split(r"[|,]", pictos)
                    ghs_set.update([p.strip() for p in parts if p])

        return sorted(ghs_set)
        


    # async def get_material_code_by_id(self, material_id: int):
    #     result = await self.executor.fetch_one(
    #         MaterialQueries.GET_MATERIAL_CODE_BY_ID,
    #         {"material_id": material_id},
    #     )
    #     return result["material_code"] if result else None

    async def update_ghs_status(
        self,
        material_codes: list[str],
        ghs_status: str,
        reject_reason: str | None,
    ):
        await self.executor.execute(
            MaterialQueries.UPDATE_GHS_STATUS,
            {
                "material_codes": tuple(material_codes),
                "ghs_status": ghs_status,
                "reject_reason": reject_reason,
            },
        )

    async def update_dg_status(self, material_codes: list[str], dg_status: str,reject_reason: str | None):
            await self.executor.execute(
                MaterialQueries.UPDATE_DG_STATUS,
                {
                    "material_codes": tuple(material_codes),
                    "dg_status": dg_status,
                    "reject_reason": reject_reason,
                },
            )

    async def get_existing_material_codes(self, material_codes: list[str]):
        result = await self.executor.fetch_all(
            MaterialQueries.GET_EXISTING_MATERIAL_CODES,
            {"material_codes": tuple(material_codes)},
        )
        return [row["material_code"] for row in result]



    async def get_children_by_parent(
        self,
        parent_material_code: str,
    ):
        return await self.executor.fetch_all(
            MaterialQueries.GET_CHILDREN_BY_PARENT,
            {
                "parent_material_code": parent_material_code,
            },
        )

    async def count_children_by_parent(self, parent_material_code: str):
        return await self.executor.fetch_all(
            MaterialQueries.COUNT_CHILDREN_BY_PARENT,
            {"parent_material_code": parent_material_code},
        )
    


    async def store_children(self, parent_code: str, children: list):

        if not children:
            return {"message": "No children to store", "updated": 0}

        updated_count = 0

        try:
            for child in children:

                child_code = child.get("material_code")

                # 1️⃣ Validate if child exists in sds_master
                existing = await self.executor.fetch_one(
                    MaterialQueries.CHECK_CHILD_EXISTS,
                    {"material_code": child_code}
                )

                if not existing:
                    continue  # Skip if not present

                # 2️⃣ Update parent_material_code
                await self.executor.execute(
                    MaterialQueries.UPDATE_PARENT_FOR_CHILD,
                    {
                        "parent_material_code": parent_code,
                        "material_code": child_code
                    }
                )

                updated_count += 1

            await self.executor.db.commit()

            return {
                "message": "Children mapped to parent successfully",
                "updated": updated_count
            }

        except Exception:
            await self.executor.db.rollback()
            raise