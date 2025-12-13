#!/usr/bin/env python3
"""
Quick fix: Replace huge JSON files with smaller samples
"""
import json
import os

data_dir = 'public/data'

# Create minimal sample for child_annual_data.json
print("Creating minimal child_annual_data.json...")
child_annual = {
    "Child_Annual_2023.xlsx_child-annual-information": [],
    "child-annual-information_Report_2024.xlsx_child-annual-information": []
}

backup1 = os.path.join(data_dir, 'child_annual_data_BACKUP.json')
original1 = os.path.join(data_dir, 'child_annual_data.json')
if not os.path.exists(backup1) and os.path.exists(original1):
    os.rename(original1, backup1)

with open(original1, 'w', encoding='utf-8') as f:
    json.dump(child_annual, f, indent=2)
print(f"[OK] Created minimal child_annual_data.json (backed up original)")

# Create minimal sample for child_education_data.json
print("Creating minimal child_education_data.json...")
child_education = {
    "Child_education_Consolidated-2023.xlsx_child-education": [],
    "child-education_Consolidated_2024.xlsx_child-education": []
}

backup2 = os.path.join(data_dir, 'child_education_data_BACKUP.json')
original2 = os.path.join(data_dir, 'child_education_data.json')
if not os.path.exists(backup2) and os.path.exists(original2):
    os.rename(original2, backup2)

with open(original2, 'w', encoding='utf-8') as f:
    json.dump(child_education, f, indent=2)
print(f"[OK] Created minimal child_education_data.json (backed up original)")

print("\nDone! Dashboard should now load without crashing.")
print("Note: Child Annual and Child Education dashboards will show empty data.")
print("To restore original data, rename the _BACKUP files back.")
