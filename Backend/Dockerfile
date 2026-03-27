FROM python:3.12-slim

# Install uv
RUN pip install uv

WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-dev

# Copy application code
COPY app ./app
COPY main.py ./

#  Copy SDS sheets 
COPY sds_sheets ./sds_sheets

# Copy DB
COPY json_tables.db ./ehs_ai.db

# Copy JSON files
COPY mock_rds_data.json ./
COPY mock_rds_ghs_data.json ./

# Copy JSON files to endpoints
COPY mock_rds_data.json ./app/api/v1/endpoints/
COPY mock_rds_ghs_data.json ./app/api/v1/endpoints/

# Environment variables
ENV PROJECT_NAME=EHS-AI
ENV DATABASE_URL=sqlite+aiosqlite:///./ehs_ai.db
ENV KEYVAULT_URL=dummy-local-value

# Activate virtual environment
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

# Start server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
