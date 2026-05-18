#!/usr/bin/env bash
set -euo pipefail

# Pre-configure Obsidian: enable CLI and register vault
mkdir -p "${HOME}/.config/obsidian"
cp /workspace/docker/obsidian-config.json "${HOME}/.config/obsidian/obsidian.json"

# Set up plugin symlinks pointing back to the built output in /workspace
ln -sf /workspace/dist/main.js /workspace/test-vault/.obsidian/plugins/folderer/main.js
ln -sf /workspace/manifest.json /workspace/test-vault/.obsidian/plugins/folderer/manifest.json

# ~/.local/bin is where Obsidian installs obsidian-cli on first startup
export PATH="${HOME}/.local/bin:${PATH}"

# Start virtual display (note: binary is Xvfb, capital X)
Xvfb :99 -screen 0 1024x768x24 &
sleep 1
export DISPLAY=:99

# Start Obsidian headlessly
# --no-sandbox: required in Docker (Chromium sandbox needs user namespaces)
# --disable-gpu: avoids GPU/EGL crashes in a headless container
obsidian --no-sandbox --disable-gpu &

# Wait until the CLI is responsive (Obsidian installs obsidian-cli on first startup)
echo "Waiting for Obsidian to be ready..."
TIMEOUT=90
ELAPSED=0
until obsidian-cli version >/dev/null 2>&1; do
  sleep 2
  ELAPSED=$((ELAPSED + 2))
  if [ "${ELAPSED}" -ge "${TIMEOUT}" ]; then
    echo "Timed out waiting for Obsidian CLI after ${TIMEOUT}s"
    echo "Searching for obsidian-cli binary..."
    find /opt /usr "${HOME}" -name "obsidian-cli" 2>/dev/null || true
    exit 1
  fi
done
echo "Obsidian ready."

export OBSIDIAN_CLI_PATH="obsidian-cli"
export OBSIDIAN_VAULT_NAME="test-vault"
