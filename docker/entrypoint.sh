#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/setup.sh"

# Run integration tests
exec npm run test:integration
