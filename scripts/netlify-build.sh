#!/usr/bin/env bash
# Wrapper legado — delega para scripts/netlify-build.mjs
set -euo pipefail
exec node "$(dirname "$0")/netlify-build.mjs"
