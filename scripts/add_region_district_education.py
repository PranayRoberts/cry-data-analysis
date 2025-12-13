"""
Add region and district aggregations to child_education_data.json
by processing the full ORIGINAL data file using chunked reading.
"""
import json
from collections import defaultdict
import gc
import sys

def safe_str(value, default='Unknown'):
    """Safely convert value to string, handling None."""
    if value is None:
        return default
    s = str(value).strip()
    return s if s else default

def safe_lower(value):
    """Safely convert value to lowercase string."""
    if value is None:
        return ''
    return str(value).lower()

print("Loading child_education_data_ORIGINAL.json...")
print("This may take several minutes due to file size (1.2GB)...")
sys.stdout.flush()

try:
    with open('public/data/child_education_data_ORIGINAL.json', 'r', encoding='utf-8') as f:
        raw_data = json.load(f)
except KeyboardInterrupt:
    print("\nInterrupted! Exiting...")
    sys.exit(1)

print(f"Loaded! Type: {type(raw_data)}")
sys.stdout.flush()

# Flatten data from year-based keys
all_records = []
if isinstance(raw_data, dict):
    for key, records in raw_data.items():
        if isinstance(records, list):
            # Extract year from key
            year = None
            if '2023' in key:
                year = 2023
            elif '2024' in key:
                year = 2024
            
            for record in records:
                if year and 'Year' not in record:
                    record['Year'] = year
                all_records.append(record)
            print(f"  {key}: {len(records):,} records")
else:
    all_records = raw_data

print(f"\nTotal records to process: {len(all_records):,}")

# Free memory
del raw_data
gc.collect()

# Build aggregations
byRegion = defaultdict(lambda: {'count': 0, 'boys': 0, 'girls': 0})
byDistrict = defaultdict(lambda: {'count': 0, 'boys': 0, 'girls': 0})
regionYearData = defaultdict(lambda: defaultdict(lambda: {'count': 0, 'boys': 0, 'girls': 0}))
districtYearData = defaultdict(lambda: defaultdict(lambda: {'count': 0, 'boys': 0, 'girls': 0}))
regionDistrictMap = defaultdict(set)

print("\nProcessing records...")
for i, record in enumerate(all_records):
    if i % 100000 == 0:
        print(f"  Processed {i:,} records...")
    
    region = safe_str(record.get('Region Name', record.get('Region', 'Unknown')))
    district = safe_str(record.get('District Name', record.get('District', 'Unknown')))
    year = str(record.get('Year', record.get('Periodicity', 'Unknown')))
    gender = safe_lower(record.get('Gender', record.get('Gender_x', '')))
    
    is_male = gender in ['male', 'm', 'boy']
    is_female = gender in ['female', 'f', 'girl']
    
    # Region counts
    byRegion[region]['count'] += 1
    if is_male:
        byRegion[region]['boys'] += 1
    elif is_female:
        byRegion[region]['girls'] += 1
    
    # District counts  
    byDistrict[district]['count'] += 1
    if is_male:
        byDistrict[district]['boys'] += 1
    elif is_female:
        byDistrict[district]['girls'] += 1
    
    # Region-Year
    regionYearData[region][year]['count'] += 1
    if is_male:
        regionYearData[region][year]['boys'] += 1
    elif is_female:
        regionYearData[region][year]['girls'] += 1
    
    # District-Year
    districtYearData[district][year]['count'] += 1
    if is_male:
        districtYearData[district][year]['boys'] += 1
    elif is_female:
        districtYearData[district][year]['girls'] += 1
    
    # Map regions to districts
    if region != 'Unknown' and district != 'Unknown':
        regionDistrictMap[region].add(district)

print(f"  Processed {len(all_records):,} records total")

# Free memory
del all_records
gc.collect()

# Load existing summary data
print("\nLoading existing child_education_data.json...")
with open('public/data/child_education_data.json', 'r', encoding='utf-8') as f:
    summary_data = json.load(f)

# Update with new aggregations
summary_data['byRegion'] = dict(byRegion)
summary_data['byDistrict'] = dict(byDistrict)
summary_data['regionYearData'] = {k: dict(v) for k, v in regionYearData.items()}
summary_data['districtYearData'] = {k: dict(v) for k, v in districtYearData.items()}
summary_data['regionDistrictMap'] = {k: sorted(list(v)) for k, v in regionDistrictMap.items()}

# Save updated data
print("Saving updated child_education_data.json...")
with open('public/data/child_education_data.json', 'w', encoding='utf-8') as f:
    json.dump(summary_data, f, indent=2)

print("\n=== Summary ===")
print(f"Total Records: {summary_data['totalRecords']:,}")
print("\nBy Region:")
for region, info in sorted(summary_data['byRegion'].items()):
    print(f"  {region}: {info['count']:,} (Boys: {info['boys']:,}, Girls: {info['girls']:,})")

print(f"\nDistricts: {len(summary_data['byDistrict'])} total")
print("\nRegion-District Map:")
for region, districts in sorted(summary_data['regionDistrictMap'].items()):
    print(f"  {region}: {len(districts)} districts")

print("\nRegion Year Data:")
for region in sorted(summary_data['regionYearData'].keys()):
    years = summary_data['regionYearData'][region]
    year_str = ", ".join([f"{y}: {d['count']:,}" for y, d in sorted(years.items())])
    print(f"  {region}: {year_str}")

# Verify totals match
total_from_regions = sum(info['count'] for info in summary_data['byRegion'].values())
print(f"\nVerification:")
print(f"  Sum of regions: {total_from_regions:,}")
print(f"  Total records: {summary_data['totalRecords']:,}")
print(f"  Match: {'YES' if total_from_regions == summary_data['totalRecords'] else 'NO'}")

print("\nDone!")
