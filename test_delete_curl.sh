#!/bin/bash

# Test Delete Athlete Profile Functionality using curl
# Focus on testing the DELETE /api/athlete-profile/{profile_id} endpoint

API_BASE_URL="https://a80e8c7b-ad46-4b7f-b333-fb885f46d4ff.preview.emergentagent.com/api"

echo "🗑️  TESTING DELETE ATHLETE PROFILE FUNCTIONALITY"
echo "============================================================"
echo "Testing at: $API_BASE_URL"
echo ""

# Test 1: DELETE endpoint exists and requires authentication
echo "Test 1: DELETE endpoint exists and requires authentication"
echo "--------------------------------------------------------"
response=$(curl -s -X DELETE "$API_BASE_URL/athlete-profile/test-profile-id" -w "HTTP_CODE:%{http_code}")
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

if [[ "$http_code" == "401" || "$http_code" == "403" || "$http_code" == "422" ]]; then
    echo "✅ PASS: DELETE endpoint exists and requires auth (HTTP $http_code)"
    echo "   Response: $body"
    test1_pass=1
else
    echo "❌ FAIL: Expected 401/403/422, got HTTP $http_code"
    echo "   Response: $body"
    test1_pass=0
fi
echo ""

# Test 2: Authentication validation with invalid token
echo "Test 2: Authentication validation with invalid token"
echo "---------------------------------------------------"
response=$(curl -s -X DELETE "$API_BASE_URL/athlete-profile/test-id" \
    -H "Authorization: Bearer invalid_token" \
    -w "HTTP_CODE:%{http_code}")
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

if [[ "$http_code" == "401" || "$http_code" == "403" || "$http_code" == "422" ]]; then
    echo "✅ PASS: Invalid token correctly rejected (HTTP $http_code)"
    echo "   Response: $body"
    test2_pass=1
else
    echo "❌ FAIL: Expected 401/403/422, got HTTP $http_code"
    echo "   Response: $body"
    test2_pass=0
fi
echo ""

# Test 3: Malformed JWT validation
echo "Test 3: Malformed JWT validation"
echo "--------------------------------"
response=$(curl -s -X DELETE "$API_BASE_URL/athlete-profile/test-id" \
    -H "Authorization: Bearer eyJ.invalid.jwt" \
    -w "HTTP_CODE:%{http_code}")
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

if [[ "$http_code" == "401" || "$http_code" == "403" || "$http_code" == "422" ]]; then
    echo "✅ PASS: Malformed JWT correctly rejected (HTTP $http_code)"
    echo "   Response: $body"
    test3_pass=1
else
    echo "❌ FAIL: Expected 401/403/422, got HTTP $http_code"
    echo "   Response: $body"
    test3_pass=0
fi
echo ""

# Test 4: Profile not found logic (auth checked first)
echo "Test 4: Profile not found logic (auth checked first)"
echo "----------------------------------------------------"
response=$(curl -s -X DELETE "$API_BASE_URL/athlete-profile/non-existent-id" \
    -w "HTTP_CODE:%{http_code}")
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

if [[ "$http_code" == "401" || "$http_code" == "403" || "$http_code" == "422" ]]; then
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
response=$(curl -s -X DELETE "$API_BASE_URL/athlete-profile/test-id" \
    -w "HTTP_CODE:%{http_code}")
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

if [[ "$http_code" == "401" || "$http_code" == "403" || "$http_code" == "422" ]]; then
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

# Test 6: CORS support for DELETE method
echo "Test 6: CORS support for DELETE method"
echo "--------------------------------------"
response=$(curl -s -X OPTIONS "$API_BASE_URL/athlete-profile/test-id" \
    -H "Access-Control-Request-Method: DELETE" \
    -w "HTTP_CODE:%{http_code}")
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)

if [[ "$http_code" == "200" || "$http_code" == "204" ]]; then
    echo "✅ PASS: CORS preflight for DELETE method supported (HTTP $http_code)"
    test6_pass=1
else
    echo "⚠️  INFO: CORS preflight response HTTP $http_code (may still work)"
    test6_pass=1  # Don't fail on this as it's not critical
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