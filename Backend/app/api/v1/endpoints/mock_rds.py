
from fastapi import FastAPI, HTTPException
import json
from pathlib import Path
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.responses import SuccessResponse
from app.dependencies.deps import get_db
from app.schemas.raw_material import MaterialListResponse
from app.services.materials_service import MaterialService

router = APIRouter()

# Load JSON once at startup
DATA_FILE = Path("mock_rds_data.json")

with open(DATA_FILE, "r") as f:
    MOCK_DATA = json.load(f)

@router.get("/dg-template/{reference_material_code}")
async def get_dg_template(reference_material_code: str):
    """
    Returns mock RDS DG classification template
    based on reference material code.
    """

    if reference_material_code not in MOCK_DATA:
        raise HTTPException(
            status_code=404,
            detail=f"No mock RDS data found for reference material {reference_material_code}"
        )

    return MOCK_DATA[reference_material_code]




MOCK_FILE = Path("mock_children_data.json")


def load_mock_data():
    if not MOCK_FILE.exists():
        return {}
    with open(MOCK_FILE, "r") as f:
        return json.load(f)



MOCK_FILE = Path("mock_children_data.json")


def load_mock_data():
    if not MOCK_FILE.exists():
        return {}
    with open(MOCK_FILE, "r") as f:
        return json.load(f)


@router.get("/children/{parent_code}")
async def get_children(parent_code: str):
    data = load_mock_data()

    children = data.get(parent_code)

    if not children:
        return {
            "status": False,
            "children": []
        }

    return {
        "status": True,
        "children": children
    }



with open("mock_rds_ghs_data.json") as f:
    DATA = json.load(f)

@router.get("/rds/ghs")
async def get_ghs(classification: str, category: str):

    for item in DATA["ghs_classifications"]:
        if item["classification"] == classification and item["category"] == category:
            return item

    return {"message": "Not found"}