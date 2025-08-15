#!/usr/bin/env python3
"""
Test Marathon PR conversion functionality
"""

def convert_time_to_seconds(time_str):
    """Convert time string like '7:43' or '3:15:00' to seconds"""
    if not time_str:
        return None
    try:
        if ':' in str(time_str):
            parts = str(time_str).split(':')
            if len(parts) == 2:
                # MM:SS format (e.g., "7:43" for mile time)
                minutes = int(parts[0])
                seconds = int(parts[1])
                return minutes * 60 + seconds
            elif len(parts) == 3:
                # HH:MM:SS format (e.g., "3:15:00" for marathon time)
                hours = int(parts[0])
                minutes = int(parts[1])
                seconds = int(parts[2])
                return hours * 3600 + minutes * 60 + seconds
        return int(time_str) if time_str.isdigit() else None
    except (ValueError, TypeError):
        return None

# Test cases
test_cases = [
    ("3:15:00", 11700),  # 3 hours 15 minutes = 11700 seconds
    ("2:45:30", 9930),   # 2 hours 45 minutes 30 seconds = 9930 seconds
    ("4:00:00", 14400),  # 4 hours = 14400 seconds
    ("3:30:45", 12645),  # 3 hours 30 minutes 45 seconds = 12645 seconds
    ("7:43", 463),       # 7 minutes 43 seconds = 463 seconds (mile time)
    ("22:30", 1350),     # 22 minutes 30 seconds = 1350 seconds (5K time)
]

print("Testing Marathon PR conversion function:")
print("=" * 50)

for time_str, expected in test_cases:
    result = convert_time_to_seconds(time_str)
    status = "✅" if result == expected else "❌"
    print(f"{status} {time_str} → {result} seconds (expected: {expected})")

print("\nTesting with profile_json structure:")
print("=" * 50)

def extract_individual_fields_test(profile_json):
    """Test version of extract_individual_fields focusing on pb_marathon"""
    individual_fields = {}
    
    # Performance fields
    performance_fields = {
        'pb_marathon_seconds': convert_time_to_seconds(profile_json.get('pb_marathon')),
        'pb_mile_seconds': convert_time_to_seconds(profile_json.get('pb_mile')),
        'pb_5k_seconds': convert_time_to_seconds(profile_json.get('pb_5k')),
    }
    
    individual_fields.update(performance_fields)
    
    # Remove None values
    return {k: v for k, v in individual_fields.items() if v is not None}

# Test with profile_json structure
profile_json = {
    'pb_marathon': '3:15:00',
    'pb_mile': '7:43',
    'pb_5k': '22:30'
}

result = extract_individual_fields_test(profile_json)
print(f"Input profile_json: {profile_json}")
print(f"Extracted fields: {result}")
print(f"pb_marathon_seconds: {result.get('pb_marathon_seconds')}")