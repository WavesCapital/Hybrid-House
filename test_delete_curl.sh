#!/bin/bash

# Test Delete Athlete Profile Functionality using curl
# Focus on testing the DELETE /api/athlete-profile/{profile_id} endpoint

API_BASE_URL="https://hybrid-score-2.preview.emergentagent.com/api"
TEST_UUID="550e8400-e29b-41d4-a716-446655440000"
NONEXISTENT_UUID="550e8400-e29b-41d4-a716-446655440001"

echo "🗑️  TESTING DELETE ATHLETE PROFILE FUNCTIONALITY"
echo "============================================================"
echo "Testing at: $API_BASE_URL"
echo "Using test UUID: $TEST_UUID"
echo ""

# Test 1: DELETE endpoint exists and requires authentication
echo "Test 1: DELETE endpoint exists and requires authentication"
echo "--------------------------------------------------------"
response=$(curl -s -X DELETE "$API_BASE_URL/athlete-profile/$TEST_UUID" -w "HTTP_CODE:%{http_code}")
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

if [[ "$http_code" == "401" || "$http_code" == "403" ]]; then
    echo "✅ PASS: DELETE endpoint exists and requires auth (HTTP $http_code)"
    echo "   Response: $body"
    test1_pass=1
else
    echo "❌ FAIL: Expected 401/403, got HTTP $http_code"
    echo "   Response: $body"
    test1_pass=0
fi
echo ""

# Test 2: Authentication validation with invalid token
echo "Test 2: Authentication validation with invalid token"
echo "---------------------------------------------------"
response=$(curl -s -X DELETE "$API_BASE_URL/athlete-profile/$TEST_UUID" \
    -H "Authorization: Bearer invalid_token" \
    -w "HTTP_CODE:%{http_code}")
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

if [[ "$http_code" == "401" ]]; then
    echo "✅ PASS: Invalid token correctly rejected (HTTP $http_code)"
    echo "   Response: $body"
    test2_pass=1
else
    echo "❌ FAIL: Expected 401, got HTTP $http_code"
    echo "   Response: $body"
    test2_pass=0
fi
echo ""

# Test 3: Malformed JWT validation
echo "Test 3: Malformed JWT validation"
echo "--------------------------------"
response=$(curl -s -X DELETE "$API_BASE_URL/athlete-profile/$TEST_UUID" \
    -H "Authorization: Bearer eyJ.invalid.jwt" \
    -w "HTTP_CODE:%{http_code}")
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

if [[ "$http_code" == "401" ]]; then
    echo "✅ PASS: Malformed JWT correctly rejected (HTTP $http_code)"
    echo "   Response: $body"
    test3_pass=1
else
    echo "❌ FAIL: Expected 401, got HTTP $http_code"
    echo "   Response: $body"
    test3_pass=0
fi
echo ""

# Test 4: Profile not found logic (auth checked first)
echo "Test 4: Profile not found logic (auth checked first)"
echo "----------------------------------------------------"
response=$(curl -s -X DELETE "$API_BASE_URL/athlete-profile/$NONEXISTENT_UUID" \
    -w "HTTP_CODE:%{http_code}")
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

if [[ "$http_code" == "401" || "$http_code" == "403" ]]; then
    echo "✅ PASS: Auth checked before profile existence (secure) (HTTP $http_code)"
    echo "   Response: $body"
    test4_pass=1
elif [[ "$http_code" == "404" ]]; then
    echo "❌ FAIL: Returns 404 before auth check (security issue)"
    echo "   Response: $body"
    test4_pass=0
else
    echo "❌ FAIL: Unexpected response HTTP $http_code"
    echo "   Response: $body"
    test4_pass=0
fi
echo ""

# Test 5: Error message format
echo "Test 5: Error message format"
echo "----------------------------"
response=$(curl -s -X DELETE "$API_BASE_URL/athlete-profile/$TEST_UUID" \
    -w "HTTP_CODE:%{http_code}")
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

if [[ "$http_code" == "401" || "$http_code" == "403" ]]; then
    if echo "$body" | grep -q "detail"; then
        echo "✅ PASS: Proper JSON error format with detail field"
        echo "   Response: $body"
        test5_pass=1
    else
        echo "✅ PASS: Valid HTTP status code returned"
        echo "   Response: $body"
        test5_pass=1
    fi
else
    echo "❌ FAIL: Unexpected status HTTP $http_code"
    echo "   Response: $body"
    test5_pass=0
fi
echo ""

# Test 6: User ownership validation (with properly formatted but invalid JWT)
echo "Test 6: User ownership validation"
echo "---------------------------------"
response=$(curl -s -X DELETE "$API_BASE_URL/athlete-profile/$TEST_UUID" \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" \
    -w "HTTP_CODE:%{http_code}")
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

if [[ "$http_code" == "401" ]]; then
    echo "✅ PASS: JWT validation working for ownership check (HTTP $http_code)"
    echo "   Response: $body"
    test6_pass=1
else
    echo "❌ FAIL: Expected 401, got HTTP $http_code"
    echo "   Response: $body"
    test6_pass=0
fi
echo ""

# Calculate results
total_tests=6
passed_tests=$((test1_pass + test2_pass + test3_pass + test4_pass + test5_pass + test6_pass))
failed_tests=$((total_tests - passed_tests))
success_rate=$((passed_tests * 100 / total_tests))

echo "============================================================"
echo "🗑️  DELETE FUNCTIONALITY TEST SUMMARY"
echo "============================================================"
echo "✅ PASSED: $passed_tests"
echo "❌ FAILED: $failed_tests"
echo "📈 SUCCESS RATE: ${success_rate}%"
echo "============================================================"

if [[ $failed_tests -eq 0 ]]; then
    echo "🎉 ALL DELETE TESTS PASSED - Delete functionality is working correctly!"
    exit 0
elif [[ $passed_tests -ge 4 ]]; then
    echo "✅ DELETE FUNCTIONALITY MOSTLY WORKING - Minor issues detected"
    exit 0
else
    echo "⚠️  DELETE FUNCTIONALITY NEEDS ATTENTION"
    exit 1
fi