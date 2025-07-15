#!/usr/bin/env python3
"""
Test script to verify webhook flow with correct data format
"""
import requests
import json

# Test webhook payload that should be sent
test_payload = {
    "athleteProfile": {
        "first_name": "Kyle",
        "sex": "Male", 
        "body_metrics": "163 lbs, VO2 max 54, resting HR 42, HRV 64",
        "pb_mile": "7:43",
        "weekly_miles": 15,
        "long_run": 7,
        "pb_bench_1rm": "225 lbs x 3 reps",
        "pb_squat_1rm": None,
        "pb_deadlift_1rm": None,
        "schema_version": "v1.0",
        "meta_session_id": "test-session-123"
    },
    "deliverable": "score"
}

# Test what the webhook currently receives
incorrect_payload = {
    "athleteProfile": "Thanks, Kyle! Your hybrid score essentials are complete. Your Hybrid Score will hit your inbox in minutes! 🚀",
    "deliverable": "hybrid-score"
}

webhook_url = "https://wavewisdom.app.n8n.cloud/webhook/b820bc30-989d-4c9b-9b0d-78b89b19b42c"

print("🔍 WEBHOOK TEST - CORRECT FORMAT")
print("=" * 50)
print(f"Testing webhook with CORRECT payload:")
print(json.dumps(test_payload, indent=2))

print("\n❌ REPORTED INCORRECT FORMAT")
print("=" * 50)
print(f"User reported webhook receives:")
print(json.dumps(incorrect_payload, indent=2))

print("\n✅ SOLUTION:")
print("1. Clear browser cache and hard refresh")
print("2. Use incognito/private window")
print("3. Verify accessing /hybrid-interview endpoint")
print("4. Check browser console for any errors")