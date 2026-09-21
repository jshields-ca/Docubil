# ─────────────────────────────────────────────────────────────────────────────
# Docubil — Docker image
# Multi-stage: builds the React frontend, then a slim Node.js 20 + Python 3.11
# runtime image for the full analysis pipeline.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: frontend build ────────────────────────────────────────────────
FROM node:25-slim AS frontend-builder

WORKDIR /app
COPY client/package.json client/package-lock.json* ./client/
RUN npm ci --prefix client

COPY client ./client
# vite.config.js builds to ../public, i.e. /app/public
RUN npm run build --prefix client

# ── Stage 2: runtime ────────────────────────────────────────────────────────
FROM node:25-slim

# Install Python 3, pip, and build dependencies for native Node modules
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 \
        python3-pip \
        python3-dev \
        build-essential \
        gcc \
        libffi-dev \
        libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Make python3 the default 'python' command
RUN ln -s /usr/bin/python3 /usr/local/bin/python

WORKDIR /app

# Install Python dependencies first (layer cache)
COPY requirements.txt ./
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Install Node dependencies. --ignore-scripts: this is a production install,
# and the only lifecycle script (`prepare`) sets up husky git hooks, a
# devDependency that isn't installed here -- running it fails the build.
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

# Copy application source (public/ is gitignored -- built output comes from stage 1)
COPY . .
COPY --from=frontend-builder /app/public ./public

# Create runtime directories (volumes should be mounted here in production)
RUN mkdir -p uploads output reports data logs

# Drop privileges — run as non-root user
RUN groupadd --gid 1001 appgroup && \
    useradd --uid 1001 --gid appgroup --no-create-home appuser && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

ENV NODE_ENV=production \
    PYTHON_PATH=python3 \
    PORT=3000

CMD ["node", "server.js"]
