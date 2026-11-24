#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
node tests/core.test.js
for file in *.js; do node --check "$file"; done
printf 'syntax checks: OK\n'
if python3 -c 'import playwright' 2>/dev/null; then
  # tests/e2e-smoke.py procura automaticamente Chromium/Chrome do sistema.
  # ARENA_CHROMIUM permite sobrescrever o caminho quando necessário.
  python3 -I tests/e2e-smoke.py
else
  printf 'e2e: ignorado (instale playwright para rodar tests/e2e-smoke.py)\n'
fi
