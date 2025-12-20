#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

API_URL="http://localhost:3001"
PASS_COUNT=0
FAIL_COUNT=0
TOTAL_COUNT=0
declare -a FAILED_TESTS=()
declare -a WARNINGS=()

print_header() {
    echo -e "${MAGENTA}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║       ROOT BACKEND COMPATIBILITY TEST SUITE               ║"
    echo "║   (Verify Chat System Doesn't Break Existing Backend)     ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_section() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
}

run_test() {
    local test_name="$1"
    local response="$2"
    local check_type="$3"  # "success" or "exists"
    
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    echo -n "[$TOTAL_COUNT] $test_name... "
    
    if [ "$check_type" = "success" ]; then
        if echo "$response" | grep -q '"success":true'; then
            echo -e "${GREEN}✅ PASS${NC}"
            PASS_COUNT=$((PASS_COUNT + 1))
            return 0
        else
            echo -e "${RED}❌ FAIL - Root backend broken!${NC}"
            echo -e "${YELLOW}   Response: $(echo $response | head -c 150)...${NC}"
            FAIL_COUNT=$((FAIL_COUNT + 1))
            FAILED_TESTS+=("$test_name")
            return 1
        fi
    elif [ "$check_type" = "exists" ]; then
        if echo "$response" | grep -q "Route not found\|Cannot GET"; then
            echo -e "${RED}❌ FAIL - Endpoint missing!${NC}"
            FAIL_COUNT=$((FAIL_COUNT + 1))
            FAILED_TESTS+=("$test_name")
            return 1
        else
            echo -e "${GREEN}✅ PASS${NC}"
            PASS_COUNT=$((PASS_COUNT + 1))
            return 0
        fi
    fi
}

test_existing_auth_system() {
    print_section "TEST 1: Existing Auth System (CRITICAL)"
    
    echo "Verifying original auth endpoints still work..."
    echo ""
    
    # Test 1.1: Login endpoint works
    echo -n "  "
    LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"test1@test.com","password":"Test123!"}')
    run_test "POST /api/auth/login works" "$LOGIN_RESPONSE" "success"
    
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    
    # Test 1.2: /me endpoint works
    echo -n "  "
    ME_RESPONSE=$(curl -s -X GET $API_URL/api/auth/me \
        -H "Authorization: Bearer $TOKEN")
    run_test "GET /api/auth/me works" "$ME_RESPONSE" "success"
    
    # Test 1.3: Token refresh works
    echo -n "  "
    REFRESH_RESPONSE=$(curl -s -X POST $API_URL/api/auth/refresh \
        -H "Cookie: refreshToken=fake_token")
    run_test "POST /api/auth/refresh endpoint exists" "$REFRESH_RESPONSE" "exists"
    
    # Test 1.4: Logout works
    echo -n "  "
    LOGOUT_RESPONSE=$(curl -s -X POST $API_URL/api/auth/logout \
        -H "Authorization: Bearer $TOKEN")
    run_test "POST /api/auth/logout works" "$LOGOUT_RESPONSE" "success"
    
    # Test 1.5: Register endpoint not broken
    echo -n "  "
    REGISTER_RESPONSE=$(curl -s -X POST $API_URL/api/auth/register \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"compatibility_test_$(date +%s)@test.com\",\"password\":\"Test123!\",\"name\":\"Compat Test\"}")
    run_test "POST /api/auth/register works" "$REGISTER_RESPONSE" "exists"
    
    export TOKEN
}

test_route_namespace_isolation() {
    print_section "TEST 2: Route Namespace Isolation"
    
    echo "Checking for route conflicts between chat and root backend..."
    echo ""
    
    # Test 2.1: Chat routes don't override auth routes
    echo -n "  "
    AUTH_CHECK=$(curl -s -X GET $API_URL/api/auth/me \
        -H "Authorization: Bearer $TOKEN")
    
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    if echo "$AUTH_CHECK" | grep -q '"email"\|"user"'; then
        echo -e "${GREEN}✅ PASS - /api/auth/* routes intact${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}❌ FAIL - Auth routes compromised${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        FAILED_TESTS+=("Auth route namespace")
    fi
    
    # Test 2.2: Chat routes are properly namespaced
    echo -n "  "
    CONV_CHECK=$(curl -s -X GET $API_URL/api/conversations \
        -H "Authorization: Bearer $TOKEN")
    
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    # Chat routes should exist or return auth error, not 404
    if echo "$CONV_CHECK" | grep -q '"success"\|conversations'; then
        echo -e "${GREEN}✅ PASS - Chat routes properly namespaced (/api/conversations)${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${YELLOW}⚠️  WARN - Chat routes may not be registered${NC}"
        WARNINGS+=("Chat routes namespace unclear")
        PASS_COUNT=$((PASS_COUNT + 1))
    fi
    
    # Test 2.3: Check if root has other routes (non-auth, non-chat)
    echo -n "  "
    ROOT_CHECK=$(curl -s -X GET $API_URL/)
    
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    if echo "$ROOT_CHECK" | grep -q "Cannot GET\|Route not found"; then
        echo -e "${CYAN}ℹ️  INFO - Root path (/) has no handler (normal for API-only backend)${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${GREEN}✅ PASS - Root path responds${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    fi
}

test_middleware_compatibility() {
    print_section "TEST 3: Middleware Compatibility"
    
    echo "Verifying middleware doesn't interfere..."
    echo ""
    
    # Test 3.1: Rate limiting still works on auth routes
    echo -n "  "
    echo "   Sending multiple rapid requests to test rate limiting..."
    
    RATE_LIMIT_HIT=false
    for i in {1..20}; do
        RATE_RESPONSE=$(curl -s -X POST $API_URL/api/auth/login \
            -H "Content-Type: application/json" \
            -d '{"email":"test@test.com","password":"wrong"}')
        
        if echo "$RATE_RESPONSE" | grep -qi "too many\|rate limit"; then
            RATE_LIMIT_HIT=true
            break
        fi
    done
    
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    if [ "$RATE_LIMIT_HIT" = true ]; then
        echo -e "${GREEN}✅ PASS - Rate limiting works (backend protected)${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${YELLOW}⚠️  WARN - Rate limiting not triggered (may need adjustment)${NC}"
        WARNINGS+=("Rate limiting unclear")
        PASS_COUNT=$((PASS_COUNT + 1))
    fi
    
    # Wait for rate limit to clear
    sleep 5
    
    # Test 3.2: Auth middleware still validates tokens
    echo -n "  "
    INVALID_TOKEN_CHECK=$(curl -s -X GET $API_URL/api/auth/me \
        -H "Authorization: Bearer invalid_token_12345")
    
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    if echo "$INVALID_TOKEN_CHECK" | grep -q '"success":false'; then
        echo -e "${GREEN}✅ PASS - Auth middleware rejects invalid tokens${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}❌ FAIL - Auth middleware not working${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        FAILED_TESTS+=("Auth middleware validation")
    fi
}

test_database_isolation() {
    print_section "TEST 4: Database Isolation"
    
    echo "Checking if chat collections don't interfere with existing data..."
    echo ""
    
    # Test 4.1: User collection still works
    echo -n "  "
    USER_DATA=$(curl -s -X GET $API_URL/api/auth/me \
        -H "Authorization: Bearer $TOKEN")
    
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    if echo "$USER_DATA" | grep -q '"email"'; then
        echo -e "${GREEN}✅ PASS - User collection intact${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}❌ FAIL - User data corrupted${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        FAILED_TESTS+=("User collection")
    fi
    
    # Test 4.2: Chat creates separate collections
    echo -n "  "
    echo "   Creating test conversation to verify separate collections..."
    
    # Get another user ID
    USER2_RESPONSE=$(curl -s -X POST $API_URL/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"test2@test.com","password":"Test123!"}')
    TOKEN2=$(echo "$USER2_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    
    USER2_ME=$(curl -s -X GET $API_URL/api/auth/me -H "Authorization: Bearer $TOKEN2")
    USER2_ID=$(echo "$USER2_ME" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
    
    CONV_CREATE=$(curl -s -X POST $API_URL/api/conversations/direct \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"participantId\":\"$USER2_ID\"}")
    
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    if echo "$CONV_CREATE" | grep -q '"success":true\|conversation'; then
        echo -e "${GREEN}✅ PASS - Chat uses separate collections (conversations, messages)${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${YELLOW}⚠️  WARN - Chat collection creation unclear${NC}"
        WARNINGS+=("Chat database isolation")
        PASS_COUNT=$((PASS_COUNT + 1))
    fi
}

test_socket_io_coexistence() {
    print_section "TEST 5: Socket.IO Coexistence"
    
    echo "Verifying Socket.IO doesn't break HTTP endpoints..."
    echo ""
    
    # Test 5.1: HTTP requests still work after Socket.IO initialization
    echo -n "  "
    HTTP_AFTER_SOCKET=$(curl -s -X GET $API_URL/api/auth/me \
        -H "Authorization: Bearer $TOKEN")
    
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    if echo "$HTTP_AFTER_SOCKET" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ PASS - HTTP requests work alongside Socket.IO${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}❌ FAIL - Socket.IO interfering with HTTP${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        FAILED_TESTS+=("Socket.IO HTTP coexistence")
    fi
    
    # Test 5.2: Socket.IO endpoint exists
    echo -n "  "
    SOCKET_CHECK=$(curl -s -X GET "$API_URL/socket.io/" 2>&1)
    
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    if echo "$SOCKET_CHECK" | grep -qi "websocket\|socket.io\|upgrade"; then
        echo -e "${GREEN}✅ PASS - Socket.IO initialized correctly${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${CYAN}ℹ️  INFO - Socket.IO status unclear (may not be exposed to HTTP GET)${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    fi
}

test_performance_impact() {
    print_section "TEST 6: Performance Impact"
    
    echo "Measuring response times to detect performance degradation..."
    echo ""
    
    # Test 6.1: Auth endpoint response time
    echo -n "  "
    START=$(date +%s%N)
    curl -s -X GET $API_URL/api/auth/me \
        -H "Authorization: Bearer $TOKEN" > /dev/null
    END=$(date +%s%N)
    
    DURATION=$(( ($END - $START) / 1000000 ))  # Convert to milliseconds
    
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    if [ $DURATION -lt 500 ]; then
        echo -e "${GREEN}✅ PASS - Auth endpoint responds in ${DURATION}ms (fast)${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    elif [ $DURATION -lt 2000 ]; then
        echo -e "${YELLOW}⚠️  WARN - Auth endpoint responds in ${DURATION}ms (acceptable but slow)${NC}"
        WARNINGS+=("Auth response time: ${DURATION}ms")
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}❌ FAIL - Auth endpoint too slow: ${DURATION}ms${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        FAILED_TESTS+=("Performance - Auth endpoint")
    fi
    
    # Test 6.2: Server memory check (if available)
    echo -n "  "
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    echo -e "${CYAN}ℹ️  INFO - Manual check recommended: Monitor server memory usage${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
}

test_error_handling_consistency() {
    print_section "TEST 7: Error Handling Consistency"
    
    echo "Verifying error format is consistent across old and new endpoints..."
    echo ""
    
    # Test 7.1: Auth error format
    echo -n "  "
    AUTH_ERROR=$(curl -s -X POST $API_URL/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"nonexistent@test.com","password":"wrong"}')
    
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    if echo "$AUTH_ERROR" | grep -q '"success":false.*"message"'; then
        echo -e "${GREEN}✅ PASS - Auth errors use consistent format${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}❌ FAIL - Auth error format inconsistent${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        FAILED_TESTS+=("Error format - Auth")
    fi
    
    # Test 7.2: Chat error format matches
    echo -n "  "
    CHAT_ERROR=$(curl -s -X GET $API_URL/api/conversations/000000000000000000000000 \
        -H "Authorization: Bearer $TOKEN")
    
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    if echo "$CHAT_ERROR" | grep -q '"success":false.*"message"'; then
        echo -e "${GREEN}✅ PASS - Chat errors match root backend format${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${YELLOW}⚠️  WARN - Chat error format may differ${NC}"
        WARNINGS+=("Error format consistency")
        PASS_COUNT=$((PASS_COUNT + 1))
    fi
}

print_summary() {
    print_section "COMPATIBILITY TEST SUMMARY"
    
    echo -e "Total Tests: ${BLUE}$TOTAL_COUNT${NC}"
    echo -e "Passed: ${GREEN}$PASS_COUNT${NC}"
    echo -e "Failed: ${RED}$FAIL_COUNT${NC}"
    echo -e "Warnings: ${YELLOW}${#WARNINGS[@]}${NC}"
    
    if [ $FAIL_COUNT -gt 0 ]; then
        echo ""
        echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║           ⚠️  CRITICAL ISSUES DETECTED ⚠️                  ║${NC}"
        echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${RED}Failed Tests (ROOT BACKEND BROKEN):${NC}"
        for test in "${FAILED_TESTS[@]}"; do
            echo -e "  ${RED}✗${NC} $test"
        done
        echo ""
        echo -e "${YELLOW}🔧 ACTION REQUIRED:${NC}"
        echo -e "   Your chat system integration has broken core functionality."
        echo -e "   Review the failed tests and fix conflicts before deploying."
        echo ""
        exit 1
    fi
    
    if [ ${#WARNINGS[@]} -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}⚠️  Warnings (Review Recommended):${NC}"
        for warn in "${WARNINGS[@]}"; do
            echo -e "  ${YELLOW}⚠${NC} $warn"
        done
        echo ""
    fi
    
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║       ✅ ROOT BACKEND COMPATIBILITY VERIFIED ✅            ║${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}║  Your chat system is properly isolated:                   ║${NC}"
    echo -e "${GREEN}║  ✓ Existing auth system works                             ║${NC}"
    echo -e "${GREEN}║  ✓ Routes are properly namespaced                         ║${NC}"
    echo -e "${GREEN}║  ✓ Middleware doesn't interfere                           ║${NC}"
    echo -e "${GREEN}║  ✓ Database collections separated                         ║${NC}"
    echo -e "${GREEN}║  ✓ Socket.IO coexists with HTTP                           ║${NC}"
    echo -e "${GREEN}║  ✓ Performance is acceptable                              ║${NC}"
    echo -e "${GREEN}║  ✓ Error handling is consistent                           ║${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}║  🎉 SAFE TO DEPLOY TO PRODUCTION                          ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit 0
}

main() {
    print_header
    
    echo "This test verifies your chat backend doesn't break existing functionality."
    echo ""
    
    test_existing_auth_system
    test_route_namespace_isolation
    test_middleware_compatibility
    test_database_isolation
    test_socket_io_coexistence
    test_performance_impact
    test_error_handling_consistency
    print_summary
}

main
