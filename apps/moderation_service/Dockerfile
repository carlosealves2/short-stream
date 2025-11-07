FROM python:3.14-slim

WORKDIR /app

# Copy pre-built wheel and dependencies
COPY dist/apps/moderation_service/*.whl .

# Install the package
RUN pip install --no-cache-dir *.whl

CMD ["uvicorn", "moderation_service.main:app", "--host", "0.0.0.0", "--port", "8000"]
