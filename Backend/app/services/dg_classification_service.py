import asyncio
import json
import math
from fastapi import logger
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.rds_client import RDSClient
from app.repositories.dg_master_repo import DGMasterRepository
from app.repositories.material_details_repo import MaterialDetailsRepository
from app.repositories.materials_repo import MaterialRepository

import logging

from app.repositories.sdg_jurisdiction_rep import JurisdictionRepository

logger = logging.getLogger(__name__)


class DG_CLASSIFICATION_SERVICE:

    def __init__(self, db, rds_client: RDSClient):
        self.repo = MaterialRepository(db)
        self.details_repo = MaterialDetailsRepository(db)
        self.dg_master_repo = DGMasterRepository(db)
        self.jurisdiction_repo = JurisdictionRepository(db)
        self.rds_client = rds_client

    async def classify_material(self, material_code: str):

        # 1️⃣ Get material
        material = await self.repo.get_material_by_code(material_code)

        if not material:
            raise Exception("Material not found")

        material_type = material["source_material_type"]

        # 2️⃣ Branch by material type
        if material_type == "raw_materials":
            return await self._classify_raw_material(material)

        elif material_type == "extenders":
            return await self._classify_extenders(material)

        else:
            raise Exception(f"Unsupported material type: {material_type}")


    async def _get_jurisdictions_rds(self, material):
        # This is where DG business logic will go
        
        material_id = material["material_id"]
        material_code = material["material_code"]

        # --------------------------------------------------
        # STEP 1: Get Transport Information (SDS Section 14)
        # --------------------------------------------------
        transport = await self.details_repo.get_transport(material_code)

        if not transport:
            raise Exception("Transport information not found")

        extracted_un = transport["un_number"]
        extracted_pg = transport["packing_group"]
        extracted_hazard = transport["transport_hazard_class"]
        # ghs_codes = transport.get("ghs_codes", [])

        # --------------------------------------------------
        # STEP 2: Validate UN in DG Master
        # --------------------------------------------------
        # need to check on all hazard class, un and psn.
        reference_material = await self.dg_master_repo.get_by_un_pg_hazard(
            extracted_un,
            extracted_pg,
            extracted_hazard
        )


        if not reference_material:
            # await self.material_repo.update_status(material_id, "UN_NOT_FOUND")
            return {"message": "reference material not found in DG Master(Excel)"}

        reference_material_code = reference_material["sample_code"]
        print("Reference Material: ", reference_material_code)
        # --------------------------------------------------
        # STEP 3: Fetch Jurisdiction Template from RDS (RDS Client)
        # --------------------------------------------------
        rds_response = await self.rds_client.get_jurisdiction_template(
            reference_material_code
        )
        
        if not rds_response:
            print(rds_response)
            raise Exception("No jurisdiction template found in RDS")

        jurisdictions = rds_response.get("jurisdictions", [])

        return jurisdictions

    async def _get_jurisdictions_local(self, material):
        pass



    async def _upsert_jurisdictions_local(self, jurisdictions, material):
        material_id = material["material_id"]
        material_code = material["material_code"]
        try:
            await self.jurisdiction_repo.delete_by_material_code(material_code)

            for row in jurisdictions:
                hazard_class = row.get("hazard_class") or row.get("hazard_category")
                await self.jurisdiction_repo.insert_new_material_row(
                    material_code=material_code,
                    authority_country=row["authority_country"],
                    un_number=row["un_number"],
                    psn=row["psn"],
                    packaging_group=row["packaging_group"],
                    hazard_class=hazard_class
                )

            # await self.material_repo.update_status(material_id, "CLASSIFIED")

            await self.repo.executor.db.commit()

        except Exception:
            await self.repo.executor.db.rollback()
            raise

        # If anything fails inside block → automatic rollback

        # --------------------------------------------------
        # STEP 5: Marine Pollutant Rule
        # --------------------------------------------------

        # if self._is_marine_pollutant(ghs_codes):
        #     await self.material_repo.set_marine_pollutant(material_id, True)


    async def _classify_raw_material(self, material):
        material_id = material["material_id"]
        material_code = material["material_code"]

        jurisdictions = await self._get_jurisdictions_rds(material=material)

        # STEP 4: Update Local Jurisdiction Table
        # TRANSACTION STARTS HERE
        await self._upsert_jurisdictions_local(jurisdictions=jurisdictions, material=material)
        

        return {"message": "Raw material classified successfully"}
    



    def _is_parent_extender(self, material_code: str):
        return material_code[3] == "9"
    

    async def _classify_extenders(self, material):

        if not self._is_parent_extender(material_code=material['material_code']):
            return self._classify_raw_material(material=material)
        # This logic may change..
        else:
            material_id = material["material_id"]
            material_code = material["material_code"]

            # Step 2 get the jurisdiction from the parent
            jurisdictions = await self._get_jurisdictions_rds(material=material)
            # storing jurisdictions of parent in local table
            print(jurisdictions)
            await self._upsert_jurisdictions_local(jurisdictions, material)
            

            # Step 3 Children Lookup
            status, children = await self.rds_client.get_all_children_for_parent(material_code)
            print("Children API: ", status)
            if not status:
                # What should we do if RDS Failed
                return "RDS failed.."
            

            #Assumtion: when we look for the children in RDS lookup, are we assuming that we aready have children(sheet extracted) data
            #Step 4
            print(children)
            ans = await self.repo.store_children(parent_code=material_code, children=children)
            print("Storing Children", ans)
            # Step 1 for Child
            parent_jurisdictions = await self.jurisdiction_repo.get_jurisdiction_local(parent_code=material_code)
            print("Parent Jurisdictions:", parent_jurisdictions)
            for child in children:
                await self._upsert_jurisdictions_local(parent_jurisdictions, material=child)


        return {
            "message": "Extenders classification logic",
            "material_id": material["material_id"]
        }