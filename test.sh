#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
node tests/core.test.js
for file in *.js; do node --check "$file"; done
printf 'syntax checks: OK\n'
