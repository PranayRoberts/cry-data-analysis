"""
Generate comprehensive insights data for the CRY Dashboard
- Extracts state/district level data from Excel files
- Correlates CRY program data with NFHS-5 nutrition data
- Creates aggregated JSON for filtering and charts
"""

import pandas as pd
import json
import os
from pathlib import Path

# Paths
EXCEL_DIR = Path("d:/React/cry-data-analysis/excel-data")
OUTPUT_DIR = Path("d:/React/cry-data-analysis/public/data")
NFHS5_PATH = OUTPUT_DIR / "nfhs5_nutrition_data.json"

def load_nfhs5_data():
    """Load NFHS-5 nutrition data"""
    with open(NFHS5_PATH, 'r') as f:
        return json.load(f)

def standardize_state_name(name):
    """Standardize state names for matching between datasets"""
    if pd.isna(name) or name is None:
        return None
    
    name = str(name).strip()
    
    # Mapping for common variations
    mappings = {
        'Jammu & Kashmir': 'Jammu and Kashmir',
        'J&K': 'Jammu and Kashmir',
        'Jammu And Kashmir': 'Jammu and Kashmir',
        'AP': 'Andhra Pradesh',
        'MP': 'Madhya Pradesh',
        'UP': 'Uttar Pradesh',
        'WB': 'West Bengal',
        'TN': 'Tamil Nadu',
        'Orissa': 'Odisha',
        'Mumbai': 'Maharashtra',  # Mumbai is in Maharashtra
    }
    
    return mappings.get(name, name)

def process_child_annual_data():
    """Process child annual data from Excel files"""
    print("Processing child annual data...")
    
    # Load 2023 and 2024 data
    files = [
        EXCEL_DIR / "Child_Annual_2023.xlsx",
        EXCEL_DIR / "child-annual-information_Report_2024.xlsx"
    ]
    
    all_data = []
    
    for file_path in files:
        if file_path.exists():
            print(f"  Loading {file_path.name}...")
            try:
                df = pd.read_excel(file_path)
                all_data.append(df)
            except Exception as e:
                print(f"  Error loading {file_path.name}: {e}")
    
    if not all_data:
        print("  No data loaded!")
        return None
    
    df = pd.concat(all_data, ignore_index=True)
    print(f"  Total records: {len(df)}")
    
    # Standardize column names
    df.columns = df.columns.str.strip()
    
    # Extract state and district data
    state_col = None
    district_col = None
    year_col = None
    gender_col = None
    
    for col in df.columns:
        col_lower = col.lower()
        if 'state' in col_lower and 'name' in col_lower:
            state_col = col
        elif 'district' in col_lower and 'name' in col_lower:
            district_col = col
        elif 'periodicity' in col_lower and 'date' not in col_lower:
            year_col = col
        elif 'gender' in col_lower:
            gender_col = col
    
    print(f"  State column: {state_col}")
    print(f"  District column: {district_col}")
    print(f"  Year column: {year_col}")
    print(f"  Gender column: {gender_col}")
    
    # Standardize state names
    if state_col:
        df['State_Std'] = df[state_col].apply(standardize_state_name)
    
    # Create state-level aggregations
    state_data = {}
    district_data = {}
    
    if state_col:
        for state, group in df.groupby('State_Std'):
            if pd.isna(state) or state is None:
                continue
            
            state_data[state] = {
                'totalChildren': len(group),
                'boys': len(group[group[gender_col].str.lower() == 'male']) if gender_col else 0,
                'girls': len(group[group[gender_col].str.lower() == 'female']) if gender_col else 0,
                'districts': {}
            }
            
            # District-level data within state
            if district_col:
                for district, d_group in group.groupby(district_col):
                    if pd.isna(district):
                        continue
                    state_data[state]['districts'][str(district)] = {
                        'totalChildren': len(d_group),
                        'boys': len(d_group[d_group[gender_col].str.lower() == 'male']) if gender_col else 0,
                        'girls': len(d_group[d_group[gender_col].str.lower() == 'female']) if gender_col else 0,
                    }
    
    return state_data

def process_education_data():
    """Process education data from Excel files"""
    print("Processing education data...")
    
    files = [
        EXCEL_DIR / "Child_education_Consolidated-2023.xlsx",
        EXCEL_DIR / "child-education_Consolidated_2024.xlsx"
    ]
    
    all_data = []
    
    for file_path in files:
        if file_path.exists():
            print(f"  Loading {file_path.name}...")
            try:
                df = pd.read_excel(file_path)
                all_data.append(df)
            except Exception as e:
                print(f"  Error loading {file_path.name}: {e}")
    
    if not all_data:
        return None
    
    df = pd.concat(all_data, ignore_index=True)
    df.columns = df.columns.str.strip()
    
    # Find relevant columns
    state_col = None
    district_col = None
    enrollment_col = None
    
    for col in df.columns:
        col_lower = col.lower()
        if 'state' in col_lower and 'name' in col_lower:
            state_col = col
        elif 'district' in col_lower and 'name' in col_lower:
            district_col = col
        elif 'enrolled' in col_lower or 'enrollment' in col_lower:
            enrollment_col = col
    
    if state_col:
        df['State_Std'] = df[state_col].apply(standardize_state_name)
    
    # Aggregate by state
    education_by_state = {}
    
    if state_col:
        for state, group in df.groupby('State_Std'):
            if pd.isna(state):
                continue
            education_by_state[state] = {
                'totalRecords': len(group),
                'districts': {}
            }
            
            if district_col:
                for district, d_group in group.groupby(district_col):
                    if pd.isna(district):
                        continue
                    education_by_state[state]['districts'][str(district)] = {
                        'totalRecords': len(d_group)
                    }
    
    return education_by_state

def process_vulnerability_protection_data():
    """Process vulnerability protection data"""
    print("Processing vulnerability protection data...")
    
    file_path = EXCEL_DIR / "Vulnerability parameters-protection.xlsx"
    
    if not file_path.exists():
        print(f"  File not found: {file_path}")
        return None
    
    try:
        df = pd.read_excel(file_path)
        df.columns = df.columns.str.strip()
        print(f"  Total records: {len(df)}")
        
        # Find state and district columns
        state_col = None
        district_col = None
        
        for col in df.columns:
            col_lower = col.lower()
            if 'state' in col_lower and 'name' in col_lower:
                state_col = col
            elif 'district' in col_lower and 'name' in col_lower:
                district_col = col
        
        if state_col:
            df['State_Std'] = df[state_col].apply(standardize_state_name)
        
        # Risk columns
        marriage_cols = [col for col in df.columns if 'marriage' in col.lower() or 'marry' in col.lower()]
        labour_cols = [col for col in df.columns if 'labour' in col.lower() or 'labor' in col.lower() or 'work' in col.lower()]
        trafficking_cols = [col for col in df.columns if 'traffic' in col.lower()]
        
        # Aggregate by state
        protection_by_state = {}
        
        if state_col:
            for state, group in df.groupby('State_Std'):
                if pd.isna(state):
                    continue
                
                protection_by_state[state] = {
                    'totalChildren': len(group),
                    'childMarriageAtRisk': 0,
                    'childLabourAtRisk': 0,
                    'traffickingAtRisk': 0,
                    'districts': {}
                }
                
                # Count at-risk children
                for col in marriage_cols:
                    if 'risk' in col.lower() or 'yes' in str(group[col].iloc[0]).lower() if len(group) > 0 else False:
                        protection_by_state[state]['childMarriageAtRisk'] += group[col].apply(lambda x: 1 if str(x).lower() in ['yes', 'high', '1', 'true'] else 0).sum()
                
                for col in labour_cols:
                    protection_by_state[state]['childLabourAtRisk'] += group[col].apply(lambda x: 1 if str(x).lower() in ['yes', 'high', '1', 'true'] else 0).sum()
                
                for col in trafficking_cols:
                    protection_by_state[state]['traffickingAtRisk'] += group[col].apply(lambda x: 1 if str(x).lower() in ['yes', 'high', '1', 'true'] else 0).sum()
                
                # District level
                if district_col:
                    for district, d_group in group.groupby(district_col):
                        if pd.isna(district):
                            continue
                        protection_by_state[state]['districts'][str(district)] = {
                            'totalChildren': len(d_group)
                        }
        
        return protection_by_state
    
    except Exception as e:
        print(f"  Error: {e}")
        return None

def correlate_with_nfhs5(cry_state_data, nfhs5_data):
    """Correlate CRY program data with NFHS-5 nutrition data"""
    print("Correlating CRY data with NFHS-5...")
    
    correlations = []
    
    nfhs5_states = nfhs5_data.get('state_data', {})
    india_avg = nfhs5_data.get('india_average', {})
    
    for state, cry_data in cry_state_data.items():
        std_state = standardize_state_name(state)
        
        # Find matching NFHS-5 state
        nfhs_match = None
        for nfhs_state in nfhs5_states.keys():
            if nfhs_state.lower() == std_state.lower():
                nfhs_match = nfhs_state
                break
        
        if nfhs_match:
            nfhs_values = nfhs5_states[nfhs_match]
            
            correlation = {
                'state': state,
                'cryChildren': cry_data.get('totalChildren', 0),
                'cryBoys': cry_data.get('boys', 0),
                'cryGirls': cry_data.get('girls', 0),
                'nfhs5_underweight': nfhs_values.get('underweight', 0),
                'nfhs5_stunting': nfhs_values.get('stunting', 0),
                'nfhs5_wasting': nfhs_values.get('wasting', 0),
                'underweight_vs_avg': nfhs_values.get('underweight', 0) - india_avg.get('underweight', 0),
                'stunting_vs_avg': nfhs_values.get('stunting', 0) - india_avg.get('stunting', 0),
                'wasting_vs_avg': nfhs_values.get('wasting', 0) - india_avg.get('wasting', 0),
                'districts': list(cry_data.get('districts', {}).keys())
            }
            correlations.append(correlation)
        else:
            print(f"  No NFHS-5 match for state: {state}")
    
    return correlations

def get_all_districts():
    """Extract all unique districts from Excel files"""
    print("Extracting all districts...")
    
    files = [
        EXCEL_DIR / "child-annual-information_Report_2024.xlsx",
        EXCEL_DIR / "Child_Annual_2023.xlsx"
    ]
    
    districts_by_state = {}
    
    for file_path in files:
        if file_path.exists():
            try:
                df = pd.read_excel(file_path)
                df.columns = df.columns.str.strip()
                
                state_col = None
                district_col = None
                
                for col in df.columns:
                    col_lower = col.lower()
                    if 'state' in col_lower and 'name' in col_lower:
                        state_col = col
                    elif 'district' in col_lower and 'name' in col_lower:
                        district_col = col
                
                if state_col and district_col:
                    for _, row in df[[state_col, district_col]].drop_duplicates().iterrows():
                        state = standardize_state_name(row[state_col])
                        district = row[district_col]
                        
                        if pd.isna(state) or pd.isna(district):
                            continue
                        
                        if state not in districts_by_state:
                            districts_by_state[state] = set()
                        districts_by_state[state].add(str(district))
            
            except Exception as e:
                print(f"  Error processing {file_path.name}: {e}")
    
    # Convert sets to sorted lists
    for state in districts_by_state:
        districts_by_state[state] = sorted(list(districts_by_state[state]))
    
    return districts_by_state

def main():
    print("=" * 60)
    print("Generating Insights Data for CRY Dashboard")
    print("=" * 60)
    
    # Load NFHS-5 data
    nfhs5_data = load_nfhs5_data()
    print(f"Loaded NFHS-5 data for {len(nfhs5_data.get('state_data', {}))} states")
    
    # Process CRY data
    child_data = process_child_annual_data()
    education_data = process_education_data()
    protection_data = process_vulnerability_protection_data()
    
    # Get all districts
    districts = get_all_districts()
    print(f"Found districts in {len(districts)} states")
    
    # Create correlations
    correlations = []
    if child_data:
        correlations = correlate_with_nfhs5(child_data, nfhs5_data)
        print(f"Created {len(correlations)} state correlations")
    
    # Compile final output
    insights_data = {
        'metadata': {
            'generated': pd.Timestamp.now().isoformat(),
            'sources': {
                'nfhs5': 'National Family Health Survey 2019-2021',
                'cry': 'CRY Annual Data 2023-2024'
            }
        },
        'stateList': sorted(list(set(
            list(child_data.keys() if child_data else []) +
            list(nfhs5_data.get('state_data', {}).keys())
        ))),
        'districtsByState': districts,
        'nfhs5': {
            'indiaAverage': nfhs5_data.get('india_average', {}),
            'stateData': nfhs5_data.get('state_data', {})
        },
        'cryStateData': child_data or {},
        'educationByState': education_data or {},
        'protectionByState': protection_data or {},
        'stateCorrelations': correlations
    }
    
    # Write output
    output_path = OUTPUT_DIR / "insights_data.json"
    with open(output_path, 'w') as f:
        json.dump(insights_data, f, indent=2, default=str)
    
    print(f"\nOutput written to: {output_path}")
    print(f"Total states: {len(insights_data['stateList'])}")
    print(f"States with correlations: {len(correlations)}")
    
    # Print sample correlation
    if correlations:
        print("\nSample correlation (first state):")
        sample = correlations[0]
        print(f"  State: {sample['state']}")
        print(f"  CRY Children: {sample['cryChildren']}")
        print(f"  NFHS-5 Underweight: {sample['nfhs5_underweight']}%")
        print(f"  NFHS-5 Stunting: {sample['nfhs5_stunting']}%")
        print(f"  NFHS-5 Wasting: {sample['nfhs5_wasting']}%")

if __name__ == "__main__":
    main()
