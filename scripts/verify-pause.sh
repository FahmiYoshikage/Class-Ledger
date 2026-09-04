#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}   🔍 KAS KELAS - PAUSE VERIFICATION${NC}"
echo -e "${YELLOW}═══════════════════════════════════════${NC}"
echo ""

# Load environment variables
if [ -f server/.env ]; then
    export $(cat server/.env | grep MONGODB_URI | xargs)
    echo -e "${GREEN}✓${NC} Loaded .env from server/"
else
    echo -e "${RED}✗${NC} .env not found in server/"
    exit 1
fi

# Run test
echo ""
echo -e "${YELLOW}Running automated tests...${NC}"
echo ""

cd server && node test-pause-feature.js

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}   ✓ VERIFICATION SUCCESSFUL${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo ""
    echo -e "Next steps:"
    echo -e "  1. Refresh browser (Ctrl+F5)"
    echo -e "  2. Check dashboard shows ${YELLOW}Week 7${NC}"
    echo -e "  3. Verify tunggakan matches test results"
    echo ""
else
    echo -e "${RED}═══════════════════════════════════════${NC}"
    echo -e "${RED}   ✗ VERIFICATION FAILED${NC}"
    echo -e "${RED}═══════════════════════════════════════${NC}"
    echo ""
    echo -e "Check the error messages above"
    echo ""
fi

cd ..
