#!/usr/bin/env python3
"""
Fix NaN values in JSON files by replacing them with null
"""
import json
import os
import re

data_dir = 'public/data'

def fix_json_file(filepath):
    """Replace NaN and Infinity with null in JSON file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace NaN with null (NaN is not valid JSON)
    content = re.sub(r'\bNaN\b', 'null', content)
    # Replace Infinity with null
    content = re.sub(r'\bInfinity\b', 'null', content)
    # Replace -Infinity with null
    content = re.sub(r'\b-Infinity\b', 'null', content)
    
    # Write back and verify it's valid JSON
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    # Verify JSON is valid
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            json.load(f)
        return True
    except json.JSONDecodeError as e:
        print(f"ERROR: {filepath} is still invalid JSON: {e}")
        return False

# Process all JSON files
for filename in os.listdir(data_dir):
    if filename.endswith('.json') and filename != 'schema_analysis.json':
        filepath = os.path.join(data_dir, filename)
        print(f"Fixing {filename}...")
        if fix_json_file(filepath):
            print(f"  [OK] {filename} fixed and validated")
        else:
            print(f"  [ERROR] {filename} failed")

print("\nAll JSON files fixed!")
