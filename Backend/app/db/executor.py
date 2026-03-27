from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sqlalchemy.sql.elements import TextClause

# class SQLExecutor:
#     """
#     Central executor for running raw SQL queries.
#     Works across SQLite/Postgres/AzureSQL.
#     """

#     def __init__(self, db: AsyncSession):
#         self.db = db

#     async def fetch_all(self, query: str, params: dict):
#         result = await self.db.execute(text(query), params)
#         rows = result.mappings().all()
#         return [dict(r) for r in rows]

#     async def fetch_one(self, query: str, params: dict):
#         result = await self.db.execute(text(query), params)
#         row = result.mappings().first()
#         return dict(row) if row else None

#     async def execute(self, query: str, params: dict = None):

#         if isinstance(query, TextClause):
#             stmt = query
#         else:
#             stmt = text(query)

#         await self.db.execute(stmt, params or {})
#         # await self.db.commit()




class SQLExecutor:
    """
    Central executor for running raw SQL queries.
    Works across SQLite/Postgres/AzureSQL.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def fetch_all(self, query: str | TextClause, params: dict = None):
        stmt = query if isinstance(query, TextClause) else text(query)

        result = await self.db.execute(stmt, params or {})
        rows = result.mappings().all()
        return [dict(r) for r in rows]

    async def fetch_one(self, query: str | TextClause, params: dict = None):
        stmt = query if isinstance(query, TextClause) else text(query)

        result = await self.db.execute(stmt, params or {})
        row = result.mappings().first()
        return dict(row) if row else None

    async def execute(self, query: str | TextClause, params: dict = None):
        stmt = query if isinstance(query, TextClause) else text(query)

        await self.db.execute(stmt, params or {})