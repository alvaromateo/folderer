# 1. Define the platform argument BEFORE the FROM line so it's globally available
ARG BUILD_PLATFORM=linux/amd64

# 2. Reference the variable instead of a hardcoded string
FROM --platform=${BUILD_PLATFORM} ubuntu:24.04

ARG OBSIDIAN_VERSION=1.12.7

ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=24

# System deps: xvfb + Electron/Chromium runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    xvfb \
    wget \
    curl \
    ca-certificates \
    # Electron/Chromium runtime
    libasound2t64 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2t64 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0t64 \
    libnss3 \
    libnspr4 \
    libpango-1.0-0 \
    libx11-6 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    && rm -rf /var/lib/apt/lists/*

# Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Obsidian
RUN apt-get update \
    && wget -q "https://github.com/obsidianmd/obsidian-releases/releases/download/v${OBSIDIAN_VERSION}/obsidian_${OBSIDIAN_VERSION}_amd64.deb" \
    && apt-get install -y ./obsidian_${OBSIDIAN_VERSION}_amd64.deb \
    && rm obsidian_${OBSIDIAN_VERSION}_amd64.deb \
    && rm -rf /var/lib/apt/lists/*

# Symlink obsidian-cli if it exists alongside the app binary
RUN find /usr/lib/obsidian /opt/Obsidian -name "obsidian-cli" 2>/dev/null \
    | head -1 \
    | xargs -I{} ln -sf {} /usr/local/bin/obsidian-cli || true


WORKDIR /workspace


# Build the project inside the container
# 1. Copy package files first to utilize Docker layer caching
COPY package*.json ./
# 2. Clean install dependencies natively inside the Linux container
# This ensures binary modules match linux/amd64 architecture
RUN npm ci
# 3. Copy the rest of the project files into the image
COPY . .
# 4. Run the build step
RUN npm run build
# 5. Point VAULT_PATH to the native directory now inside /workspace
ENV VAULT_PATH=/workspace/test-vault


ENTRYPOINT ["docker/entrypoint.sh"]
