"""
Analyze protection vulnerability risks from the actual data.
This script properly calculates Child Marriage, Child Labour, and Child Trafficking risks.
"""
import pandas as pd
import numpy as np
import json
from pathlib import Path

EXCEL_DIR = Path("D:/React/cry-data-analysis/excel-data")
OUTPUT_PATH = Path("D:/React/cry-data-analysis/public/data/vulnerability_data.json")

def load_data():
    """Load and merge labor and household data."""
    print("Loading data...")
    
    # Load labor/migration data
    df_2024 = pd.read_excel(EXCEL_DIR / "Consolidated_Labour_and_Migration_2024.xlsx")
    df_2024['Year'] = 2024
    df_2023 = pd.read_excel(EXCEL_DIR / "Consolidated-labour-and-migration2023.xlsx")
    df_2023['Year'] = 2023
    labor_df = pd.concat([df_2023, df_2024], ignore_index=True)
    print(f"  Labor/Migration records: {len(labor_df)}")
    
    # Load household data
    xl_2024 = pd.ExcelFile(EXCEL_DIR / "HH-2024.xlsx")
    hh_2024 = pd.read_excel(xl_2024, sheet_name='house-hold-information')
    xl_2023 = pd.ExcelFile(EXCEL_DIR / "HH-2023.xlsx")
    hh_2023 = pd.read_excel(xl_2023, sheet_name='house-hold-information')
    hh_df = pd.concat([hh_2023, hh_2024], ignore_index=True)
    print(f"  Household records: {len(hh_df)}")
    
    # Merge household info into labor data
    hh_cols = ['Beneficiary Id', 'Whether the HH is headed by a single parent', 
               'Whether headed by children (18 years and below)', 'Type of Ration card',
               'Whether Household migrates every year', 'Is any child missing?',
               'Whether the HH is headed by grand parents',
               'Whether the primary bread-earner of the HH is terminally/seriously ill']
    
    labor_df = labor_df.merge(
        hh_df[hh_cols].drop_duplicates(subset=['Beneficiary Id']),
        on='Beneficiary Id', how='left', suffixes=('', '_hh')
    )
    
    return labor_df, hh_df


def calc_child_marriage_risk(row):
    """
    Calculate Child Marriage risk for adolescent girls (10-18).
    Based on Excel parameters with weights totaling 1.0, scaled to 0-100.
    """
    score = 0
    factors = []
    
    enrollment = str(row.get('Enrollment status', '')).lower()
    
    # 1. Out of school adol girl children - 0.2
    if 'drop out' in enrollment or 'never enrolled' in enrollment:
        score += 20
        factors.append('Out of school')
    
    # 2. Children irregular to school - 0.05
    # Note: We don't have explicit irregular flag, but can infer
    
    # 3. History of child marriage - 0.15
    # Note: Not available in dataset
    
    # 4. Marriage averted/stopped - 0.2
    # Note: Not available in dataset
    
    # 5. Two or more girl children in family - 0.05
    # Note: Need to aggregate by household
    
    # 6. Orphan/single parent girl child - 0.15
    single_parent = str(row.get('Whether the HH is headed by a single parent', '')).lower()
    grandparent = str(row.get('Whether the HH is headed by grand parents', '')).lower()
    child_headed = str(row.get('Whether headed by children (18 years and below)', '')).lower()
    if single_parent == 'yes' or grandparent == 'yes' or child_headed == 'yes':
        score += 15
        factors.append('Orphan/Single parent')
    
    # 7. Parents disabled/unable to work - 0.05
    earner_ill = str(row.get('Whether the primary bread-earner of the HH is terminally/seriously ill', '')).lower()
    if earner_ill == 'yes':
        score += 5
        factors.append('Primary earner ill')
    
    # 8. Risk prone area (natural disasters/high CM rate) - 0.05
    # Use migration as proxy for risk-prone
    migrated = str(row.get('Child migrated in the last 3 months?', '')).lower()
    hh_migrates = str(row.get('Whether Household migrates every year', '')).lower()
    if 'yes' in migrated or hh_migrates == 'yes':
        score += 5
        factors.append('Migration/Risk area')
    
    # 9. Protection issues (abuse, trafficking, missing) - 0.1
    missing = str(row.get('Is any child missing?', '')).lower()
    if missing == 'yes':
        score += 10
        factors.append('Missing children in HH')
    
    # Economic hardship proxy - BPL status
    ration = str(row.get('Type of Ration card', '')).lower()
    if 'below poverty' in ration or 'no ration' in ration:
        score += 10
        factors.append('BPL/Economic hardship')
    
    return min(score, 100), factors


def calc_child_labour_risk(row):
    """
    Calculate Child Labour risk for children 6-18.
    Based on Excel parameters with weights totaling 1.0, scaled to 0-100.
    """
    score = 0
    factors = []
    
    enrollment = str(row.get('Enrollment status', '')).lower()
    economic = str(row.get('Is the child involved in any Economic activities? (with or without wage/ monetary compensation for the child)', '')).lower()
    
    # 1. Out of school children - 0.15
    if 'drop out' in enrollment or 'never enrolled' in enrollment:
        score += 15
        factors.append('Out of school')
    
    # 2. Children involved in economic activities - 0.15
    if 'yes' in economic:
        score += 15
        factors.append('Economic activity')
        # Extra weight for outside home alone
        if 'outside home alone' in economic:
            score += 10
            factors.append('Works outside alone')
    
    # 3. Rescued from CL, not mainstreamed - 0.2
    # Proxy: Currently in bonded labor
    bonded = str(row.get('Bonded labour involvement', '')).lower()
    if bonded == 'yes':
        score += 20
        factors.append('Bonded labor')
    
    # 4. Children irregular to school - 0.1
    # Not explicitly available
    
    # 5. Orphan/single parent child - 0.1
    single_parent = str(row.get('Whether the HH is headed by a single parent', '')).lower()
    grandparent = str(row.get('Whether the HH is headed by grand parents', '')).lower()
    child_headed = str(row.get('Whether headed by children (18 years and below)', '')).lower()
    if single_parent == 'yes' or grandparent == 'yes' or child_headed == 'yes':
        score += 10
        factors.append('Orphan/Single parent')
    
    # 6. Economically weak HH / disabled parents - 0.1
    ration = str(row.get('Type of Ration card', '')).lower()
    earner_ill = str(row.get('Whether the primary bread-earner of the HH is terminally/seriously ill', '')).lower()
    if 'below poverty' in ration or 'no ration' in ration or earner_ill == 'yes':
        score += 10
        factors.append('Economic hardship')
    
    # 7. Risk prone areas (natural disasters) - 0.1
    migrated = str(row.get('Child migrated in the last 3 months?', '')).lower()
    hh_migrates = str(row.get('Whether Household migrates every year', '')).lower()
    if 'yes' in migrated or hh_migrates == 'yes':
        score += 10
        factors.append('Migration/Risk area')
    
    # 8. Protection issues (corporal punishment, discrimination) - 0.1
    missing = str(row.get('Is any child missing?', '')).lower()
    if missing == 'yes':
        score += 10
        factors.append('Protection issues')
    
    return min(score, 100), factors


def calc_child_trafficking_risk(row):
    """
    Calculate Child Trafficking risk for children 6-18.
    Based on Excel parameters with weights totaling 1.0, scaled to 0-100.
    """
    score = 0
    factors = []
    
    enrollment = str(row.get('Enrollment status', '')).lower()
    economic = str(row.get('Is the child involved in any Economic activities? (with or without wage/ monetary compensation for the child)', '')).lower()
    
    # 1. Out of school + involved in economic activities - 0.25
    is_out_of_school = 'drop out' in enrollment or 'never enrolled' in enrollment
    is_economically_active = 'yes' in economic
    
    if is_out_of_school and is_economically_active:
        score += 25
        factors.append('Out of school + Economic activity')
    elif is_out_of_school:
        score += 15
        factors.append('Out of school')
    elif is_economically_active:
        score += 10
        factors.append('Economic activity')
    
    # 2. Children in migrant families - 0.2
    migrated = str(row.get('Child migrated in the last 3 months?', '')).lower()
    hh_migrates = str(row.get('Whether Household migrates every year', '')).lower()
    if hh_migrates == 'yes':
        score += 20
        factors.append('Migrant family')
    elif 'yes' in migrated:
        score += 15
        factors.append('Child migrated')
    
    # 3. Orphan/single parent child - 0.2
    single_parent = str(row.get('Whether the HH is headed by a single parent', '')).lower()
    grandparent = str(row.get('Whether the HH is headed by grand parents', '')).lower()
    child_headed = str(row.get('Whether headed by children (18 years and below)', '')).lower()
    if single_parent == 'yes' or grandparent == 'yes' or child_headed == 'yes':
        score += 20
        factors.append('Orphan/Single parent')
    
    # 4. Economically weak HH - 0.1
    ration = str(row.get('Type of Ration card', '')).lower()
    earner_ill = str(row.get('Whether the primary bread-earner of the HH is terminally/seriously ill', '')).lower()
    if 'below poverty' in ration or 'no ration' in ration or earner_ill == 'yes':
        score += 10
        factors.append('Economic hardship')
    
    # 5. Trafficking hotspot areas - 0.2
    # Use migration via agent/contractor as proxy
    if 'agent' in migrated or 'contractor' in migrated or 'labour' in migrated:
        score += 20
        factors.append('Trafficking risk (agent migration)')
    
    # 6. History of trafficking/missing children - 0.15
    missing = str(row.get('Is any child missing?', '')).lower()
    if missing == 'yes':
        score += 15
        factors.append('Missing children in HH')
    
    return min(score, 100), factors


def get_risk_level(score):
    """Convert score to risk level using standard thresholds."""
    if score >= 50:
        return 'High'
    elif score >= 25:
        return 'Medium'
    elif score > 0:
        return 'Low'
    return 'Minimal'


def analyze_protection_risks():
    """Main analysis function."""
    labor_df, hh_df = load_data()
    
    print("\n" + "=" * 60)
    print("CHILD MARRIAGE RISK ANALYSIS (Girls 10-18)")
    print("=" * 60)
    
    # Filter for adolescent girls (10-18)
    girls_10_18 = labor_df[
        (labor_df['Gender'] == 'female') & 
        (labor_df['Age Band'].isin(['11-14Y', '15-18Y']))
    ].copy()
    
    print(f"Adolescent girls (10-18): {len(girls_10_18)}")
    
    # Calculate marriage risk scores
    marriage_results = girls_10_18.apply(calc_child_marriage_risk, axis=1)
    girls_10_18['MarriageRiskScore'] = [r[0] for r in marriage_results]
    girls_10_18['MarriageRiskFactors'] = [r[1] for r in marriage_results]
    girls_10_18['MarriageRiskLevel'] = girls_10_18['MarriageRiskScore'].apply(get_risk_level)
    
    # Show score distribution
    print(f"\nScore Distribution:")
    print(f"  Score 0 (No risk):    {(girls_10_18['MarriageRiskScore'] == 0).sum():,}")
    print(f"  Score 1-24 (Low):     {((girls_10_18['MarriageRiskScore'] > 0) & (girls_10_18['MarriageRiskScore'] < 25)).sum():,}")
    print(f"  Score 25-49 (Medium): {((girls_10_18['MarriageRiskScore'] >= 25) & (girls_10_18['MarriageRiskScore'] < 50)).sum():,}")
    print(f"  Score 50+ (High):     {(girls_10_18['MarriageRiskScore'] >= 50).sum():,}")
    print(f"\nMax score achieved: {girls_10_18['MarriageRiskScore'].max()}")
    print(f"Mean score: {girls_10_18['MarriageRiskScore'].mean():.1f}")
    
    # Risk level counts
    marriage_risk_levels = girls_10_18['MarriageRiskLevel'].value_counts().to_dict()
    print(f"\nRisk Level Breakdown:")
    for level in ['High', 'Medium', 'Low', 'Minimal']:
        count = marriage_risk_levels.get(level, 0)
        print(f"  {level}: {count:,}")
    
    print("\n" + "=" * 60)
    print("CHILD LABOUR RISK ANALYSIS (Children 6-18)")
    print("=" * 60)
    
    # Filter for children 6-18
    children_6_18 = labor_df[
        labor_df['Age Band'].isin(['6-10Y', '11-14Y', '15-18Y'])
    ].copy()
    
    print(f"Children 6-18: {len(children_6_18)}")
    
    # Calculate labour risk scores
    labour_results = children_6_18.apply(calc_child_labour_risk, axis=1)
    children_6_18['LabourRiskScore'] = [r[0] for r in labour_results]
    children_6_18['LabourRiskFactors'] = [r[1] for r in labour_results]
    children_6_18['LabourRiskLevel'] = children_6_18['LabourRiskScore'].apply(get_risk_level)
    
    print(f"\nScore Distribution:")
    print(f"  Score 0 (No risk):    {(children_6_18['LabourRiskScore'] == 0).sum():,}")
    print(f"  Score 1-24 (Low):     {((children_6_18['LabourRiskScore'] > 0) & (children_6_18['LabourRiskScore'] < 25)).sum():,}")
    print(f"  Score 25-49 (Medium): {((children_6_18['LabourRiskScore'] >= 25) & (children_6_18['LabourRiskScore'] < 50)).sum():,}")
    print(f"  Score 50+ (High):     {(children_6_18['LabourRiskScore'] >= 50).sum():,}")
    print(f"\nMax score achieved: {children_6_18['LabourRiskScore'].max()}")
    print(f"Mean score: {children_6_18['LabourRiskScore'].mean():.1f}")
    
    labour_risk_levels = children_6_18['LabourRiskLevel'].value_counts().to_dict()
    print(f"\nRisk Level Breakdown:")
    for level in ['High', 'Medium', 'Low', 'Minimal']:
        count = labour_risk_levels.get(level, 0)
        print(f"  {level}: {count:,}")
    
    print("\n" + "=" * 60)
    print("CHILD TRAFFICKING RISK ANALYSIS (Children 6-18)")
    print("=" * 60)
    
    # Calculate trafficking risk scores
    trafficking_results = children_6_18.apply(calc_child_trafficking_risk, axis=1)
    children_6_18['TraffickingRiskScore'] = [r[0] for r in trafficking_results]
    children_6_18['TraffickingRiskFactors'] = [r[1] for r in trafficking_results]
    children_6_18['TraffickingRiskLevel'] = children_6_18['TraffickingRiskScore'].apply(get_risk_level)
    
    print(f"\nScore Distribution:")
    print(f"  Score 0 (No risk):    {(children_6_18['TraffickingRiskScore'] == 0).sum():,}")
    print(f"  Score 1-24 (Low):     {((children_6_18['TraffickingRiskScore'] > 0) & (children_6_18['TraffickingRiskScore'] < 25)).sum():,}")
    print(f"  Score 25-49 (Medium): {((children_6_18['TraffickingRiskScore'] >= 25) & (children_6_18['TraffickingRiskScore'] < 50)).sum():,}")
    print(f"  Score 50+ (High):     {(children_6_18['TraffickingRiskScore'] >= 50).sum():,}")
    print(f"\nMax score achieved: {children_6_18['TraffickingRiskScore'].max()}")
    print(f"Mean score: {children_6_18['TraffickingRiskScore'].mean():.1f}")
    
    trafficking_risk_levels = children_6_18['TraffickingRiskLevel'].value_counts().to_dict()
    print(f"\nRisk Level Breakdown:")
    for level in ['High', 'Medium', 'Low', 'Minimal']:
        count = trafficking_risk_levels.get(level, 0)
        print(f"  {level}: {count:,}")
    
    # Return data for JSON update
    return {
        'girls_10_18': girls_10_18,
        'children_6_18': children_6_18,
        'marriage_risk_levels': marriage_risk_levels,
        'labour_risk_levels': labour_risk_levels,
        'trafficking_risk_levels': trafficking_risk_levels,
    }


def update_json_with_protection_data(analysis_data):
    """Update the vulnerability JSON with corrected protection data."""
    
    girls = analysis_data['girls_10_18']
    children = analysis_data['children_6_18']
    
    # Load existing data
    with open(OUTPUT_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Update protection vulnerability data
    data['protectionVulnerability'] = {
        'childMarriage': {
            'totalAtRisk': int((girls['MarriageRiskScore'] > 0).sum()),
            'highRisk': int((girls['MarriageRiskLevel'] == 'High').sum()),
            'mediumRisk': int((girls['MarriageRiskLevel'] == 'Medium').sum()),
            'lowRisk': int((girls['MarriageRiskLevel'] == 'Low').sum()),
            'avgScore': float(girls['MarriageRiskScore'].mean()),
            'maxScore': int(girls['MarriageRiskScore'].max()),
            'byRiskLevel': analysis_data['marriage_risk_levels'],
            'byScoreBand': {
                '0': int((girls['MarriageRiskScore'] == 0).sum()),
                '1-24': int(((girls['MarriageRiskScore'] > 0) & (girls['MarriageRiskScore'] < 25)).sum()),
                '25-49': int(((girls['MarriageRiskScore'] >= 25) & (girls['MarriageRiskScore'] < 50)).sum()),
                '50+': int((girls['MarriageRiskScore'] >= 50).sum()),
            }
        },
        'childLabour': {
            'totalAtRisk': int((children['LabourRiskScore'] > 0).sum()),
            'highRisk': int((children['LabourRiskLevel'] == 'High').sum()),
            'mediumRisk': int((children['LabourRiskLevel'] == 'Medium').sum()),
            'lowRisk': int((children['LabourRiskLevel'] == 'Low').sum()),
            'avgScore': float(children['LabourRiskScore'].mean()),
            'maxScore': int(children['LabourRiskScore'].max()),
            'byRiskLevel': analysis_data['labour_risk_levels'],
            'byScoreBand': {
                '0': int((children['LabourRiskScore'] == 0).sum()),
                '1-24': int(((children['LabourRiskScore'] > 0) & (children['LabourRiskScore'] < 25)).sum()),
                '25-49': int(((children['LabourRiskScore'] >= 25) & (children['LabourRiskScore'] < 50)).sum()),
                '50+': int((children['LabourRiskScore'] >= 50).sum()),
            }
        },
        'childTrafficking': {
            'totalAtRisk': int((children['TraffickingRiskScore'] > 0).sum()),
            'highRisk': int((children['TraffickingRiskLevel'] == 'High').sum()),
            'mediumRisk': int((children['TraffickingRiskLevel'] == 'Medium').sum()),
            'lowRisk': int((children['TraffickingRiskLevel'] == 'Low').sum()),
            'avgScore': float(children['TraffickingRiskScore'].mean()),
            'maxScore': int(children['TraffickingRiskScore'].max()),
            'byRiskLevel': analysis_data['trafficking_risk_levels'],
            'byScoreBand': {
                '0': int((children['TraffickingRiskScore'] == 0).sum()),
                '1-24': int(((children['TraffickingRiskScore'] > 0) & (children['TraffickingRiskScore'] < 25)).sum()),
                '25-49': int(((children['TraffickingRiskScore'] >= 25) & (children['TraffickingRiskScore'] < 50)).sum()),
                '50+': int((children['TraffickingRiskScore'] >= 50).sum()),
            }
        }
    }
    
    # Update protection by region
    data['protectionByRegion'] = {}
    for region in children['Region Name'].dropna().unique():
        region_girls = girls[girls['Region Name'] == region]
        region_children = children[children['Region Name'] == region]
        
        data['protectionByRegion'][str(region)] = {
            'childMarriage': {
                'atRisk': int((region_girls['MarriageRiskScore'] > 0).sum()),
                'highRisk': int((region_girls['MarriageRiskLevel'] == 'High').sum()),
                'mediumRisk': int((region_girls['MarriageRiskLevel'] == 'Medium').sum()),
            },
            'childLabour': {
                'atRisk': int((region_children['LabourRiskScore'] > 0).sum()),
                'highRisk': int((region_children['LabourRiskLevel'] == 'High').sum()),
                'mediumRisk': int((region_children['LabourRiskLevel'] == 'Medium').sum()),
            },
            'childTrafficking': {
                'atRisk': int((region_children['TraffickingRiskScore'] > 0).sum()),
                'highRisk': int((region_children['TraffickingRiskLevel'] == 'High').sum()),
                'mediumRisk': int((region_children['TraffickingRiskLevel'] == 'Medium').sum()),
            }
        }
    
    # Update protection by age band
    data['protectionByAgeBand'] = {}
    for age_band in ['6-10Y', '11-14Y', '15-18Y']:
        age_girls = girls[girls['Age Band'] == age_band] if age_band in ['11-14Y', '15-18Y'] else pd.DataFrame()
        age_children = children[children['Age Band'] == age_band]
        
        data['protectionByAgeBand'][age_band] = {
            'childMarriage': {
                'atRisk': int((age_girls['MarriageRiskScore'] > 0).sum()) if len(age_girls) > 0 else 0,
                'highRisk': int((age_girls['MarriageRiskLevel'] == 'High').sum()) if len(age_girls) > 0 else 0,
                'mediumRisk': int((age_girls['MarriageRiskLevel'] == 'Medium').sum()) if len(age_girls) > 0 else 0,
            },
            'childLabour': {
                'atRisk': int((age_children['LabourRiskScore'] > 0).sum()),
                'highRisk': int((age_children['LabourRiskLevel'] == 'High').sum()),
                'mediumRisk': int((age_children['LabourRiskLevel'] == 'Medium').sum()),
            },
            'childTrafficking': {
                'atRisk': int((age_children['TraffickingRiskScore'] > 0).sum()),
                'highRisk': int((age_children['TraffickingRiskLevel'] == 'High').sum()),
                'mediumRisk': int((age_children['TraffickingRiskLevel'] == 'Medium').sum()),
            }
        }
    
    # Add sample high-risk protection cases
    # Child Marriage high risk cases
    marriage_high = girls.nlargest(20, 'MarriageRiskScore')
    data['sampleProtectionCases'] = {
        'childMarriage': [],
        'childLabour': [],
        'childTrafficking': []
    }
    
    for _, row in marriage_high.iterrows():
        data['sampleProtectionCases']['childMarriage'].append({
            'childId': str(row.get('Beneficiary Id', '')),
            'age': str(row.get('Age', '')),
            'ageBand': str(row.get('Age Band', '')),
            'region': str(row.get('Region Name', '')),
            'state': str(row.get('State Name', '')),
            'district': str(row.get('District Name', '')),
            'enrollmentStatus': str(row.get('Enrollment status', '')),
            'score': int(row['MarriageRiskScore']),
            'riskLevel': str(row['MarriageRiskLevel']),
            'riskFactors': row['MarriageRiskFactors'],
        })
    
    # Child Labour high risk cases
    labour_high = children.nlargest(20, 'LabourRiskScore')
    for _, row in labour_high.iterrows():
        data['sampleProtectionCases']['childLabour'].append({
            'childId': str(row.get('Beneficiary Id', '')),
            'age': str(row.get('Age', '')),
            'ageBand': str(row.get('Age Band', '')),
            'gender': str(row.get('Gender', '')),
            'region': str(row.get('Region Name', '')),
            'state': str(row.get('State Name', '')),
            'district': str(row.get('District Name', '')),
            'enrollmentStatus': str(row.get('Enrollment status', '')),
            'economicActivity': str(row.get('Is the child involved in any Economic activities? (with or without wage/ monetary compensation for the child)', '')),
            'score': int(row['LabourRiskScore']),
            'riskLevel': str(row['LabourRiskLevel']),
            'riskFactors': row['LabourRiskFactors'],
        })
    
    # Child Trafficking high risk cases
    trafficking_high = children.nlargest(20, 'TraffickingRiskScore')
    for _, row in trafficking_high.iterrows():
        data['sampleProtectionCases']['childTrafficking'].append({
            'childId': str(row.get('Beneficiary Id', '')),
            'age': str(row.get('Age', '')),
            'ageBand': str(row.get('Age Band', '')),
            'gender': str(row.get('Gender', '')),
            'region': str(row.get('Region Name', '')),
            'state': str(row.get('State Name', '')),
            'district': str(row.get('District Name', '')),
            'migrationStatus': str(row.get('Child migrated in the last 3 months?', '')),
            'score': int(row['TraffickingRiskScore']),
            'riskLevel': str(row['TraffickingRiskLevel']),
            'riskFactors': row['TraffickingRiskFactors'],
        })
    
    # Save updated data
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"\nUpdated {OUTPUT_PATH}")


if __name__ == "__main__":
    print("=" * 60)
    print("PROTECTION VULNERABILITY ANALYSIS")
    print("=" * 60)
    
    analysis_data = analyze_protection_risks()
    
    print("\n" + "=" * 60)
    print("UPDATING JSON DATA")
    print("=" * 60)
    
    update_json_with_protection_data(analysis_data)
    
    print("\nDone!")
