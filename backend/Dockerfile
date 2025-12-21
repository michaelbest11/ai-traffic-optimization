FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including ffmpeg
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN python -m pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create models directory and set proper permissions
RUN mkdir -p models && chmod -R 755 models

# Fix permissions for DLL files (if any)
RUN find /usr/local/lib/python3.11/site-packages -name "*.dll" -exec chmod 755 {} \; || true

# Expose port for FastAPI
EXPOSE 8000

# Start the app
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
