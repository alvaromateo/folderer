#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/setup.sh"

# Write env vars to a file so `docker exec` shells can source them
cat > /root/.debug-env << 'EOF'
export DISPLAY=:99
export PATH="${HOME}/.local/bin:${PATH}"
export OBSIDIAN_CLI_PATH="obsidian-cli"
export OBSIDIAN_VAULT_NAME="test-vault"
EOF

# DEBUG: sleep instead of running tests so you can exec into the container
# sleep infinity

# Run integration in debug mode
exec npm run test:integration:debug
