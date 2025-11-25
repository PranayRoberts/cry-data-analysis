#!/usr/bin/env python3
"""
Create properly sampled data files (1000 records per sheet)
"""
import json
import random

data_dir = 'public/data'

def create_sample(backup_file, output_file, sample_size=1000):
    print(f"\nSampling {backup_file}...")
    
    with open(backup_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    sampled = {}
    for key, records in data.items():
        if isinstance(records, list) and len(records) > 0:
            count = min(sample_size, len(records))
            sampled[key] = random.sample(records, count)
            print(f"  {key}: {len(records):,} -> {count:,} records")
        else:
            sampled[key] = records
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(sampled, f, indent=2)
    
    import os
    size_kb = os.path.getsize(output_file) / 1024
    print(f"  Output: {size_kb:.2f} KB")

# Sample child_annual from BACKUP (2.76 MB which is manageable)
create_sample(
    f'{data_dir}/child_annual_data_BACKUP.json',
    f'{data_dir}/child_annual_data.json',
    1000
)

# Sample child_education from BACKUP (2.60 MB which is manageable)  
create_sample(
    f'{data_dir}/child_education_data_BACKUP.json',
    f'{data_dir}/child_education_data.json',
    1000
)

print("\nDone! Dashboards now have sampled data (1000 records per year)")
