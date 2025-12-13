#!/usr/bin/env python3
"""
Regenerate JSON data files from Excel sources
Fixes corrupted JSON files - Uses sampling for large files
"""

import json
import pandas as pd
from pathlib import Path
from datetime import datetime

# Setup paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / 'public' / 'data'
EXCEL_DIR = BASE_DIR / 'excel-data'

# Sample size for large datasets
SAMPLE_SIZE = 500

def convert_timestamps(obj):
    """Convert pandas Timestamps to strings"""
    if isinstance(obj, pd.Timestamp):
        return obj.strftime('%Y-%m-%d %H:%M:%S')
    elif isinstance(obj, datetime):
        return obj.strftime('%Y-%m-%d %H:%M:%S')
    elif pd.isna(obj):
        return None
    return obj

def dataframe_to_records(df, sample=None):
    """Convert dataframe to list of dicts with proper serialization"""
    if sample and len(df) > sample:
        df = df.sample(n=sample, random_state=42)
        print(f"    (Sampled {sample} from {len(df)} records)")
    
    records = []
    for _, row in df.iterrows():
        record = {}
        for col in df.columns:
            val = row[col]
            if pd.isna(val):
                record[col] = None
            elif isinstance(val, (pd.Timestamp, datetime)):
                record[col] = val.strftime('%Y-%m-%d %H:%M:%S')
            elif hasattr(val, 'item'):  # numpy types
                record[col] = val.item()
            else:
                record[col] = val
        records.append(record)
    return records

print("Regenerating JSON data files (with sampling for large datasets)...")

# 1. Anganwadi Data
print("\nProcessing Anganwadi data...")
anganwadi_data = {}
try:
    df_2024 = pd.read_excel(EXCEL_DIR / 'anganwadi-centre-information_2024.xlsx')
    anganwadi_data['anganwadi-centre-information_2024.xlsx_anganwadi-centre-information'] = dataframe_to_records(df_2024)
    print(f"  [OK] 2024: {len(df_2024)} records")
except Exception as e:
    print(f"  [ERROR] 2024 error: {e}")

try:
    df_2023 = pd.read_excel(EXCEL_DIR / 'anganwadi-centre-information_Report_2023.xlsx')
    anganwadi_data['anganwadi-centre-information_Report_2023.xlsx_anganwadi-centre-information'] = dataframe_to_records(df_2023)
    print(f"  [OK] 2023: {len(df_2023)} records")
except Exception as e:
    print(f"  [ERROR] 2023 error: {e}")

with open(DATA_DIR / 'anganwadi_data.json', 'w') as f:
    json.dump(anganwadi_data, f, indent=2, default=str)
print(f"  Saved anganwadi_data.json")

# 2. Child Annual Data (SAMPLED - large dataset)
print("\nProcessing Child Annual data...")
child_annual_data = {}
try:
    df_2024 = pd.read_excel(EXCEL_DIR / 'child-annual-information_Report_2024.xlsx')
    child_annual_data['child-annual-information_Report_2024.xlsx_child-annual-information'] = dataframe_to_records(df_2024, sample=SAMPLE_SIZE)
    print(f"  [OK] 2024: {len(df_2024)} records (sampled to {SAMPLE_SIZE})")
except Exception as e:
    print(f"  [ERROR] 2024 error: {e}")

try:
    df_2023 = pd.read_excel(EXCEL_DIR / 'Child_Annual_2023.xlsx')
    child_annual_data['Child_Annual_2023.xlsx_child-annual-information'] = dataframe_to_records(df_2023, sample=SAMPLE_SIZE)
    print(f"  [OK] 2023: {len(df_2023)} records (sampled to {SAMPLE_SIZE})")
except Exception as e:
    print(f"  [ERROR] 2023 error: {e}")

with open(DATA_DIR / 'child_annual_data.json', 'w') as f:
    json.dump(child_annual_data, f, indent=2, default=str)
print(f"  Saved child_annual_data.json")

# 3. Child Education Data (SAMPLED - large dataset)
print("\nProcessing Child Education data...")
child_education_data = {}
try:
    df_2024 = pd.read_excel(EXCEL_DIR / 'child-education_Consolidated_2024.xlsx')
    child_education_data['child-education_Consolidated_2024.xlsx_child-education'] = dataframe_to_records(df_2024, sample=SAMPLE_SIZE)
    print(f"  [OK] 2024: {len(df_2024)} records (sampled to {SAMPLE_SIZE})")
except Exception as e:
    print(f"  [ERROR] 2024 error: {e}")

try:
    df_2023 = pd.read_excel(EXCEL_DIR / 'Child_education_Consolidated-2023.xlsx')
    child_education_data['Child_education_Consolidated-2023.xlsx_child-education'] = dataframe_to_records(df_2023, sample=SAMPLE_SIZE)
    print(f"  [OK] 2023: {len(df_2023)} records (sampled to {SAMPLE_SIZE})")
except Exception as e:
    print(f"  [ERROR] 2023 error: {e}")

with open(DATA_DIR / 'child_education_data.json', 'w') as f:
    json.dump(child_education_data, f, indent=2, default=str)
print(f"  Saved child_education_data.json")

# 4. School Data
print("\nProcessing School data...")
school_data = {}
try:
    df_2024 = pd.read_excel(EXCEL_DIR / 'school-level-information_2024.xlsx')
    school_data['school-level-information_2024.xlsx_school-level-information'] = dataframe_to_records(df_2024)
    print(f"  [OK] 2024: {len(df_2024)} records")
except Exception as e:
    print(f"  [ERROR] 2024 error: {e}")

try:
    df_2023 = pd.read_excel(EXCEL_DIR / 'school-level-information_2023.xlsx')
    school_data['school-level-information_2023.xlsx_school-level-information'] = dataframe_to_records(df_2023)
    print(f"  [OK] 2023: {len(df_2023)} records")
except Exception as e:
    print(f"  [ERROR] 2023 error: {e}")

with open(DATA_DIR / 'school_data.json', 'w') as f:
    json.dump(school_data, f, indent=2, default=str)
print(f"  Saved school_data.json")

print("\n[OK] All JSON data files regenerated successfully!")
