from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.responses import SuccessResponse
from app.dependencies.deps import get_db
from app.schemas.raw_material import MaterialApprovalRequest, MaterialListResponse
from app.services.materials_service import MaterialService

import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("")
async def get_materials(
    material_type: str = Query(
        default="raw_materials",
        description="raw_materials | extenders"
    ),
    status: str | None = Query(
        default=None,
        description="approved | pending | rejected | all"
    ),
    dg_class: str | None = Query(
        default=None,
        description="all | class 3 | class 9 etc"
    ),

    ghs_class: str | None = Query(
        default=None,
        description="all | GHS07 | GHS08 etc"
    ),

    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    
):
    if page < 1:
            raise ValueError("page must be >= 1")

    if page_size > 200:
        raise ValueError("page_size too large")
    
    result = await MaterialService(db).list_materials(
        material_type=material_type,
        page=page,
        page_size=page_size,
        search=search,
        status=status,
        dg_class=dg_class,
        ghs_class=ghs_class,
    )

    return SuccessResponse(
        data=result["data"],
        meta=result["meta"]
    )



@router.get("/jurisdictions/{material_code}")
async def get_jurisdictions_by_material(
    material_code: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get all jurisdiction information for a given material_code
    """

    if not material_code:
        raise HTTPException(status_code=400, detail="material_code is required")

    try:
        result = await MaterialService(db).get_jurisdictions(
            material_code=material_code
        )

        return SuccessResponse(
            data=result["data"],
            meta=result["meta"]
        )

    except ValueError as ve:
        logger.warning(f"Validation error: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))

    except RuntimeError as re:
        logger.error(f"Service failure: {re}")
        raise HTTPException(status_code=500, detail="Internal server error")

    except Exception:
        logger.exception("Unhandled error in get_jurisdictions_by_material")
        raise HTTPException(status_code=500, detail="Unexpected error")




@router.put("/approve-reject")
async def approve_reject_material(
    payload: MaterialApprovalRequest,
    db: AsyncSession = Depends(get_db),
):
   

    return await MaterialService(db).approve_reject_material(
        material_codes=payload.material_codes,
        ghs_status=payload.ghs_status,
        dg_status=payload.dg_status,
        reject_reason=payload.reject_reason
    )



@router.get("/{parent_material_code}/children")
async def get_child_materials(
    parent_material_code: str,
   
    db: AsyncSession = Depends(get_db),
):
    result = await MaterialService(db).list_children(
        parent_material_code=parent_material_code,
    )

    return SuccessResponse(
        data=result["data"],
        meta=result["meta"],
    )




