import asyncio
import json
import math
from typing import List
from fastapi import HTTPException, logger, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.material_details_repo import MaterialDetailsRepository
from app.repositories.materials_repo import MaterialRepository
from app.core.exceptions import NotFoundException
from app.repositories.sdg_jurisdiction_rep import JurisdictionRepository
from app.utils.pagination import build_pagination_meta
from app.utils.formatters import ghs_extract_classifications, format_section14, format_section2, format_section3, format_section9, parse_ghs_pictograms
import logging

logger = logging.getLogger(__name__)


class MaterialService:

    def __init__(self, db):
        self.db = db
        self.repo = MaterialRepository(db)
        self.details_repo = MaterialDetailsRepository(db)
        self.jurisdiction_repo = JurisdictionRepository(db)

    async def _safe_call(self, coro, default=None, msg=""):
        try:
            result = await coro
            return result if result is not None else default
        except Exception:
            logger.exception(msg)
            return default

    async def _build_material(self, m):
        material_code = m.get("material_code")
        material_id = m.get("material_id")

        # Run ALL detail queries in parallel
        (
            sds_info,
            hazards,
            props,
            transport,
            ghs,
            dg,
            composition,
            toxicology,
            hazards_codes
        ) = await asyncio.gather(
            self._safe_call(self.details_repo.get_sds_info(material_code), {}, f"sds {material_code}"),
            self._safe_call(self.details_repo.get_hazards(material_code), {}, f"hazards {material_code}"),
            self._safe_call(self.details_repo.get_properties(material_code), {}, f"props {material_code}"),
            self._safe_call(self.details_repo.get_transport(material_code), {}, f"transport {material_code}"),
            self._safe_call(self.details_repo.get_ghs(material_code), {}, f"ghs {material_code}"),
            self._safe_call(self.details_repo.get_dg(material_code), {}, f"dg {material_code}"),
            self._safe_call(self.details_repo.get_composition(material_id), [], f"composition {material_code}"),
            self._safe_call(self.details_repo.get_toxicology(material_id), [], f"toxicology {material_code}"),
            self._safe_call(self.details_repo.get_hazard_codes(material_code), [], f"hazards_codes {material_code}"),
        )

        product_type = (
            composition[0].get("product_type")
            if composition else None
        )

        pictograms = []
        try:
            if hazards.get("pictograms"):
                pictograms = parse_ghs_pictograms(hazards.get("pictograms"))
        except Exception:
            logger.warning(f"Bad pictogram JSON {material_code}")
        # print(hazards.get("classification"))

        ghs_classification = ghs.get("ghs_classification")

        return {
            "id": material_id,
            "material_id": material_code,
            "material_name": m.get("material_name"),
            "internal_code": "",
            "intended_use": sds_info.get("recommended_use"),
            "product_type": product_type,
            "part_number": sds_info.get("product_identifier"),
            "source": m.get("pdf_file_path"),
            "sdssheet_url": m.get("source_file_path"),
            "manufacturer": sds_info.get("supplier_name"),
            "manufacturer_location": sds_info.get("supplier_address"),
            "emergency_contact": sds_info.get("emergency_phone"),
            "ai_recommended_dgcode": dg.get("dg_classification"),
            "rationale_summary": dg.get("rationale_summary"),
            "ghs_rationale": ghs.get("ghs_reason"),
            "dg_rationale": dg.get("dg_reason"),
            "ghs_status": ghs.get("ghs_status"),
            "dg_status": dg.get("dg_status"),
            "dg_reject_reason": dg.get("dg_rejected_reason"),
            "ghs_reject_reason":  ghs.get("ghs_rejected_reason"),
            "ghs_pictograms": pictograms,
            "hazardous_waste": dg.get("hazardous_waste"),
            "GHS Approval/Rejection Date": ghs.get("reviewed_at"),
            "DG Approval/Rejection Date": dg.get("reviewed_at"),
            "feedback": "",
            "sections": {
                "section2": format_section2(hazards),
                "section3": (
                    format_section3(composition, sds_info, ghs, dg)
                    if composition else []
                ),
                "section9": format_section9(props),
                "section14": format_section14(transport),
            },
            "ghs_classification_data": (
                ghs_extract_classifications(ghs_classification)
                if ghs_classification else []
            ),
            "hazards_codes": hazards_codes,

            "uploaded_date": m.get("created_date"),
        }

    async def list_materials(
        self,
        *,
        material_type="raw_material",
        page=1,
        page_size=20,
        search=None,
        status=None,
        dg_class=None,
        ghs_class=None,
    ):

        offset = (page - 1) * page_size

        try:
            total_records, masters = await asyncio.gather(
                self.repo.count_materials(
                    dg_class=dg_class,
                    ghs_class=ghs_class,
                    material_type=material_type,
                    search=search,
                    status=status
                ),
                self.repo.get_materials(
                    material_type=material_type,
                    search=search,
                    limit=page_size,
                    offset=offset,
                    status=status,
                    dg_class=dg_class,
                    ghs_class=ghs_class,
                ),
            )


            available_dg, available_ghs = await asyncio.gather(
                self.repo.get_available_dg_classes(material_type),
                self.repo.get_available_ghs_classes(material_type)
            )

        except Exception:
            logger.exception("Failed fetching materials")
            raise RuntimeError("DB failure")

        # Build nested materials concurrently
        tasks = [self._build_material(m) for m in masters]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        final_results = []
        for r in results:
            if isinstance(r, Exception):
                logger.error(f"Material failed: {repr(r)}")

                final_results.append({
                    "error": "failed to build material"
                })
            else:
                final_results.append(r)
                
        logger.info(f"Total from DB: {len(masters)}")
        logger.info(f"Built successfully: {len(final_results)}")

        pagination_meta = build_pagination_meta(
            page=page,
            page_size=page_size,
            total_records=total_records,
        )

        return {
            "data": final_results,
            "meta": {"pagination": pagination_meta,"available_dg_classes": available_dg,
            "available_ghs_classes": available_ghs,},
        }

    async def get_jurisdictions(self, *, material_code: str):

            if not material_code.strip():
                raise ValueError("material_code cannot be empty")

            try:
                records = await self.jurisdiction_repo.get_by_material_code(material_code)

            except Exception:
                logger.exception("Database failure while fetching jurisdictions")
                raise RuntimeError("DB failure")

            if not records:
                logger.info(f"No jurisdictions found for material_code={material_code}")
                return {
                    "data": [],
                    "meta": {
                        "total": 0
                    }
                }

            # Optional transformation step
            result = [self._build_jurisdiction(r) for r in records]

            return {
                "data": result,
                "meta": {
                    "total": len(result)
                }
            }

    def _build_jurisdiction(self, row: dict) -> dict:
        return {
            "id": row.get("id"),
            "material_code": row.get("material_code"),
            "authority_country": row.get("authority_country"),
            "un_number": row.get("un_number"),
            "psn": row.get("psn"),
            "packaging_group": row.get("packaging_group"),
            "hazard_class": row.get("hazard_class"),
            "created_date": row.get("created_date"),
            "updated_date": row.get("modified_date"),
        }
    
    # async def approve_reject_material(
    #     self,
    #     material_codes: list[str],
    #     ghs_status: str | None,
    #     dg_status: str | None,
    #     reject_reason: str | None,
    # ):
    #     if not material_codes:
    #         raise HTTPException(
    #             status_code=status.HTTP_400_BAD_REQUEST,
    #             detail="material_codes list cannot be empty",
    #         )

    #     if not ghs_status and not dg_status:
    #         raise HTTPException(
    #             status_code=status.HTTP_400_BAD_REQUEST,
    #             detail="At least one status must be provided",
    #         )
        
    #     existing_codes = await self.repo.get_existing_material_codes(material_codes)
    #     missing_codes = list(set(material_codes) - set(existing_codes))

    #     if not existing_codes:
    #         raise HTTPException(
    #             status_code=status.HTTP_404_NOT_FOUND,
    #             detail="No valid material_codes found",
    #         )

    #     # if (
    #     #     (ghs_status == "Rejected" or dg_status == "Rejected")
    #     #     and not reject_reason
    #     # ):
    #     #     raise HTTPException(
    #     #         status_code=status.HTTP_400_BAD_REQUEST,
    #     #         detail="reject_reason is required when rejecting",
    #     #     )

    #     try:
    #         if ghs_status:
    #             await self.repo.update_ghs_status(
    #                 material_codes,
    #                 ghs_status,
    #                 reject_reason if ghs_status == "Rejected" else None,
    #             )

    #         if dg_status:
    #             await self.repo.update_dg_status(
    #                 material_codes,
    #                 dg_status,
    #                 reject_reason if dg_status == "Rejected" else None,
    #             )

    #         await self.db.commit()

    #     except Exception as e:
    #         await self.db.rollback()
    #         logger.exception("Bulk approve/reject failed")  # <-- add this
    #         raise HTTPException(
    #             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    #             detail=str(e),  # <-- temporarily return actual error
    #         )
        
    #     return {
    #         # "updated_material_codes": existing_codes,
    #         # "invalid_material_codes": invalid_codes,
    #         "material_codes": material_codes,
    #         "ghs_status": ghs_status,
    #         "dg_status": dg_status,
    #         "reject_reason": reject_reason,
    #         "message": "Statuses updated successfully",
    #     }
    async def approve_reject_material(
        self,
        material_codes: list[str],
        ghs_status: str | None,
        dg_status: str | None,
        reject_reason: str | None,
    ):

        if not material_codes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="material_codes list cannot be empty",
            )

        if not ghs_status and not dg_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one status must be provided",
            )

        try:
            # Step 1: find existing materials
            existing_codes = await self.repo.get_existing_material_codes(material_codes)

            # Step 2: find missing materials
            missing_codes = list(set(material_codes) - set(existing_codes))

            # Step 3: update only existing ones
            if existing_codes:

                if ghs_status:
                    await self.repo.update_ghs_status(
                        existing_codes,
                        ghs_status,
                        reject_reason if ghs_status == "Rejected" else None,
                    )

                if dg_status:
                    await self.repo.update_dg_status(
                        existing_codes,
                        dg_status,
                        reject_reason if dg_status == "Rejected" else None,
                    )

            # Step 4: commit transaction
            await self.db.commit()

        except Exception as e:
            await self.db.rollback()
            logger.exception("Bulk approve/reject failed")

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update material statuses",
            )

        # Step 5: response
        return {
            "requested_material_codes": material_codes,
            "updated_material_codes": existing_codes,
            "not_found_material_codes": missing_codes,
            "updated_count": len(existing_codes),
            "not_found_count": len(missing_codes),
            "ghs_status": ghs_status,
            "dg_status": dg_status,
            "reject_reason": reject_reason,
            "message": "Statuses updated for available materials",
        }

    async def list_children(
    self,
    *,
    parent_material_code: str,
):

        total_records, children = await asyncio.gather(
            self.repo.count_children_by_parent(parent_material_code),
            self.repo.get_children_by_parent(
                parent_material_code=parent_material_code,
            ),
        )

        # Fetch minimal extra info in parallel (optional)
        tasks = [self._build_child_row(c) for c in children]
        results = await asyncio.gather(*tasks)

        # pagination_meta = build_pagination_meta(
        #     page=page,
        #     page_size=page_size,
        #     total_records=total_records,
        # )

        return {
            "data": results,
            "meta": {},
        }

    async def _build_child_row(self, m):

        material_code = m.get("material_code")
        material_id = m.get("material_id")

        sds_info, dg, composition = await asyncio.gather(
            self._safe_call(self.details_repo.get_sds_info(material_code), {}),
            self._safe_call(self.details_repo.get_dg(material_code), {}),
            self._safe_call(self.details_repo.get_composition(material_id), []),
        )

        product_type = (
            composition[0].get("product_type")
            if composition else None
        )

        return {
            "material_id": material_code,
            "material_name": m.get("material_name"),
            "source": m.get("source_file_path"),
            "part_sales_number": (sds_info or {}).get("product_identifier"),
            "uploaded_date": m.get("created_date"),
            "dg_code": (dg or {}).get("dg_classification") or "Not regulated",
            "product_type": product_type,
            "manufacturer": (sds_info or {}).get("supplier_name"),
            "status": (dg or {}).get("dg_status") or "Pending",
        }