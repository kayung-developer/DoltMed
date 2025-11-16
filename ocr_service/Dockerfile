# Use an official Python image as a base
FROM python:3.11-slim

# Set the working directory
WORKDIR /ocr_app

# Install Tesseract OCR engine and other system dependencies
# This is the crucial step for this service.
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY ./app /ocr_app/app

EXPOSE 8090

CMD ["gunicorn", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:8090"]