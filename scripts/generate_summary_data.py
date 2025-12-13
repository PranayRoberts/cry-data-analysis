"""
Generate summary/aggregated data files from the full ORIGINAL data files.
This creates smaller JSON files with pre-computed statistics that the browser can handle.
"""

import json
import os
from collections import defaultdict


def safe_str(value, default='Unknown'):
    """Safely convert value to string, handling None."""
    if value is None:
        return default
    return str(value)


def safe_lower(value):
    """Safely convert value to lowercase string."""
    if value is None:
        return ''
    return str(value).lower()


def load_json_file(filepath):
    """Load a JSON file."""
    print(f"Loading {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json_file(filepath, data):
    """Save data to a JSON file."""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print(f"Saved {filepath}")


def flatten_data(data):
    """Flatten data that may be organized by year keys into a single list with Year field."""
    if isinstance(data, list):
        return data
    
    all_records = []
    for key, records in data.items():
        # Extract year from key (e.g., "Child_Annual_2023.xlsx_..." -> 2023)
        year = None
        if '2023' in key:
            year = 2023
        elif '2024' in key:
            year = 2024
        elif '2025' in key:
            year = 2025
        
        if isinstance(records, list):
            for record in records:
                if year and 'Year' not in record:
                    record['Year'] = year
                all_records.append(record)
    
    return all_records


def generate_child_annual_summary(data):
    """Generate summary statistics from child annual data."""
    summary = {
        'totalRecords': len(data),
        'byYear': defaultdict(lambda: {'count': 0, 'boys': 0, 'girls': 0}),
        'byState': defaultdict(lambda: {'count': 0, 'boys': 0, 'girls': 0}),
        'byRegion': defaultdict(lambda: {'count': 0, 'boys': 0, 'girls': 0}),
        'byDistrict': defaultdict(lambda: {'count': 0, 'boys': 0, 'girls': 0}),
        'byProject': defaultdict(lambda: {'count': 0, 'boys': 0, 'girls': 0}),
        'byAgeBand': defaultdict(int),
        'byFacilityType': defaultdict(int),
        'byLocationType': defaultdict(int),
        'bySocialCategory': defaultdict(int),
        'byReligion': defaultdict(int),
        'byEducationalStatus': defaultdict(int),
        'byDropoutReason': defaultdict(int),
        'specialNeeds': {'yes': 0, 'no': 0},
        'stateYearData': defaultdict(lambda: defaultdict(lambda: {'count': 0, 'boys': 0, 'girls': 0})),
        'regionYearData': defaultdict(lambda: defaultdict(lambda: {'count': 0, 'boys': 0, 'girls': 0})),
        'districtYearData': defaultdict(lambda: defaultdict(lambda: {'count': 0, 'boys': 0, 'girls': 0})),
        'regionDistrictMap': defaultdict(set),  # Map regions to their districts
        'sampleRecords': []  # Keep a sample for display purposes
    }
    
    # Collect sample records (first 100 from each year)
    year_samples = defaultdict(list)
    
    for record in data:
        year = safe_str(record.get('Year', 'Unknown'))
        state = safe_str(record.get('State', record.get('State Name', 'Unknown')))
        region = safe_str(record.get('Region Name', record.get('Region', 'Unknown')))
        district = safe_str(record.get('District Name', record.get('District', 'Unknown')))
        project = safe_str(record.get('Project', record.get('Project Name', 'Unknown')))
        gender = safe_lower(record.get('Gender', record.get('Gender_x', '')))
        
        is_male = gender in ['male', 'm', 'boy']
        is_female = gender in ['female', 'f', 'girl']
        
        # Year counts
        summary['byYear'][year]['count'] += 1
        if is_male:
            summary['byYear'][year]['boys'] += 1
        elif is_female:
            summary['byYear'][year]['girls'] += 1
        
        # State counts
        summary['byState'][state]['count'] += 1
        if is_male:
            summary['byState'][state]['boys'] += 1
        elif is_female:
            summary['byState'][state]['girls'] += 1
        
        # Region counts
        summary['byRegion'][region]['count'] += 1
        if is_male:
            summary['byRegion'][region]['boys'] += 1
        elif is_female:
            summary['byRegion'][region]['girls'] += 1
        
        # District counts
        summary['byDistrict'][district]['count'] += 1
        if is_male:
            summary['byDistrict'][district]['boys'] += 1
        elif is_female:
            summary['byDistrict'][district]['girls'] += 1
        
        # State-Year combined
        summary['stateYearData'][state][year]['count'] += 1
        if is_male:
            summary['stateYearData'][state][year]['boys'] += 1
        elif is_female:
            summary['stateYearData'][state][year]['girls'] += 1
        
        # Region-Year combined
        summary['regionYearData'][region][year]['count'] += 1
        if is_male:
            summary['regionYearData'][region][year]['boys'] += 1
        elif is_female:
            summary['regionYearData'][region][year]['girls'] += 1
        
        # District-Year combined
        summary['districtYearData'][district][year]['count'] += 1
        if is_male:
            summary['districtYearData'][district][year]['boys'] += 1
        elif is_female:
            summary['districtYearData'][district][year]['girls'] += 1
        
        # Map regions to their districts
        if region != 'Unknown' and district != 'Unknown':
            summary['regionDistrictMap'][region].add(district)
        
        # Project counts
        summary['byProject'][project]['count'] += 1
        if is_male:
            summary['byProject'][project]['boys'] += 1
        elif is_female:
            summary['byProject'][project]['girls'] += 1
        
        # Age band
        age_band = record.get('Age Band', record.get('AgeBand', 'Unknown'))
        summary['byAgeBand'][safe_str(age_band)] += 1
        
        # Facility type
        facility = record.get('Facility Type', record.get('FacilityType', 'Unknown'))
        summary['byFacilityType'][safe_str(facility)] += 1
        
        # Location type
        location = record.get('Location Type', record.get('LocationType', 'Unknown'))
        summary['byLocationType'][safe_str(location)] += 1
        
        # Social category
        social = record.get('Social Category', record.get('SocialCategory', 'Unknown'))
        summary['bySocialCategory'][safe_str(social)] += 1
        
        # Religion
        religion = record.get('Religion', 'Unknown')
        summary['byReligion'][safe_str(religion)] += 1
        
        # Educational status
        edu_status = record.get('Educational Status', record.get('EducationalStatus', 'Unknown'))
        summary['byEducationalStatus'][safe_str(edu_status)] += 1
        
        # Dropout reason
        dropout = record.get('Dropout Reason', record.get('DropoutReason', ''))
        dropout_str = safe_str(dropout, '')
        if dropout_str and dropout_str.lower() not in ['', 'nan', 'none', 'null', 'unknown']:
            summary['byDropoutReason'][dropout_str] += 1
        
        # Special needs
        special = record.get('Special Need', record.get('SpecialNeed', 'No'))
        if safe_lower(special) in ['yes', 'y', 'true', '1']:
            summary['specialNeeds']['yes'] += 1
        else:
            summary['specialNeeds']['no'] += 1
        
        # Collect samples
        if len(year_samples[year]) < 100:
            year_samples[year].append(record)
    
    # Convert defaultdicts to regular dicts
    summary['byYear'] = dict(summary['byYear'])
    summary['byState'] = dict(summary['byState'])
    summary['byRegion'] = dict(summary['byRegion'])
    summary['byDistrict'] = dict(summary['byDistrict'])
    summary['byProject'] = dict(summary['byProject'])
    summary['byAgeBand'] = dict(summary['byAgeBand'])
    summary['byFacilityType'] = dict(summary['byFacilityType'])
    summary['byLocationType'] = dict(summary['byLocationType'])
    summary['bySocialCategory'] = dict(summary['bySocialCategory'])
    summary['byReligion'] = dict(summary['byReligion'])
    summary['byEducationalStatus'] = dict(summary['byEducationalStatus'])
    summary['byDropoutReason'] = dict(summary['byDropoutReason'])
    summary['stateYearData'] = {k: dict(v) for k, v in summary['stateYearData'].items()}
    summary['regionYearData'] = {k: dict(v) for k, v in summary['regionYearData'].items()}
    summary['districtYearData'] = {k: dict(v) for k, v in summary['districtYearData'].items()}
    # Convert sets to lists for JSON serialization
    summary['regionDistrictMap'] = {k: sorted(list(v)) for k, v in summary['regionDistrictMap'].items()}
    
    # Add sample records
    for year, samples in year_samples.items():
        summary['sampleRecords'].extend(samples)
    
    return summary


def generate_child_education_summary(data):
    """Generate summary statistics from child education data."""
    summary = {
        'totalRecords': len(data),
        'byYear': defaultdict(lambda: {'count': 0, 'boys': 0, 'girls': 0}),
        'byState': defaultdict(lambda: {'count': 0, 'boys': 0, 'girls': 0}),
        'byProject': defaultdict(lambda: {'count': 0, 'boys': 0, 'girls': 0}),
        'byGrade': defaultdict(int),
        'bySchoolType': defaultdict(int),
        'byMediumOfInstruction': defaultdict(int),
        'byBoardOfEducation': defaultdict(int),
        'byAttendanceRate': {'excellent': 0, 'good': 0, 'average': 0, 'poor': 0},
        'byPerformance': defaultdict(int),
        'stateYearData': defaultdict(lambda: defaultdict(lambda: {'count': 0, 'boys': 0, 'girls': 0})),
        'sampleRecords': []
    }
    
    year_samples = defaultdict(list)
    
    for record in data:
        year = safe_str(record.get('Year', 'Unknown'))
        state = safe_str(record.get('State', record.get('State Name', 'Unknown')))
        project = safe_str(record.get('Project', record.get('Project Name', 'Unknown')))
        gender = safe_lower(record.get('Gender', record.get('Gender_x', '')))
        
        is_male = gender in ['male', 'm', 'boy']
        is_female = gender in ['female', 'f', 'girl']
        
        # Year counts
        summary['byYear'][year]['count'] += 1
        if is_male:
            summary['byYear'][year]['boys'] += 1
        elif is_female:
            summary['byYear'][year]['girls'] += 1
        
        # State counts
        summary['byState'][state]['count'] += 1
        if is_male:
            summary['byState'][state]['boys'] += 1
        elif is_female:
            summary['byState'][state]['girls'] += 1
        
        # State-Year combined
        summary['stateYearData'][state][year]['count'] += 1
        if is_male:
            summary['stateYearData'][state][year]['boys'] += 1
        elif is_female:
            summary['stateYearData'][state][year]['girls'] += 1
        
        # Project counts
        summary['byProject'][project]['count'] += 1
        if is_male:
            summary['byProject'][project]['boys'] += 1
        elif is_female:
            summary['byProject'][project]['girls'] += 1
        
        # Grade
        grade = record.get('Grade', record.get('Class', record.get('Current Class', 'Unknown')))
        summary['byGrade'][safe_str(grade)] += 1
        
        # School type
        school_type = record.get('School Type', record.get('SchoolType', record.get('Type of School', 'Unknown')))
        summary['bySchoolType'][safe_str(school_type)] += 1
        
        # Medium of instruction
        medium = record.get('Medium of Instruction', record.get('MediumOfInstruction', 'Unknown'))
        summary['byMediumOfInstruction'][safe_str(medium)] += 1
        
        # Board of education
        board = record.get('Board of Education', record.get('BoardOfEducation', 'Unknown'))
        summary['byBoardOfEducation'][safe_str(board)] += 1
        
        # Attendance rate categorization
        attendance = record.get('Attendance Rate', record.get('AttendanceRate', 0))
        try:
            att_val = float(attendance) if attendance else 0
            if att_val >= 90:
                summary['byAttendanceRate']['excellent'] += 1
            elif att_val >= 75:
                summary['byAttendanceRate']['good'] += 1
            elif att_val >= 50:
                summary['byAttendanceRate']['average'] += 1
            else:
                summary['byAttendanceRate']['poor'] += 1
        except (ValueError, TypeError):
            pass
        
        # Performance
        performance = record.get('Performance', record.get('AcademicPerformance', 'Unknown'))
        summary['byPerformance'][safe_str(performance)] += 1
        
        # Collect samples
        if len(year_samples[year]) < 100:
            year_samples[year].append(record)
    
    # Convert defaultdicts to regular dicts
    summary['byYear'] = dict(summary['byYear'])
    summary['byState'] = dict(summary['byState'])
    summary['byProject'] = dict(summary['byProject'])
    summary['byGrade'] = dict(summary['byGrade'])
    summary['bySchoolType'] = dict(summary['bySchoolType'])
    summary['byMediumOfInstruction'] = dict(summary['byMediumOfInstruction'])
    summary['byBoardOfEducation'] = dict(summary['byBoardOfEducation'])
    summary['byPerformance'] = dict(summary['byPerformance'])
    summary['stateYearData'] = {k: dict(v) for k, v in summary['stateYearData'].items()}
    
    # Add sample records
    for year, samples in year_samples.items():
        summary['sampleRecords'].extend(samples)
    
    return summary


def main():
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_path, 'public', 'data')
    
    # Process Child Annual Data
    child_annual_original = os.path.join(data_path, 'child_annual_data_ORIGINAL.json')
    if os.path.exists(child_annual_original):
        child_annual_raw = load_json_file(child_annual_original)
        child_annual_data = flatten_data(child_annual_raw)
        del child_annual_raw  # Free memory
        
        print(f"Processing {len(child_annual_data)} child annual records...")
        child_annual_summary = generate_child_annual_summary(child_annual_data)
        
        # Save summary
        summary_path = os.path.join(data_path, 'child_annual_data.json')
        save_json_file(summary_path, child_annual_summary)
        print(f"Child Annual Summary: {child_annual_summary['totalRecords']} total records")
        print(f"  By Year: {child_annual_summary['byYear']}")
        
        # Free memory
        del child_annual_data
    
    # Process Child Education Data
    child_edu_original = os.path.join(data_path, 'child_education_data_ORIGINAL.json')
    if os.path.exists(child_edu_original):
        child_edu_raw = load_json_file(child_edu_original)
        child_edu_data = flatten_data(child_edu_raw)
        del child_edu_raw  # Free memory
        
        print(f"\nProcessing {len(child_edu_data)} child education records...")
        child_edu_summary = generate_child_education_summary(child_edu_data)
        
        # Save summary
        summary_path = os.path.join(data_path, 'child_education_data.json')
        save_json_file(summary_path, child_edu_summary)
        print(f"Child Education Summary: {child_edu_summary['totalRecords']} total records")
        print(f"  By Year: {child_edu_summary['byYear']}")
        
        # Free memory
        del child_edu_data
    
    print("\n Summary data files generated successfully!")
    print("The dashboard will now load pre-aggregated data instead of raw records.")


if __name__ == '__main__':
    main()
