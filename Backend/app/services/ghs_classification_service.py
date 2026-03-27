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



class GHS_CLASSIFICATION_SERVICE:

    def __init__(self, db, rds_client: RDSClient):
        self.repo = MaterialRepository(db)
        self.details_repo = MaterialDetailsRepository(db)
        self.dg_master_repo = DGMasterRepository(db)
        self.rds_client = rds_client

    async def classify_material(self, material_code: str):

        # Step 1: Get Section 2 SDS data
        section2 = await self.details_repo.get_hazards(material_code)
        
        if not section2:
            raise ValueError("No SDS Section 2 data found")
        

        
        #Get classification need to be changed to get the categories
        classifications: str = section2.get("classifications", "")
        classifications = classifications.split(';')
        print(classifications)
        results = []

        for cls in classifications:
            
            classification_name = cls["classification"]
            classification_category = cls["category"]
            # Extracting from procautionary statements and Hazard statements
            extracted_h = set(cls.get("h_codes", []))
            extracted_p = set(cls.get("p_codes", []))
            signal_word = cls.get("signal_word")
            pictograms = cls.get("pictograms", [])

            # Step 2: Lookup RDS reference table
            # Assuming
            rds_mapping = await self.rds_client.lookup_ghs_classification(
                classification_name, classification_category
            )

            mapped_h = set(rds_mapping.get("hazard_statements", []))
            mapped_p = set(rds_mapping.get("precautionary_statements", []))

            # Step 3: Append missing codes
            final_h = list(mapped_h.union(extracted_h))
            final_p = list(mapped_p.union(extracted_p))
            
            result = {
                "material_code": material_code,
                "classification": classification_name,
                "signal_word": signal_word or rds_mapping.get("signal_word"),
                "hazard_statements": final_h,
                "precautionary_statements": final_p,
                "pictograms": pictograms or rds_mapping.get("pictograms"),
            }

            results.append(result)


        return 












        # classifications = section2.get("classifications", [])

        # results = []

        # for cls in classifications:

        #     classification_name = cls["classification"]
        #     extracted_h = set(cls.get("h_codes", []))
        #     extracted_p = set(cls.get("p_codes", []))
        #     signal_word = cls.get("signal_word")
        #     pictograms = cls.get("pictograms", [])

        #     # Step 2: Lookup RDS reference table
        #     rds_mapping = await self.rds_client.lookup_ghs_classification(
        #         classification_name
        #     )

        #     mapped_h = set(rds_mapping.get("hazard_statements", []))
        #     mapped_p = set(rds_mapping.get("precautionary_statements", []))

        #     # Step 3: Append missing codes
        #     final_h = list(mapped_h.union(extracted_h))
        #     final_p = list(mapped_p.union(extracted_p))

        #     result = {
        #         "material_code": material_code,
        #         "classification": classification_name,
        #         "signal_word": signal_word or rds_mapping.get("signal_word"),
        #         "hazard_statements": final_h,
        #         "precautionary_statements": final_p,
        #         "pictograms": pictograms or rds_mapping.get("pictograms"),
        #     }

        #     results.append(result)

        # return results
        