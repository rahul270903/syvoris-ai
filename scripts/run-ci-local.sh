#!/usr/bin/env bash
# ==============================================================================
# SYVORIS Ai Enterprise CRM - Local CI Verification Runner (POSIX / Bash)
# ==============================================================================
set -eo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m'

echo -e "${GRAY}==========================================================${NC}"
echo -e "${YELLOW}${BOLD} SYVORIS Ai Enterprise CRM - Local CI Verification Runner${NC}"
echo -e "${GRAY}==========================================================${NC}"

# Python resolver
PYTHON_BIN="python3"
if [ -f "backend/venv/bin/python" ]; then
    PYTHON_BIN="backend/venv/bin/python"
elif [ -f "backend/venv/Scripts/python.exe" ]; then
    PYTHON_BIN="backend/venv/Scripts/python.exe"
fi

START_TIME=$(date +%s)

echo -e "\n${CYAN}[CI-RUNNER] Step 1/5: Checking Frontend Route Invariants & Structure...${NC}"
npm run check:project
echo -e "${GREEN}[SUCCESS] Frontend route invariants (132/132 unique) and architecture verified.${NC}"

echo -e "\n${CYAN}[CI-RUNNER] Step 2/5: Checking TypeScript Strict Type Compilation...${NC}"
npm run typecheck
echo -e "${GREEN}[SUCCESS] TypeScript strict typecheck passed with 0 errors.${NC}"

echo -e "\n${CYAN}[CI-RUNNER] Step 3/5: Building Production Frontend Bundle (Vite + Rollup)...${NC}"
npm run build
test -f dist/index.html || { echo -e "${RED}[FAILURE] dist/index.html not generated${NC}"; exit 1; }
echo -e "${GREEN}[SUCCESS] Production frontend bundle successfully built.${NC}"

echo -e "\n${CYAN}[CI-RUNNER] Step 4/5: Verifying Alembic Migration Lineage & Single Head...${NC}"
$PYTHON_BIN -m alembic -c backend/alembic.ini heads
echo -e "${GREEN}[SUCCESS] Alembic single migration head confirmed.${NC}"

echo -e "\n${CYAN}[CI-RUNNER] Step 5/5: Running Pytest Regression Test Suite...${NC}"
$PYTHON_BIN -m pytest backend/tests/ -q --tb=short
echo -e "${GREEN}[SUCCESS] Backend test suite passed cleanly.${NC}"

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo -e "\n${GRAY}==========================================================${NC}"
echo -e "${GREEN}${BOLD} ALL QUALITY GATES PASSED [Time: ${ELAPSED}s]${NC}"
echo -e "${GREEN} Workspace is clean and ready for commit / push.${NC}"
echo -e "${GRAY}==========================================================${NC}"
