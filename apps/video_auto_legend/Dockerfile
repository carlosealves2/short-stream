FROM python:3.14-slim

WORKDIR /app

# Copy pre-built wheel and dependencies
COPY dist/apps/video_auto_legend/*.whl .

# Install the package
RUN pip install --no-cache-dir *.whl

CMD ["uvicorn", "video_auto_legend.main:app", "--host", "0.0.0.0", "--port", "8000"]
