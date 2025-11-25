#!/usr/bin/env python3
"""
Analyze all Excel data to find interesting trends for visualization
"""

import pandas as pd
from pathlib import Path
import numpy as np

BASE_DIR = Path(__file__).parent.parent
EXCEL_DIR = BASE_DIR / 'excel-data'

print("ANALYZING ALL DATA FOR VISUALIZATION OPPORTUNITIES\n")

# Load all data
print("Loading Anganwadi data...")
df_ang_2024 = pd.read_excel(EXCEL_DIR / 'anganwadi-centre-information_2024.xlsx')
df_ang_2023 = pd.read_excel(EXCEL_DIR / 'anganwadi-centre-information_Report_2023.xlsx')

print("Loading Child Annual data...")
df_child_annual_2024 = pd.read_excel(EXCEL_DIR / 'child-annual-information_Report_2024.xlsx')
df_child_annual_2023 = pd.read_excel(EXCEL_DIR / 'Child_Annual_2023.xlsx')

print("Loading Child Education data...")
df_child_edu_2024 = pd.read_excel(EXCEL_DIR / 'child-education_Consolidated_2024.xlsx')
df_child_edu_2023 = pd.read_excel(EXCEL_DIR / 'Child_education_Consolidated-2023.xlsx')

print("Loading School data...")
df_school_2024 = pd.read_excel(EXCEL_DIR / 'school-level-information_2024.xlsx')
df_school_2023 = pd.read_excel(EXCEL_DIR / 'school-level-information_2023.xlsx')

print("\n" + "="*80)
print("POTENTIAL VISUALIZATIONS")
print("="*80)

# 1. Age Distribution Analysis
print("\n1. AGE DISTRIBUTION OF CHILDREN")
print("-" * 40)
if 'Age Band' in df_child_annual_2024.columns:
    age_dist = df_child_annual_2024['Age Band'].value_counts()
    print(f"Age bands available: {age_dist.to_dict()}")
    print("[OK] Can create: Age Band Distribution (Bar/Pie chart)")

if 'Age' in df_child_annual_2024.columns:
    try:
        age_numeric = pd.to_numeric(df_child_annual_2024['Age'], errors='coerce')
        print(f"Age range: {age_numeric.min()} - {age_numeric.max()}")
        print("[OK] Can create: Age Histogram by Gender")
    except:
        print("Age column contains non-numeric values")

# 2. Educational Enrollment Status
print("\n2. EDUCATION ENROLLMENT STATUS")
print("-" * 40)
if 'If enrolled, enrollment status' in df_child_edu_2024.columns:
    enrollment = df_child_edu_2024['If enrolled, enrollment status'].value_counts()
    print(f"Enrollment statuses: {enrollment.to_dict()}")
    print("[OK] Can create: Enrollment Status Distribution")

if 'If dropout primary reason' in df_child_edu_2024.columns:
    dropout_reasons = df_child_edu_2024['If dropout primary reason'].dropna().value_counts()
    print(f"\nDropout reasons (top 5):")
    print(dropout_reasons.head())
    print("[OK] Can create: Dropout Reasons Analysis (Bar chart)")

# 3. School Infrastructure
print("\n3. SCHOOL INFRASTRUCTURE & FACILITIES")
print("-" * 40)
facilities = [
    'School building available', 'Toilet for children', 'Separate Toilet for Girls',
    'Libraray available', 'Playground available', 'Availablity of Drinking Water',
    'Availability of Electricity', 'Mid Day meal cook available'
]
available_facilities = [f for f in facilities if f in df_school_2024.columns]
print(f"Facility columns available: {len(available_facilities)}")
if available_facilities:
    print("[OK] Can create: School Infrastructure Availability (Radar/Bar chart)")
    # Count Yes/No for each facility
    for fac in available_facilities[:3]:
        counts = df_school_2024[fac].value_counts()
        print(f"  {fac}: {counts.to_dict()}")

# 4. Teacher Statistics
print("\n4. TEACHER STATISTICS")
print("-" * 40)
if 'Total Male teachers' in df_school_2024.columns and 'Total Female teachers' in df_school_2024.columns:
    total_male = df_school_2024['Total Male teachers'].sum()
    total_female = df_school_2024['Total Female teachers'].sum()
    print(f"Total Male Teachers: {total_male}")
    print(f"Total Female Teachers: {total_female}")
    print("[OK] Can create: Teacher Gender Distribution")

if 'Number of permanent teachers' in df_school_2024.columns and 'Number of contractual teachers' in df_school_2024.columns:
    permanent = df_school_2024['Number of permanent teachers'].sum()
    contractual = df_school_2024['Number of contractual teachers'].sum()
    print(f"Permanent: {permanent}, Contractual: {contractual}")
    print("[OK] Can create: Teacher Employment Type Distribution")

# 5. Caste Distribution
print("\n5. CASTE-WISE DISTRIBUTION")
print("-" * 40)
caste_cols = ['Total SC Boys', 'Total SC Girls', 'Total ST Boys', 'Total ST Girls', 
              'Total OBC Boys', 'Total OBC Girls', 'Total Other Boys (Caste)', 'Total Other Girls (Caste)']
if all(col in df_school_2024.columns for col in caste_cols):
    sc_total = df_school_2024['Total SC Boys'].sum() + df_school_2024['Total SC Girls'].sum()
    st_total = df_school_2024['Total ST Boys'].sum() + df_school_2024['Total ST Girls'].sum()
    obc_total = df_school_2024['Total OBC Boys'].sum() + df_school_2024['Total OBC Girls'].sum()
    other_total = df_school_2024['Total Other Boys (Caste)'].sum() + df_school_2024['Total Other Girls (Caste)'].sum()
    print(f"SC: {sc_total}, ST: {st_total}, OBC: {obc_total}, Other: {other_total}")
    print("[OK] Can create: Caste-wise Student Distribution (Stacked Bar)")

# 6. Religion Distribution
print("\n6. RELIGION-WISE DISTRIBUTION")
print("-" * 40)
religion_cols = ['Total Hindu Boys', 'Total Hindu Girls', 'Total Muslim Boys', 'Total Muslim Girls',
                 'Total Christian Boys', 'Total Christian Girls']
if all(col in df_school_2024.columns for col in religion_cols[:4]):
    hindu = df_school_2024['Total Hindu Boys'].sum() + df_school_2024['Total Hindu Girls'].sum()
    muslim = df_school_2024['Total Muslim Boys'].sum() + df_school_2024['Total Muslim Girls'].sum()
    christian = df_school_2024['Total Christian Boys'].sum() + df_school_2024['Total Christian Girls'].sum()
    print(f"Hindu: {hindu}, Muslim: {muslim}, Christian: {christian}")
    print("[OK] Can create: Religion-wise Distribution (Pie/Donut chart)")

# 7. Anganwadi Services
print("\n7. ANGANWADI SERVICES AVAILABILITY")
print("-" * 40)
ang_services = [
    'Immunization service available', 'Health check up service available',
    'Cooked Food Available', 'Take Home Ration Available',
    'Pre-school Education Kits/ material available'
]
available_ang = [s for s in ang_services if s in df_ang_2024.columns]
if available_ang:
    print(f"Service columns available: {len(available_ang)}")
    print("[OK] Can create: Anganwadi Services Coverage (Heatmap/Bar)")
    for svc in available_ang[:3]:
        counts = df_ang_2024[svc].value_counts()
        print(f"  {svc}: {counts.to_dict()}")

# 8. Special Needs Children
print("\n8. CHILDREN WITH SPECIAL NEEDS")
print("-" * 40)
if 'Total number of Boys with special needs' in df_school_2024.columns:
    boys_special = df_school_2024['Total number of Boys with special needs'].sum()
    girls_special = df_school_2024['Total number of Girls with special needs'].sum()
    total_special = df_school_2024['Total No of Children with special need'].sum()
    print(f"Boys: {boys_special}, Girls: {girls_special}, Total: {total_special}")
    print("[OK] Can create: Special Needs Children Distribution")

# 9. School Type Analysis
print("\n9. SCHOOL TYPE DISTRIBUTION")
print("-" * 40)
if 'Type of School' in df_school_2024.columns:
    school_types = df_school_2024['Type of School'].value_counts()
    print(school_types)
    print("[OK] Can create: School Type Distribution (Pie)")

if 'Category of School' in df_school_2024.columns:
    school_cats = df_school_2024['Category of School'].value_counts()
    print(f"\nSchool Categories: {school_cats.to_dict()}")

# 10. Year-over-Year Comparison
print("\n10. YEAR-OVER-YEAR TRENDS (2023 vs 2024)")
print("-" * 40)
if 'State Name' in df_school_2024.columns and 'State Name' in df_school_2023.columns:
    states_2023 = len(df_school_2023['State Name'].unique())
    states_2024 = len(df_school_2024['State Name'].unique())
    schools_2023 = len(df_school_2023)
    schools_2024 = len(df_school_2024)
    print(f"2023: {schools_2023} schools across {states_2023} states")
    print(f"2024: {schools_2024} schools across {states_2024} states")
    print("[OK] Can create: Year-over-Year Growth Analysis")

print("\n" + "="*80)
print("RECOMMENDED NEW VISUALIZATIONS:")
print("="*80)
print("""
1. [*] Age Band Distribution (Bar/Pyramid) - Shows child age groups
2. [*] Dropout Reasons Analysis (Horizontal Bar) - Key education insights
3. [*] School Infrastructure Dashboard (Multi-bar) - Facility availability
4. [*] Teacher Demographics (Pie + Bar) - Gender & employment type
5. [*] Caste-wise Enrollment (Stacked Bar by State) - Social equity
6. [*] Religion Distribution (Donut Chart) - Diversity insights
7. [*] Anganwadi Services Heatmap - Service coverage by state
8. [*] Special Needs Support (Gauge/Bar) - Inclusive education metrics
9. [+] School Type Comparison (Pie + Bar) - Government vs Private
10. [+] Parent Education Level (Bar) - Father vs Mother education
""")
