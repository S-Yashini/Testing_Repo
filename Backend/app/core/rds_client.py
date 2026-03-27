import httpx


class RDSClient:

    def __init__(self, base_url: str):
        self.base_url = base_url

    async def get_jurisdiction_template(self, reference_material_code: str):
        """
        Fetch jurisdiction DG template from RDS
        """

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/rds/dg-template/{reference_material_code}"
            )

            if response.status_code != 200:
                return None

            return response.json()


    async def get_all_children_for_parent(self, parent_code: str):

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/rds/children/{parent_code}"
            )

            if response.status_code != 200:
                return False, []
            if response.status_code == 404:
                return False, []
            
            data = response.json()

            return response.status_code==200, data.get("children", [])
        


    async def lookup_ghs_classification(self, classification, category):

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/rds/ghs-classification",
                params={
                    "classification": classification,
                    "category": category
                }
            )

        return response.json()