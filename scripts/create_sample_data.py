#!/usr/bin/env python3
"""
Create smaller sample datasets for browser loading
Takes random samples of large JSON files to create manageable sizes
"""
import json
import random
import os

# Sample size per sheet (should keep total file under 5MB)
SAMPLE_SIZE = 500  # records per year/sheet

def sample_data(input_file, output_file, sample_size=SAMPLE_SIZE):
    """Create a sampled version of a large JSON file"""
    print(f"\nProcessing {input_file}...")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    sampled_data = {}
    total_original = 0
    total_sampled = 0
    
    for sheet_key, records in data.items():
        if isinstance(records, list):
            original_count = len(records)
            total_original += original_count
            
            # Sample data if too large
            if original_count > sample_size:
                sampled = random.sample(records, sample_size)
                sampled_data[sheet_key] = sampled
                total_sampled += sample_size
                print(f"  {sheet_key}: {original_count:,} -> {sample_size:,} records")
            else:
                sampled_data[sheet_key] = records
                total_sampled += original_count
                print(f"  {sheet_key}: {original_count:,} records (kept all)")
        else:
            sampled_data[sheet_key] = records
    
    # Write sampled data
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(sampled_data, f, indent=2)
    
    output_size = os.path.getsize(output_file) / (1024 * 1024)
    print(f"  Total: {total_original:,} -> {total_sampled:,} records")
    print(f"  Output size: {output_size:.2f} MB")
    
    return total_original, total_sampled

# Files to process
data_dir = 'public/data'
files_to_sample = [
    'child_annual_data.json',
    'child_education_data.json',
]

print("Creating sampled datasets for browser performance...")
print("=" * 60)

for filename in files_to_sample:
    input_path = os.path.join(data_dir, filename)
    output_path = os.path.join(data_dir, filename)  # Overwrite original
    
    if os.path.exists(input_path):
        # Backup original first
        backup_path = input_path.replace('.json', '_ORIGINAL.json')
        if not os.path.exists(backup_path):
            print(f"\nBacking up {filename} to {backup_path.split('/')[-1]}")
            os.rename(input_path, backup_path)
            input_path = backup_path
        
        sample_data(input_path, output_path)
    else:
        print(f"\n{filename} not found, skipping...")

print("\n" + "=" * 60)
print("Sampled datasets created!")
print("\nOriginal files backed up with _ORIGINAL suffix")
print("Browser should now load the dashboard without crashing")
