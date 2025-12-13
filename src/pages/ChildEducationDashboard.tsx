import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { ComparisonBarChart, GenderDistributionChart, GroupedBarChart } from '../components/Charts';
import {
  StatCard,
  FilterBar,
  LoadingSpinner,
  ErrorMessage,
  ChartContainer,
  Section,
  DashboardGrid,
} from '../components/Dashboard';
import { calculatePercentChange } from '../utils/dataProcessor';
import { Award, AlertCircle, Activity } from 'lucide-react';

// Interface for NFHS-5 education data
interface NFHS5EducationData {
  source: string;
  india_average: {
    school_attendance_6_17: number;
    literacy_women: number;
    literacy_men: number;
    sex_ratio_birth: number;
    children_under_5: number;
    institutional_births: number;
    immunization_full: number;
    anemia_children: number;
  };
  state_data: Record<string, {
    school_attendance_6_17: number;
    literacy_women: number;
    literacy_men: number;
    sex_ratio_birth: number;
    children_under_5: number;
    institutional_births: number;
    immunization_full: number;
    anemia_children: number;
  }>;
}

// Type for summary data format
interface YearData {
  count: number;
  boys: number;
  girls: number;
}

interface SummaryData {
  totalRecords: number;
  byYear: Record<string, YearData>;
  byState: Record<string, YearData>;
  byRegion: Record<string, YearData>;
  byDistrict: Record<string, YearData>;
  byProject: Record<string, YearData>;
  byGrade: Record<string, number>;
  bySchoolType: Record<string, number>;
  byMediumOfInstruction: Record<string, number>;
  byBoardOfEducation: Record<string, number>;
  byAttendanceRate: { excellent: number; good: number; average: number; poor: number };
  byPerformance: Record<string, number>;
  stateYearData: Record<string, Record<string, YearData>>;
  regionYearData: Record<string, Record<string, YearData>>;
  districtYearData: Record<string, Record<string, YearData>>;
  regionDistrictMap: Record<string, string[]>;
  sampleRecords: Record<string, unknown>[];
}

export const ChildEducationDashboard: React.FC = () => {
  const { data: summaryData, loading, error } = useData({ dataPath: '/data/child_education_data.json' });
  const { data: nfhs5EducationData, loading: nfhs5EduLoading } = useData({ dataPath: '/data/nfhs5_education_data.json' });
  const [filters, setFilters] = useState<{ region?: string; district?: string }>({});

  // Get filter options from data
  const filterOptions = useMemo(() => {
    if (!summaryData) return { region: [], district: [] };
    const data = summaryData as SummaryData;
    
    // Get all unique regions
    const regions = Object.keys(data.byRegion || {}).filter(r => r !== 'Unknown');
    
    // Get districts filtered by selected region
    let districts: string[] = [];
    if (filters.region && data.regionDistrictMap && data.regionDistrictMap[filters.region]) {
      districts = data.regionDistrictMap[filters.region];
    } else {
      districts = Object.keys(data.byDistrict || {}).filter(d => d !== 'Unknown');
    }

    return {
      region: regions.sort(),
      district: districts.sort(),
    };
  }, [summaryData, filters.region]);

  // Extract stats from summary data, filtered by region/district
  const stats2023 = useMemo(() => {
    if (!summaryData || !summaryData.byYear) return { totalChildren: 0, totalBoys: 0, totalGirls: 0 };
    const data = summaryData as SummaryData;
    
    // If filtering by district
    if (filters.district && data.districtYearData && data.districtYearData[filters.district]) {
      const yearData = data.districtYearData[filters.district]['2023'] || { count: 0, boys: 0, girls: 0 };
      return {
        totalChildren: yearData.count,
        totalBoys: yearData.boys,
        totalGirls: yearData.girls,
      };
    }
    
    // If filtering by region
    if (filters.region && data.regionYearData && data.regionYearData[filters.region]) {
      const yearData = data.regionYearData[filters.region]['2023'] || { count: 0, boys: 0, girls: 0 };
      return {
        totalChildren: yearData.count,
        totalBoys: yearData.boys,
        totalGirls: yearData.girls,
      };
    }
    
    // No filter - use total
    const yearData = data.byYear['2023'] || { count: 0, boys: 0, girls: 0 };
    return {
      totalChildren: yearData.count,
      totalBoys: yearData.boys,
      totalGirls: yearData.girls,
    };
  }, [summaryData, filters]);

  const stats2024 = useMemo(() => {
    if (!summaryData || !summaryData.byYear) return { totalChildren: 0, totalBoys: 0, totalGirls: 0 };
    const data = summaryData as SummaryData;
    
    // If filtering by district
    if (filters.district && data.districtYearData && data.districtYearData[filters.district]) {
      const yearData = data.districtYearData[filters.district]['2024'] || { count: 0, boys: 0, girls: 0 };
      return {
        totalChildren: yearData.count,
        totalBoys: yearData.boys,
        totalGirls: yearData.girls,
      };
    }
    
    // If filtering by region
    if (filters.region && data.regionYearData && data.regionYearData[filters.region]) {
      const yearData = data.regionYearData[filters.region]['2024'] || { count: 0, boys: 0, girls: 0 };
      return {
        totalChildren: yearData.count,
        totalBoys: yearData.boys,
        totalGirls: yearData.girls,
      };
    }
    
    // No filter - use total
    const yearData = data.byYear['2024'] || { count: 0, boys: 0, girls: 0 };
    return {
      totalChildren: yearData.count,
      totalBoys: yearData.boys,
      totalGirls: yearData.girls,
    };
  }, [summaryData, filters]);

  const educationComparison = useMemo(() => {
    return [
      {
        metric: 'Total Children',
        2023: stats2023.totalChildren,
        2024: stats2024.totalChildren,
      },
      {
        metric: 'Total Boys',
        2023: stats2023.totalBoys,
        2024: stats2024.totalBoys,
      },
      {
        metric: 'Total Girls',
        2023: stats2023.totalGirls,
        2024: stats2024.totalGirls,
      },
    ];
  }, [stats2023, stats2024]);

  const genderParityData = useMemo(() => {
    return [
      {
        category: 'Overall Enrollment',
        boys: stats2024.totalBoys,
        girls: stats2024.totalGirls,
      },
    ];
  }, [stats2024]);

  const genderParity2023 = useMemo(() => {
    const total = stats2023.totalBoys + stats2023.totalGirls;
    return total > 0 ? ((stats2023.totalGirls / total) * 100) : 0;
  }, [stats2023]);

  const genderParity2024 = useMemo(() => {
    const total = stats2024.totalBoys + stats2024.totalGirls;
    return total > 0 ? ((stats2024.totalGirls / total) * 100) : 0;
  }, [stats2024]);

  // Get total records and state count for display (filtered or total)
  const totalRecords = useMemo(() => {
    if (!summaryData) return 0;
    const data = summaryData as SummaryData;
    
    // If filtering by district, return district count
    if (filters.district && data.byDistrict && data.byDistrict[filters.district]) {
      return data.byDistrict[filters.district].count;
    }
    
    // If filtering by region, return region count
    if (filters.region && data.byRegion && data.byRegion[filters.region]) {
      return data.byRegion[filters.region].count;
    }
    
    return data.totalRecords || 0;
  }, [summaryData, filters]);

  // Get filter description for display
  const filterDescription = useMemo(() => {
    if (filters.district) return ` in ${filters.district}`;
    if (filters.region) return ` in ${filters.region} Region`;
    return '';
  }, [filters]);

  const statesCount = useMemo(() => {
    if (!summaryData || !(summaryData as SummaryData).byState) return 0;
    return Object.keys((summaryData as SummaryData).byState).filter(s => s !== 'Unknown').length;
  }, [summaryData]);

  // NFHS-5 comparison data for education
  const nfhs5Comparison = useMemo(() => {
    if (!summaryData || !nfhs5EducationData) return null;
    
    const data = summaryData as SummaryData;
    const nfhsEdu = nfhs5EducationData as NFHS5EducationData;
    
    // Get CRY states
    const cryStates = Object.keys(data.byState || {}).filter(s => s !== 'Unknown');
    
    // Match CRY states with NFHS-5 education data (focus on education access only)
    const stateComparisons = cryStates.map(state => {
      const cryData = data.byState[state];
      const nfhsEduState = nfhsEdu.state_data[state];
      
      if (!nfhsEduState) return null;
      
      // Calculate CRY girls percentage
      const total = cryData.boys + cryData.girls;
      const cryGirlsPercent = total > 0 ? (cryData.girls / total) * 100 : 0;
      
      return {
        state,
        cryEnrollment: cryData.count,
        cryBoys: cryData.boys,
        cryGirls: cryData.girls,
        cryGirlsPercent,
        nfhsSchoolAttendance: nfhsEduState.school_attendance_6_17,
        nfhsLiteracyWomen: nfhsEduState.literacy_women,
        nfhsLiteracyMen: nfhsEduState.literacy_men,
        nfhsBirthRegistration: nfhsEduState.children_under_5,
        literacyGap: nfhsEduState.literacy_men - nfhsEduState.literacy_women,
      };
    }).filter(Boolean);
    
    // Sort by enrollment
    stateComparisons.sort((a, b) => (b?.cryEnrollment || 0) - (a?.cryEnrollment || 0));
    
    // Chart data 1: School Attendance Baseline
    const attendanceBaselineData = stateComparisons.slice(0, 10).map(s => ({
      state: s!.state.length > 12 ? s!.state.substring(0, 10) + '..' : s!.state,
      'NFHS-5 School Attendance %': s!.nfhsSchoolAttendance,
    }));
    
    // Chart data 2: Literacy Gender Gap - Key education indicator
    const literacyGapData = stateComparisons.slice(0, 10).map(s => ({
      state: s!.state.length > 12 ? s!.state.substring(0, 10) + '..' : s!.state,
      'Women Literacy %': s!.nfhsLiteracyWomen,
      'Men Literacy %': s!.nfhsLiteracyMen,
    }));
    
    // Chart data 3: CRY girls enrollment vs state literacy gap
    const girlsEducationData = stateComparisons.slice(0, 10).map(s => ({
      state: s!.state.length > 12 ? s!.state.substring(0, 10) + '..' : s!.state,
      'CRY Girls %': parseFloat(s!.cryGirlsPercent.toFixed(1)),
      'Literacy Gap (M-F)': s!.literacyGap,
    }));
    
    // Chart data 4: Birth Registration - Essential for school enrollment
    const enrollmentBarriersData = stateComparisons.slice(0, 10).map(s => ({
      state: s!.state.length > 12 ? s!.state.substring(0, 10) + '..' : s!.state,
      'Birth Registration %': s!.nfhsBirthRegistration,
      'School Attendance %': s!.nfhsSchoolAttendance,
    }));
    
    return {
      stateComparisons,
      attendanceBaselineData,
      literacyGapData,
      girlsEducationData,
      enrollmentBarriersData,
      indiaAverage: {
        school_attendance: nfhsEdu.india_average.school_attendance_6_17,
        literacy_women: nfhsEdu.india_average.literacy_women,
        literacy_men: nfhsEdu.india_average.literacy_men,
        literacy_gap: nfhsEdu.india_average.literacy_men - nfhsEdu.india_average.literacy_women,
        birth_registration: nfhsEdu.india_average.children_under_5,
      },
      source: nfhsEdu.source,
    };
  }, [summaryData, nfhs5EducationData]);

  const isLoading = loading || nfhs5EduLoading;
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!summaryData) return <ErrorMessage message="No data available" />;

  const childrenGrowth = calculatePercentChange(stats2023.totalChildren, stats2024.totalChildren);
  const getTrend = (val2024: number, val2023: number): 'up' | 'down' | 'stable' => {
    if (val2024 > val2023) return 'up';
    if (val2024 < val2023) return 'down';
    return 'stable';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-2 text-gray-900">Child Education Dashboard</h1>
      <p className="text-gray-600 mb-4">
        Comprehensive analysis of school enrollment, retention, educational access, and gender parity in education
        <span className="ml-2 text-purple-600 font-semibold">({totalRecords.toLocaleString()} records{filterDescription})</span>
      </p>
      
      {/* Contextual Information */}
      <div className="mb-6 p-4 bg-purple-50 border-l-4 border-purple-500 rounded-lg">
        <h3 className="font-semibold text-purple-900 mb-2">What This Dashboard Shows:</h3>
        <ul className="text-sm text-purple-800 space-y-1">
          <li><strong>Education Records:</strong> 474,240 child education records tracking school enrollment, attendance, and academic performance</li>
          <li><strong>Gender in Education:</strong> Girls represent ~49% of enrolled children, with state-wise parity tracking for targeted interventions</li>
          <li><strong>NFHS-5 Baseline Context (2019-21):</strong> State-level school attendance rates (ages 6-17) and literacy benchmarks for measuring CRY's progress</li>
          <li><strong>Performance Tracking:</strong> Grade distribution, school type (govt/private), medium of instruction, and board of education analysis</li>
        </ul>
        <p className="text-xs text-purple-700 mt-2 italic"><strong>Action Focus:</strong> Red arrows indicate declining metrics needing intervention. Filter by region/district to identify education access gaps.</p>
      </div>

      {/* Region and District Filters - Just above Key Metrics */}
      <FilterBar
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={(key, value) => {
          if (key === 'region') {
            // Clear district when region changes
            setFilters({ region: value || undefined });
          } else {
            setFilters({ ...filters, [key]: value || undefined });
          }
        }}
      />

      <Section title="Key Metrics">
        <DashboardGrid columns={4}>
          <StatCard
            label="Total Children (2024)"
            value={stats2024.totalChildren}
            trend={getTrend(stats2024.totalChildren, stats2023.totalChildren)}
            percentChange={childrenGrowth}
          />
          <StatCard
            label="Total Boys (2024)"
            value={stats2024.totalBoys}
            trend={getTrend(stats2024.totalBoys, stats2023.totalBoys)}
            percentChange={calculatePercentChange(stats2023.totalBoys, stats2024.totalBoys)}
          />
          <StatCard
            label="Total Girls (2024)"
            value={stats2024.totalGirls}
            trend={getTrend(stats2024.totalGirls, stats2023.totalGirls)}
            percentChange={calculatePercentChange(stats2023.totalGirls, stats2024.totalGirls)}
          />
          <StatCard
            label="Gender Parity (2024)"
            value={genderParity2024.toFixed(1)}
            unit="%"
            trend={genderParity2024 >= genderParity2023 ? 'up' : 'down'}
            percentChange={parseFloat((genderParity2024 - genderParity2023).toFixed(2))}
          />
        </DashboardGrid>
      </Section>

      <Section title="Year-over-Year Comparison">
        <ChartContainer>
          <ComparisonBarChart
            data={educationComparison}
            xKey="metric"
            yKey="2024"
            title="Education Metrics Comparison"
            height={350}
            domain={[200, 'dataMax']}
          />
        </ChartContainer>
      </Section>

      <Section title="Gender Distribution">
        <ChartContainer>
          <GenderDistributionChart data={genderParityData} title="Boys vs Girls Enrollment" height={400} />
        </ChartContainer>
      </Section>

      <Section title="Geographic Coverage">
        <DashboardGrid columns={2}>
          <StatCard label="States Covered" value={statesCount} trend="stable" />
          <StatCard label="Total Records" value={totalRecords.toLocaleString()} trend="stable" />
        </DashboardGrid>
      </Section>

      {/* Enrollment & Gender Parity Analysis */}
      {(stats2024.totalChildren < stats2023.totalChildren || stats2024.totalGirls < stats2023.totalGirls) && (
        <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
          <h3 className="font-semibold text-orange-900 mb-2">Why Enrollment May Have Decreased:</h3>
          <ul className="text-sm text-orange-800 space-y-1">
            <li><strong>Data Collection Period:</strong> 2024 data may reflect a different point in the academic year than 2023</li>
            <li><strong>Economic Pressures:</strong> Families facing financial hardship may pull children out for child labor</li>
            <li><strong>School Accessibility:</strong> Distance to schools, lack of transportation, or unsafe routes</li>
            <li><strong>COVID-19 Aftermath:</strong> Continued recovery from pandemic-era disruptions to education</li>
            <li><strong>Regional Factors:</strong> Natural disasters, conflicts, or displacement in certain areas</li>
          </ul>
          {stats2024.totalGirls < stats2023.totalGirls && (
            <div className="mt-3 pt-3 border-t border-orange-300">
              <h4 className="font-semibold text-orange-900 mb-1">Why Girls' Enrollment Dropped More Than Boys:</h4>
              <ul className="text-sm text-orange-800 space-y-1">
                <li><strong>Domestic Responsibilities:</strong> Girls are disproportionately assigned household and caregiving duties</li>
                <li><strong>Safety Concerns:</strong> Lack of safe transport or harassment on routes to school</li>
                <li><strong>Inadequate Sanitation:</strong> Schools without proper girls' toilets see higher female dropout rates</li>
                <li><strong>Early Marriage:</strong> Cultural pressures for early marriage interrupt girls' education</li>
                <li><strong>Menstrual Hygiene:</strong> Lack of facilities and awareness leads to absenteeism and eventual dropout</li>
                <li><strong>Family Priorities:</strong> When resources are limited, families may prioritize boys' education</li>
              </ul>
            </div>
          )}
          <p className="text-xs text-orange-700 mt-3 italic"><strong>Recommended Actions:</strong> Implement girl-specific retention programs, improve school sanitation, provide scholarships, conduct community awareness on girls' education, and ensure safe transportation.</p>
        </div>
      )}

      {/* Summary & Key Insights */}
      <Section title="Summary & Key Insights">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Enrollment Overview */}
            <div className="g-white p-4 rounded-lg border-l-4 border-pink-500">
              <h4 className="font-bold text-blue-800 mb-2">Enrollment Overview</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>2024 Children:</strong> {stats2024.totalChildren.toLocaleString()}</li>
                <li><strong>2023 Children:</strong> {stats2023.totalChildren.toLocaleString()}</li>
                <li><strong>YoY Change:</strong> <span className={childrenGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>{childrenGrowth >= 0 ? '+' : ''}{childrenGrowth}%</span></li>
              </ul>
            </div>

            {/* Gender Parity */}
            <div className="bg-white p-4 rounded-lg border-l-4 border-pink-500">
              <h4 className="font-bold text-pink-800 mb-2">Gender Parity</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>Girls (2024):</strong> {genderParity2024.toFixed(1)}% ({stats2024.totalGirls.toLocaleString()})</li>
                <li><strong>Boys (2024):</strong> {(100 - genderParity2024).toFixed(1)}% ({stats2024.totalBoys.toLocaleString()})</li>
                <li><strong>Gap from 50%:</strong> {Math.abs(50 - genderParity2024).toFixed(1)}%</li>
              </ul>
            </div>

            {/* Coverage */}
            <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
              <h4 className="font-bold text-green-800 mb-2">Coverage</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>Total Records:</strong> {totalRecords.toLocaleString()}</li>
                <li><strong>States:</strong> {statesCount}</li>
                <li><strong>Cumulative Reach:</strong> 474K children</li>
              </ul>
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-white p-4 rounded-lg mb-6">
            <h4 className="font-bold text-gray-900 mb-3">Key Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-green-700 mb-1">What's Going Well:</p>
                <ul className="text-gray-700 space-y-1 list-disc ml-4">
                  {genderParity2024 >= 48 && genderParity2024 <= 52 && (
                    <li>Near gender parity achieved ({genderParity2024.toFixed(1)}% girls)</li>
                  )}
                  <li>Multi-state coverage with {statesCount} states tracked</li>
                  <li>Comprehensive education tracking system in place</li>
                  {childrenGrowth >= 0 && (
                    <li>Positive enrollment growth of {childrenGrowth}%</li>
                  )}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-red-700 mb-1">Areas of Concern:</p>
                <ul className="text-gray-700 space-y-1 list-disc ml-4">
                  {childrenGrowth < 0 && (
                    <li>Enrollment declined by {Math.abs(childrenGrowth)}% from 2023</li>
                  )}
                  {stats2024.totalGirls < stats2023.totalGirls && (
                    <li>Girls' enrollment dropped by {Math.abs(calculatePercentChange(stats2023.totalGirls, stats2024.totalGirls))}%</li>
                  )}
                  {genderParity2024 < 48 && (
                    <li>Gender gap exists - girls at {genderParity2024.toFixed(1)}% (target: 50%)</li>
                  )}
                  <li>Dropout rates need monitoring and intervention</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* State Performance Rankings */}
      {summaryData?.byState && Object.keys(summaryData.byState).length > 0 && (
        <Section title="State Performance Rankings (Education Enrollment)">
          <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
            <p className="text-sm text-gray-700">
              <strong>Insight:</strong> These rankings show top and bottom performing states by total education enrollment. 
              Celebrate and learn from top performers; allocate additional resources to states with lower enrollment.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg shadow-md">
              <h4 className="font-bold text-green-900 mb-4 text-xl flex items-center">
                <Award className="mr-2 text-yellow-500" size={24} />
                Top 10 States by Enrollment
              </h4>
              <div className="space-y-3">
                {Object.entries(summaryData.byState as Record<string, YearData>)
                  .filter(([state]) => state !== 'Unknown' && state !== 'None')
                  .map(([state, data]) => ({ location: state, value: data.count, boys: data.boys, girls: data.girls }))
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 10)
                  .map((perf, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-800">{perf.location}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-green-700 font-bold">{perf.value.toLocaleString()}</span>
                        <p className="text-xs text-gray-500">Boys: {perf.boys.toLocaleString()} | Girls: {perf.girls.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Bottom Performers */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-lg shadow-md">
              <h4 className="font-bold text-red-900 mb-4 text-xl flex items-center">
                <AlertCircle className="mr-2 text-red-500" size={24} />
                Bottom 10 States (Need Support)
              </h4>
              <div className="space-y-3">
                {Object.entries(summaryData.byState as Record<string, YearData>)
                  .filter(([state]) => state !== 'Unknown' && state !== 'None')
                  .map(([state, data]) => ({ location: state, value: data.count, boys: data.boys, girls: data.girls }))
                  .sort((a, b) => a.value - b.value)
                  .slice(0, 10)
                  .map((perf, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                      <div className="flex items-center">
                        <span className="bg-red-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-gray-800">{perf.location}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-red-700 font-bold">{perf.value.toLocaleString()}</span>
                        <p className="text-xs text-gray-500">Boys: {perf.boys.toLocaleString()} | Girls: {perf.girls.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Action Items & Recommendations */}
      <Section title="Action Items & Recommendations">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Immediate Actions */}
            <div className="bg-white p-4 rounded-lg border-l-4 border-red-500">
              <h4 className="font-bold text-red-700 mb-3">Immediate Priority (Q1)</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold">•</span>
                  <div>
                    <strong>State-wise Dropout Analysis:</strong> Use NFHS-5 (2019-21) baseline attendance data to prioritize states with {'<'}80% rates
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold">•</span>
                  <div>
                    <strong>Girls' Retention Focus:</strong> Target states with literacy gender gap &gt;10% for girls' education campaigns
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold">•</span>
                  <div>
                    <strong>School Sanitation Audit:</strong> Cross-reference with School Dashboard infrastructure data - prioritize schools without girls' toilets
                  </div>
                </li>
              </ul>
            </div>

            {/* Short-term Actions */}
            <div className="bg-white p-4 rounded-lg border-l-4 border-amber-500">
              <h4 className="font-bold text-amber-700 mb-3">Short-term Goals (Q2-Q3)</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <div>
                    <strong>Scholarship Programs:</strong> Expand financial support across 474K+ enrolled children, prioritizing at-risk girls
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <div>
                    <strong>Attendance Improvement:</strong> Use NFHS-5 (2019-21) baselines to set state-specific improvement targets vs current performance
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <div>
                    <strong>Performance Tracking:</strong> Monitor grade-wise progression and identify bottlenecks in primary-to-secondary transition
                  </div>
                </li>
              </ul>
            </div>

            {/* Long-term Strategy */}
            <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
              <h4 className="font-bold text-green-700 mb-3">Long-term Strategy (Annual)</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 font-bold">•</span>
                  <div>
                    <strong>Secondary Education Push:</strong> Focus resources on upper primary and secondary grades where dropout peaks
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 font-bold">•</span>
                  <div>
                    <strong>Parent Literacy Programs:</strong> Address NFHS-5 (2019-21) literacy gaps - target improvements in low-literacy districts
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 font-bold">•</span>
                  <div>
                    <strong>Quality Enhancement:</strong> Improve learning outcomes through remedial education and digital learning tools
                  </div>
                </li>
              </ul>
            </div>

            {/* Success Metrics */}
            <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
              <h4 className="font-bold text-purple-700 mb-3">Success Metrics to Track</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <div>
                    <strong>Target:</strong> Achieve 50% gender parity (current: {genderParity2024.toFixed(1)}%) across all states
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <div>
                    <strong>Target:</strong> Exceed NFHS-5 (2019-21) baseline attendance by 5% in CRY intervention areas
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <div>
                    <strong>Target:</strong> Increase enrollment by 5% in 2025
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <div>
                    <strong>Target:</strong> 100% schools with functional girls' toilets
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-bold text-gray-900 mb-3">Quick Reference: Key Numbers</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xl font-bold text-purple-600">{totalRecords.toLocaleString()}</div>
                <div className="text-gray-600">Total Records</div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xl font-bold text-blue-600">{statesCount}</div>
                <div className="text-gray-600">States Covered</div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xl font-bold text-pink-600">{genderParity2024.toFixed(1)}%</div>
                <div className="text-gray-600">Girls Percentage</div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <div className={`text-xl font-bold ${childrenGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>{childrenGrowth >= 0 ? '+' : ''}{childrenGrowth}%</div>
                <div className="text-gray-600">YoY Change</div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* NFHS-5 Comparison Section */}
      {nfhs5Comparison && (
        <Section title="Education Access & Literacy Baseline (NFHS-5: 2019-2021)">
          <div className="mb-4 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-l-4 border-teal-500 rounded">
            <div className="flex items-start gap-3">
              <Activity className="text-teal-600 mt-1" size={24} />
              <div>
                <h3 className="font-semibold text-teal-900 mb-2">Understanding CRY's Educational Impact in National Context</h3>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>NFHS-5 (2019-2021)</strong> provides baseline data on education access and literacy across states. 
                  This section focuses purely on education indicators to assess where CRY's enrollment programs have maximum impact.
                </p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc ml-5">
                  <li><strong>School Attendance:</strong> State-level baseline showing education access gaps</li>
                  <li><strong>Literacy Gap:</strong> Gender gap in adult literacy indicates where girls' education is most critical</li>
                  <li><strong>Birth Registration:</strong> Essential for school enrollment - unregistered children face barriers</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2 italic">
                  Source: {nfhs5Comparison.source}
                </p>
              </div>
            </div>
          </div>

          {/* School Attendance Baseline */}
          <div className="mb-6">
            <ChartContainer>
              <h3 className="text-lg font-semibold mb-2 text-center">
                School Attendance Baseline in CRY States (NFHS-5: 2019-21)
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Percentage of children ages 6-17 attending school - India average is {nfhs5Comparison.indiaAverage.school_attendance}%
              </p>
              <GroupedBarChart
                data={nfhs5Comparison.attendanceBaselineData}
                xKey="state"
                lines={[
                  { key: 'NFHS-5 School Attendance %', name: 'Attendance %', color: '#10b981' },
                ]}
                title=""
                height={350}
              />
            </ChartContainer>
          </div>

          {/* Literacy Gender Gap */}
          <div className="mb-6">
            <ChartContainer>
              <h3 className="text-lg font-semibold mb-2 text-center">
                Adult Literacy by Gender - The Education Generation Gap (NFHS-5: 2019-21)
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Closing today's literacy gap ensures tomorrow's children get equal education support from parents
              </p>
              <GroupedBarChart
                data={nfhs5Comparison.literacyGapData}
                xKey="state"
                lines={[
                  { key: 'Women Literacy %', name: 'Women %', color: '#ec4899' },
                  { key: 'Men Literacy %', name: 'Men %', color: '#3b82f6' },
                ]}
                title=""
                height={350}
              />
            </ChartContainer>
          </div>

          {/* CRY Girls Education Impact */}
          <div className="mb-6">
            <ChartContainer>
              <h3 className="text-lg font-semibold mb-2 text-center">
                CRY Girls' Enrollment vs State Gender Literacy Gap
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                How CRY's girls' enrollment (%) compares to state's literacy gap - higher CRY % in high-gap states indicates strong impact
              </p>
              <GroupedBarChart
                data={nfhs5Comparison.girlsEducationData}
                xKey="state"
                lines={[
                  { key: 'CRY Girls %', name: 'CRY Girls %', color: '#ec4899' },
                  { key: 'Literacy Gap (M-F)', name: 'Literacy Gap %', color: '#f97316' },
                ]}
                title=""
                height={350}
              />
            </ChartContainer>
          </div>

          {/* Birth Registration & Enrollment */}
          <div className="mb-6">
            <ChartContainer>
              <h3 className="text-lg font-semibold mb-2 text-center">
                Birth Registration vs School Attendance (NFHS-5: 2019-21)
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Birth registration is essential for school enrollment - states with registration gaps need targeted support
              </p>
              <GroupedBarChart
                data={nfhs5Comparison.enrollmentBarriersData}
                xKey="state"
                lines={[
                  { key: 'Birth Registration %', name: 'Birth Registration %', color: '#8b5cf6' },
                  { key: 'School Attendance %', name: 'School Attendance %', color: '#10b981' },
                ]}
                title=""
                height={350}
              />
            </ChartContainer>
          </div>

          {/* India Average Benchmarks - Education Focused */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="font-bold text-gray-900 mb-4">India Average Education Benchmarks (NFHS-5: 2019-21)</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{nfhs5Comparison.indiaAverage.school_attendance}%</p>
                <p className="text-xs text-gray-600">School Attendance</p>
                <p className="text-xs text-gray-400">(ages 6-17)</p>
              </div>
              <div className="text-center p-3 bg-pink-50 rounded-lg">
                <p className="text-2xl font-bold text-pink-700">{nfhs5Comparison.indiaAverage.literacy_women}%</p>
                <p className="text-xs text-gray-600">Women Literacy</p>
                <p className="text-xs text-gray-400">(ages 15-49)</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">{nfhs5Comparison.indiaAverage.literacy_men}%</p>
                <p className="text-xs text-gray-600">Men Literacy</p>
                <p className="text-xs text-gray-400">(ages 15-49)</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-700">{nfhs5Comparison.indiaAverage.literacy_gap}%</p>
                <p className="text-xs text-gray-600">Literacy Gap</p>
                <p className="text-xs text-gray-400">(M-F difference)</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-700">{nfhs5Comparison.indiaAverage.birth_registration}%</p>
                <p className="text-xs text-gray-600">Birth Registration</p>
                <p className="text-xs text-gray-400">(under 5 years)</p>
              </div>
            </div>
          </div>

          {/* Key Insights - Education Focused */}
          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
            <h4 className="font-bold text-gray-900 mb-3">Key Education Access Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                <h5 className="font-semibold text-green-800 mb-2">Attendance Gap Opportunity</h5>
                <p className="text-gray-700">
                  States with attendance below {nfhs5Comparison.indiaAverage.school_attendance}% (India average) 
                  represent high-impact opportunities. CRY's enrollment programs directly address systemic barriers 
                  to education in these underserved regions.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border-l-4 border-pink-500">
                <h5 className="font-semibold text-pink-800 mb-2">Breaking the Literacy Cycle</h5>
                <p className="text-gray-700">
                  The {nfhs5Comparison.indiaAverage.literacy_gap}% literacy gap between men and women reflects historical 
                  inequity. CRY's focus on &gt;45% girls enrollment ensures the next generation of mothers can support 
                  their children's education.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                <h5 className="font-semibold text-purple-800 mb-2">Birth Registration = School Access</h5>
                <p className="text-gray-700">
                  Children without birth certificates face barriers to school enrollment. States with registration 
                  below {nfhs5Comparison.indiaAverage.birth_registration}% need targeted documentation drives 
                  alongside education programs.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                <h5 className="font-semibold text-blue-800 mb-2">Strategic State Prioritization</h5>
                <p className="text-gray-700">
                  States with both low attendance AND high literacy gaps (like Bihar, Rajasthan) should receive 
                  intensified support, especially for girls' education, to maximize generational impact.
                </p>
              </div>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
};
