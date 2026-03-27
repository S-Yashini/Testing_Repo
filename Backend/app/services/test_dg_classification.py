import asyncio
from app.core.database import AsyncSessionLocal
from app.services.dg_classification_service import DG_CLASSIFICATION_SERVICE
from app.core.rds_client import RDSClient

async def main():
    rds_client = RDSClient(base_url="http://localhost:8000")

    # async with AsyncSessionLocal() as db:
    #     service = DG_CLASSIFICATION_SERVICE(
    #         db=db,
    #         rds_client=rds_client
    #     )

    #     result = await service.classify_material(
    #         material_code="9999-31-8005"
    #     )

    #     print(result)


    async with AsyncSessionLocal() as db:
        service = DG_CLASSIFICATION_SERVICE(
            db=db,
            rds_client=rds_client
        )

        result = await service.classify_material(
            material_code="9999-31-8021"
        )

        print(result)

if __name__ == "__main__":
    asyncio.run(main())