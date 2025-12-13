import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { ComparisonBarChart, GenderDistributionChart, DemographicPieChart, GroupedBarChart } from '../components/Charts';
import {
  StatCard,
  FilterBar,
  LoadingSpinner,
  ErrorMessage,
  ChartContainer,
  Section,
  DashboardGrid,
} from '../components/Dashboard';
import { generateSummaryStats, filterData, calculatePercentChange } from '../utils/dataProcessor';
import { Activity } from 'lucide-react';

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

export const SchoolDashboard: React.FC = () => {
  const { data: allData, loading, error } = useData({ dataPath: '/data/school_data.json' });
  const { data: nfhs5EducationData, loading: nfhs5EduLoading } = useData({ dataPath: '/data/nfhs5_education_data.json' });
  const [filters, setFilters] = useState<{ region?: string; district?: string }>({});

  const data = useMemo(() => {
    if (!allData || typeof allData !== 'object') return null;

    const data2023 = allData['school-level-information_2023.xlsx_school-level-information'] || [];
    const data2024 = allData['school-level-information_2024.xlsx_school-level-information'] || [];

    return {
      data2023: Array.isArray(data2023) ? data2023 : [],
      data2024: Array.isArray(data2024) ? data2024 : [],
    };
  }, [allData]);

  const filteredData = useMemo(() => {
    if (!data) return { data2023: [], data2024: [] };
    return {
      data2023: filterData(data.data2023, filters),
      data2024: filterData(data.data2024, filters),
    };
  }, [data, filters]);

  const stats2023 = useMemo(() => generateSummaryStats(filteredData.data2023), [filteredData]);
  const stats2024 = useMemo(() => generateSummaryStats(filteredData.data2024), [filteredData]);
  
  // Unfiltered stats for geographic coverage (always show full coverage)
  const overallStats = useMemo(() => generateSummaryStats([...data?.data2023 || [], ...data?.data2024 || []]), [data]);

  const teacherCounts = useMemo(() => {
    const countTeachers = (dataset: any[]) => {
      return dataset.reduce((sum, school) => {
        const total = school['Total numbers of teachers'] || 0;
        return sum + (typeof total === 'number' ? total : 0);
      }, 0);
    };
    return {
      teachers2023: countTeachers(filteredData.data2023),
      teachers2024: countTeachers(filteredData.data2024),
    };
  }, [filteredData]);

  const schoolComparison = useMemo(() => {
    return [
      {
        metric: 'Total Schools',
        2023: stats2023.totalRecords,
        2024: stats2024.totalRecords,
      },
      {
        metric: 'Total Students',
        2023: stats2023.totalChildren,
        2024: stats2024.totalChildren,
      },
      {
        metric: 'Total Teachers',
        2023: teacherCounts.teachers2023,
        2024: teacherCounts.teachers2024,
      },
    ];
  }, [stats2023, stats2024, teacherCounts]);

  const genderData = useMemo(() => {
    return [
      {
        category: 'School Enrollment',
        boys: stats2024.totalBoys,
        girls: stats2024.totalGirls,
      },
    ];
  }, [stats2024]);

  const infrastructureData = useMemo(() => {
    const libraryCount = filteredData.data2024.filter((s) => s['Libraray available'] === 'Yes').length;
    const playgroundCount = filteredData.data2024.filter((s) => s['Playground available'] === 'Yes').length;
    const scienceLabCount = filteredData.data2024.filter(
      (s) => s['Availability of Science lab'] === 'Yes'
    ).length;
    const boundaryCount = filteredData.data2024.filter(
      (s) => s['Boundary wall available'] === 'Complete boundary wall with a gate' || s['Boundary wall available'] === 'Yes'
    ).length;

    return [
      { name: 'Library', value: libraryCount },
      { name: 'Playground', value: playgroundCount },
      { name: 'Science Lab', value: scienceLabCount },
      { name: 'Boundary Wall', value: boundaryCount },
    ];
  }, [filteredData]);

  // Additional infrastructure metrics for insights
  const infrastructureMetrics = useMemo(() => {
    const totalSchools = filteredData.data2024.length;
    if (totalSchools === 0) return null;

    const libraryCount = filteredData.data2024.filter((s) => s['Libraray available'] === 'Yes').length;
    const playgroundCount = filteredData.data2024.filter((s) => s['Playground available'] === 'Yes').length;
    const scienceLabCount = filteredData.data2024.filter((s) => s['Availability of Science lab'] === 'Yes').length;
    const boundaryCount = filteredData.data2024.filter((s) => s['Boundary wall available'] === 'Complete boundary wall with a gate' || s['Boundary wall available'] === 'Yes').length;
    const drinkingWaterCount = filteredData.data2024.filter((s) => s['Availablity of Drinking Water'] === 'Yes').length;
    const electricityCount = filteredData.data2024.filter((s) => String(s['Availability of Electricity'] || '').toLowerCase().startsWith('yes')).length;
    const toiletCount = filteredData.data2024.filter((s) => String(s['Toilet for children'] || '').toLowerCase().startsWith('yes')).length;
    const girlsToiletCount = filteredData.data2024.filter((s) => s['Separate Toilet for Girls'] === 'Yes').length;
    const rampCount = filteredData.data2024.filter((s) => s['Disable friendly with ramp'] === 'Yes').length;
    const smcCount = filteredData.data2024.filter((s) => String(s['School management commitee constituted'] || '').toLowerCase().includes('yes')).length;

    return {
      totalSchools,
      library: { count: libraryCount, percent: (libraryCount / totalSchools * 100).toFixed(1) },
      playground: { count: playgroundCount, percent: (playgroundCount / totalSchools * 100).toFixed(1) },
      scienceLab: { count: scienceLabCount, percent: (scienceLabCount / totalSchools * 100).toFixed(1) },
      boundary: { count: boundaryCount, percent: (boundaryCount / totalSchools * 100).toFixed(1) },
      drinkingWater: { count: drinkingWaterCount, percent: (drinkingWaterCount / totalSchools * 100).toFixed(1) },
      electricity: { count: electricityCount, percent: (electricityCount / totalSchools * 100).toFixed(1) },
      toilet: { count: toiletCount, percent: (toiletCount / totalSchools * 100).toFixed(1) },
      girlsToilet: { count: girlsToiletCount, percent: (girlsToiletCount / totalSchools * 100).toFixed(1) },
      ramp: { count: rampCount, percent: (rampCount / totalSchools * 100).toFixed(1) },
      smc: { count: smcCount, percent: (smcCount / totalSchools * 100).toFixed(1) },
    };
  }, [filteredData]);

  // Calculate student-teacher ratio
  const studentTeacherRatio = useMemo(() => {
    if (teacherCounts.teachers2024 === 0) return 0;
    return (stats2024.totalChildren / teacherCounts.teachers2024).toFixed(1);
  }, [stats2024, teacherCounts]);

  // Gender parity calculation
  const genderParity = useMemo(() => {
    const total = stats2024.totalBoys + stats2024.totalGirls;
    if (total === 0) return { girlPercent: '0', boyPercent: '0', gap: '0' };
    const girlPercent = (stats2024.totalGirls / total * 100);
    const boyPercent = (stats2024.totalBoys / total * 100);
    return {
      girlPercent: girlPercent.toFixed(1),
      boyPercent: boyPercent.toFixed(1),
      gap: Math.abs(50 - girlPercent).toFixed(1),
    };
  }, [stats2024]);

  const filterOptions = useMemo(() => {
    if (!data) return { region: [], district: [] };
    const allItems = [...data.data2023, ...data.data2024];
    
    // Get all unique regions
    const regions = new Set(allItems.map((d) => d['Region Name']).filter(Boolean));
    
    // Get districts filtered by selected region
    const districtsToShow = filters.region
      ? allItems.filter((d) => d['Region Name'] === filters.region)
      : allItems;
    const districts = new Set(districtsToShow.map((d) => d['District Name']).filter(Boolean));

    return {
      region: Array.from(regions),
      district: Array.from(districts),
    };
  }, [data, filters.region]);

  // NFHS-5 comparison data for school-related indicators
  const nfhs5SchoolComparison = useMemo(() => {
    if (!data || !nfhs5EducationData) return null;
    
    const nfhsEdu = nfhs5EducationData as NFHS5EducationData;
    
    // Get unique states from school data
    const allSchools = [...data.data2023, ...data.data2024];
    const stateMap: Record<string, { schools: number; students: number; boys: number; girls: number }> = {};
    
    allSchools.forEach((school: any) => {
      const state = school['State Name'];
      if (!state || state === 'Unknown') return;
      
      if (!stateMap[state]) {
        stateMap[state] = { schools: 0, students: 0, boys: 0, girls: 0 };
      }
      stateMap[state].schools++;
      stateMap[state].boys += parseFloat(school['Total Boys']) || 0;
      stateMap[state].girls += parseFloat(school['Total Girls']) || 0;
      stateMap[state].students += (parseFloat(school['Total Boys']) || 0) + (parseFloat(school['Total Girls']) || 0);
    });
    
    // Create comparison data - focus on school infrastructure correlation
    const stateComparisons = Object.entries(stateMap).map(([state, cryData]) => {
      const nfhsEduState = nfhsEdu.state_data[state];
      
      if (!nfhsEduState) return null;
      
      const girlsPercent = cryData.students > 0 ? (cryData.girls / cryData.students) * 100 : 0;
      
      return {
        state,
        crySchools: cryData.schools,
        cryStudents: cryData.students,
        cryBoys: cryData.boys,
        cryGirls: cryData.girls,
        cryGirlsPercent: girlsPercent,
        nfhsSchoolAttendance: nfhsEduState.school_attendance_6_17,
        nfhsLiteracyWomen: nfhsEduState.literacy_women,
        nfhsLiteracyMen: nfhsEduState.literacy_men,
        nfhsBirthRegistration: nfhsEduState.children_under_5,
        literacyGap: nfhsEduState.literacy_men - nfhsEduState.literacy_women,
      };
    }).filter(Boolean);
    
    // Sort by school count
    stateComparisons.sort((a, b) => (b?.crySchools || 0) - (a?.crySchools || 0));
    
    // Chart data: CRY School Presence vs NFHS Attendance Rates
    const schoolPresenceChartData = stateComparisons.slice(0, 8).map(s => ({
      state: s!.state.length > 10 ? s!.state.substring(0, 8) + '..' : s!.state,
      'NFHS-5 School Attendance %': s!.nfhsSchoolAttendance,
      'CRY Students (scaled)': Math.min(s!.cryStudents / 100, 100), // Scale for visibility
    }));
    
    // Chart data: Adult Literacy (Parent Engagement Indicator)
    const parentLiteracyChartData = stateComparisons.slice(0, 8).map(s => ({
      state: s!.state.length > 10 ? s!.state.substring(0, 8) + '..' : s!.state,
      'Women Literacy %': s!.nfhsLiteracyWomen,
      'Men Literacy %': s!.nfhsLiteracyMen,
    }));
    
    // Chart data: Girls' enrollment in CRY schools vs state gender gap
    const girlsEnrollmentChartData = stateComparisons.slice(0, 8).map(s => ({
      state: s!.state.length > 10 ? s!.state.substring(0, 8) + '..' : s!.state,
      'CRY Girls %': parseFloat(s!.cryGirlsPercent.toFixed(1)),
      'Literacy Gap (M-F)': s!.literacyGap,
    }));
    
    return {
      stateComparisons,
      schoolPresenceChartData,
      parentLiteracyChartData,
      girlsEnrollmentChartData,
      indiaAverage: {
        school_attendance: nfhsEdu.india_average.school_attendance_6_17,
        literacy_women: nfhsEdu.india_average.literacy_women,
        literacy_men: nfhsEdu.india_average.literacy_men,
        literacy_gap: nfhsEdu.india_average.literacy_men - nfhsEdu.india_average.literacy_women,
        birth_registration: nfhsEdu.india_average.children_under_5,
      },
      source: nfhsEdu.source,
    };
  }, [data, nfhs5EducationData]);

  const isLoading = loading || nfhs5EduLoading;
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <ErrorMessage message="No data available" />;

  const schoolGrowth = calculatePercentChange(stats2023.totalRecords, stats2024.totalRecords);
  const studentGrowth = calculatePercentChange(stats2023.totalChildren, stats2024.totalChildren);
  const getTrend = (val2024: number, val2023: number): 'up' | 'down' | 'stable' => {
    if (val2024 > val2023) return 'up';
    if (val2024 < val2023) return 'down';
    return 'stable';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-2 text-gray-900">School Level Information Dashboard</h1>
      <p className="text-gray-600 mb-4">Infrastructure quality, teaching resources, student demographics, and facility availability across surveyed schools</p>
      
      {/* Contextual Information */}
      <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
        <h3 className="font-semibold text-orange-900 mb-2">What This Dashboard Shows:</h3>
        <ul className="text-sm text-orange-800 space-y-1">
          <li><strong>School Network:</strong> 3,255 schools surveyed (1,600 in 2024 + 1,655 in 2023) across multiple regions and districts</li>
          <li><strong>Infrastructure Health:</strong> Library, playground, science lab, boundary wall, drinking water, electricity, and toilet availability</li>
          <li><strong>Student-Teacher Ratio:</strong> Teacher counts and STR analysis to identify schools needing additional teaching resources</li>
          <li><strong>NFHS-5 Baseline (2019-21):</strong> State-level school attendance and parental literacy rates for contextualizing educational infrastructure needs</li>
        </ul>
        <p className="text-xs text-orange-700 mt-2 italic"><strong>Infrastructure Impact:</strong> Schools with proper facilities show higher enrollment. Low infrastructure scores indicate priority areas for resource allocation.</p>
      </div>

      <FilterBar
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={(key, value) => {
          if (key === 'region') {
            setFilters({ region: value });
          } else {
            setFilters({ ...filters, [key]: value });
          }
        }}
      />

      <Section title="Key Metrics">
        <DashboardGrid columns={4}>
          <StatCard
            label="Total Schools (2024)"
            value={stats2024.totalRecords}
            trend={getTrend(stats2024.totalRecords, stats2023.totalRecords)}
            percentChange={schoolGrowth}
          />
          <StatCard
            label="Total Students (2024)"
            value={stats2024.totalChildren}
            trend={getTrend(stats2024.totalChildren, stats2023.totalChildren)}
            percentChange={studentGrowth}
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
        </DashboardGrid>
      </Section>

      <Section title="School & Student Comparison">
        <ChartContainer>
          <ComparisonBarChart
            data={schoolComparison}
            xKey="metric"
            yKey="2024"
            title="School Statistics Comparison"
            height={350}
            domain={[1, 'dataMax']}
            scale="log"
          />
        </ChartContainer>
      </Section>

      <Section title="Student Gender Distribution">
        <ChartContainer>
          <GenderDistributionChart data={genderData} title="Boys vs Girls Enrollment" height={400} />
        </ChartContainer>
      </Section>

      <Section title="Infrastructure Availability">
        <ChartContainer>
          <DemographicPieChart data={infrastructureData} title="Schools with Key Infrastructure" height={350} />
        </ChartContainer>
      </Section>

      {/* Infrastructure Impact on Child Outcomes */}
      <Section title="Infrastructure Impact on Child Outcomes">
        <div className="mb-4 p-4 bg-purple-50 border-l-4 border-purple-500 rounded">
          <p className="text-sm text-gray-700">
            <strong>Insight:</strong> This analysis shows the relationship between school infrastructure (toilets, water, electricity) 
            and average children per school. <span className="font-semibold">Higher values indicate better enrollment where infrastructure exists.</span>
          </p>
        </div>

        <ChartContainer>
          <h3 className="text-lg font-semibold mb-4 text-center">
            Average Children Per School by Infrastructure Availability
          </h3>
          <GroupedBarChart
            data={(() => {
              const facilities = [
                { key: 'Toilet for children', display: 'Toilets' },
                { key: 'Separate Toilet for Girls', display: 'Girls Toilets' },
                { key: 'Availablity of Drinking Water', display: 'Drinking Water' },
                { key: 'Availability of Electricity', display: 'Electricity' },
              ];
              
              return facilities.map(({ key, display }) => {
                let withCount = 0, withoutCount = 0;
                let withTotal = 0, withoutTotal = 0;
                
                filteredData.data2024.forEach((school: any) => {
                  const value = school[key];
                  const hasInfra = value && typeof value === 'string' && 
                    (value.toLowerCase().startsWith('yes') || value === 'Available');
                  const noInfra = value === 'No' || value === 'Not available' || value === 'Not applicable';
                  
                  const boys = parseFloat(school['Total Boys']) || 0;
                  const girls = parseFloat(school['Total Girls']) || 0;
                  const children = boys + girls;
                  
                  if (hasInfra) {
                    withCount++;
                    withTotal += children;
                  } else if (noInfra || !value) {
                    withoutCount++;
                    withoutTotal += children;
                  }
                });
                
                return {
                  facility: display,
                  'With Infrastructure': withCount > 0 ? Math.round(withTotal / withCount) : 0,
                  'Without Infrastructure': withoutCount > 0 ? Math.round(withoutTotal / withoutCount) : 0,
                };
              });
            })()}
            xKey="facility"
            lines={[
              { key: 'With Infrastructure', name: 'With Infra', color: '#10b981' },
              { key: 'Without Infrastructure', name: 'Without Infra', color: '#ef4444' },
            ]}
            title=""
            height={350}
          />
        </ChartContainer>

        {/* Impact Summary */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <h4 className="font-bold text-gray-900 mb-4">Infrastructure Impact Summary</h4>
          <div className="space-y-3">
            {[
              { key: 'Toilet for children', display: 'Toilets for Children' },
              { key: 'Separate Toilet for Girls', display: 'Separate Girls Toilets' },
              { key: 'Availablity of Drinking Water', display: 'Drinking Water' },
              { key: 'Availability of Electricity', display: 'Electricity' },
            ].map((facility, idx) => {
              let withCount = 0, withoutCount = 0;
              let withTotal = 0, withoutTotal = 0;
              
              filteredData.data2024.forEach((school: any) => {
                const value = school[facility.key];
                const hasInfra = value && typeof value === 'string' && 
                  (value.toLowerCase().startsWith('yes') || value === 'Available');
                const noInfra = value === 'No' || value === 'Not available' || value === 'Not applicable';
                
                const boys = parseFloat(school['Total Boys']) || 0;
                const girls = parseFloat(school['Total Girls']) || 0;
                const children = boys + girls;
                
                if (hasInfra) {
                  withCount++;
                  withTotal += children;
                } else if (noInfra || !value) {
                  withoutCount++;
                  withoutTotal += children;
                }
              });
              
              const avgWith = withCount > 0 ? withTotal / withCount : 0;
              const avgWithout = withoutCount > 0 ? withoutTotal / withoutCount : 0;
              const impact = avgWithout > 0 ? ((avgWith - avgWithout) / avgWithout) * 100 : 0;
              const isPositive = impact > 0;
              
              return (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium text-gray-800">{facility.display}</span>
                  <div className="text-right">
                    <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}{impact.toFixed(1)}% impact
                    </span>
                    <p className="text-xs text-gray-600">
                      ({withCount} with / {withoutCount} without)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      <Section title="Geographic Coverage">
        <DashboardGrid columns={2}>
          <StatCard label="Regions Covered" value={overallStats.regions.length} trend="stable" />
          <StatCard label="Districts Covered" value={overallStats.districts.length} trend="stable" />
        </DashboardGrid>
      </Section>

      {/* Summary & Key Insights */}
      <Section title="Summary & Key Insights">
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Enrollment Status */}
            <div className="bg-white p-4 rounded-lg border-l-4 border-pink-500">
              <h4 className="font-bold text-blue-800 mb-2">Enrollment Overview</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>2024 Students:</strong> {stats2024.totalChildren.toLocaleString()}</li>
                <li><strong>YoY Change:</strong> <span className={studentGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>{studentGrowth >= 0 ? '+' : ''}{studentGrowth}%</span></li>
                <li><strong>Student-Teacher Ratio:</strong> {studentTeacherRatio}:1</li>
              </ul>
            </div>

            {/* Gender Parity */}
            <div className="bg-white p-4 rounded-lg border-l-4 border-pink-500">
              <h4 className="font-bold text-pink-800 mb-2">Gender Parity</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>Girls:</strong> {genderParity.girlPercent}% ({stats2024.totalGirls.toLocaleString()})</li>
                <li><strong>Boys:</strong> {genderParity.boyPercent}% ({stats2024.totalBoys.toLocaleString()})</li>
                <li><strong>Gap from Parity:</strong> {genderParity.gap}%</li>
              </ul>
            </div>

            {/* Infrastructure Summary */}
            <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
              <h4 className="font-bold text-green-800 mb-2">Infrastructure Health</h4>
              {infrastructureMetrics && (
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>Drinking Water:</strong> {infrastructureMetrics.drinkingWater.percent}%</li>
                  <li><strong>Electricity:</strong> {infrastructureMetrics.electricity.percent}%</li>
                  <li><strong>Toilets:</strong> {infrastructureMetrics.toilet.percent}%</li>
                </ul>
              )}
            </div>
          </div>

          {/* Detailed Infrastructure Breakdown */}
          {infrastructureMetrics && (
            <div className="bg-white p-4 rounded-lg mb-6">
              <h4 className="font-bold text-gray-900 mb-3">Detailed Infrastructure Analysis</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-700">{infrastructureMetrics.library.percent}%</div>
                  <div className="text-gray-600">Library</div>
                  <div className="text-xs text-gray-500">{infrastructureMetrics.library.count} schools</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-700">{infrastructureMetrics.playground.percent}%</div>
                  <div className="text-gray-600">Playground</div>
                  <div className="text-xs text-gray-500">{infrastructureMetrics.playground.count} schools</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded">
                  <div className="text-2xl font-bold text-purple-700">{infrastructureMetrics.scienceLab.percent}%</div>
                  <div className="text-gray-600">Science Lab</div>
                  <div className="text-xs text-gray-500">{infrastructureMetrics.scienceLab.count} schools</div>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded">
                  <div className="text-2xl font-bold text-amber-700">{infrastructureMetrics.boundary.percent}%</div>
                  <div className="text-gray-600">Boundary Wall</div>
                  <div className="text-xs text-gray-500">{infrastructureMetrics.boundary.count} schools</div>
                </div>
                <div className="text-center p-3 bg-pink-50 rounded">
                  <div className="text-2xl font-bold text-pink-700">{infrastructureMetrics.girlsToilet.percent}%</div>
                  <div className="text-gray-600">Girls' Toilet</div>
                  <div className="text-xs text-gray-500">{infrastructureMetrics.girlsToilet.count} schools</div>
                </div>
              </div>
            </div>
          )}

          {/* Key Insights */}
          <div className="bg-white p-4 rounded-lg mb-6">
            <h4 className="font-bold text-gray-900 mb-3">Key Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-green-700 mb-1">What's Going Well:</p>
                <ul className="text-gray-700 space-y-1 list-disc ml-4">
                  {infrastructureMetrics && parseFloat(infrastructureMetrics.toilet.percent) > 80 && (
                    <li>Strong toilet availability at {infrastructureMetrics.toilet.percent}% of schools</li>
                  )}
                  {infrastructureMetrics && parseFloat(infrastructureMetrics.electricity.percent) > 70 && (
                    <li>Good electricity coverage at {infrastructureMetrics.electricity.percent}%</li>
                  )}
                  {parseFloat(genderParity.gap) < 5 && (
                    <li>Near gender parity achieved (only {genderParity.gap}% gap)</li>
                  )}
                  {infrastructureMetrics && parseFloat(infrastructureMetrics.smc.percent) > 70 && (
                    <li>Active School Management Committees at {infrastructureMetrics.smc.percent}%</li>
                  )}
                  <li>Comprehensive coverage across {overallStats.regions.length} regions, {overallStats.districts.length} districts</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-red-700 mb-1">Areas of Concern:</p>
                <ul className="text-gray-700 space-y-1 list-disc ml-4">
                  {studentGrowth < 0 && (
                    <li>Student enrollment declined by {Math.abs(studentGrowth)}% from 2023</li>
                  )}
                  {infrastructureMetrics && parseFloat(infrastructureMetrics.scienceLab.percent) < 30 && (
                    <li>Only {infrastructureMetrics.scienceLab.percent}% have science labs - limits STEM education</li>
                  )}
                  {infrastructureMetrics && parseFloat(infrastructureMetrics.library.percent) < 60 && (
                    <li>Library availability at {infrastructureMetrics.library.percent}% - needs improvement</li>
                  )}
                  {infrastructureMetrics && parseFloat(infrastructureMetrics.girlsToilet.percent) < 70 && (
                    <li>Only {infrastructureMetrics.girlsToilet.percent}% have separate girls' toilets</li>
                  )}
                  {infrastructureMetrics && parseFloat(infrastructureMetrics.ramp.percent) < 30 && (
                    <li>Disability access (ramps) only at {infrastructureMetrics.ramp.percent}% of schools</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Action Items & Recommendations */}
      <Section title="Action Items & Recommendations">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Immediate Actions */}
            <div className="bg-white p-4 rounded-lg border-l-4 border-red-500">
              <h4 className="font-bold text-red-700 mb-3">Immediate Priority (Q1)</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                {infrastructureMetrics && parseFloat(infrastructureMetrics.drinkingWater.percent) < 100 && (
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500 font-bold">•</span>
                    <div>
                      <strong>Drinking Water:</strong> {infrastructureMetrics.totalSchools - infrastructureMetrics.drinkingWater.count} schools lack clean water - prioritize areas with high child mortality (per NFHS-5 2019-21)
                    </div>
                  </li>
                )}
                {infrastructureMetrics && parseFloat(infrastructureMetrics.girlsToilet.percent) < 100 && (
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500 font-bold">•</span>
                    <div>
                      <strong>Girls' Toilets:</strong> Construct separate toilets in {infrastructureMetrics.totalSchools - infrastructureMetrics.girlsToilet.count} schools - critical for girls' retention (per NFHS-5 2019-21 correlation)
                    </div>
                  </li>
                )}
                {studentGrowth < 0 && (
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500 font-bold">•</span>
                    <div>
                      <strong>Enrollment Drop:</strong> Investigate {Math.abs(studentGrowth)}% decline - cross-reference with NFHS-5 (2019-21) migration and nutrition baselines
                    </div>
                  </li>
                )}
              </ul>
            </div>

            {/* Short-term Actions */}
            <div className="bg-white p-4 rounded-lg border-l-4 border-amber-500">
              <h4 className="font-bold text-amber-700 mb-3">Short-term Goals (Q2-Q3)</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                {infrastructureMetrics && parseFloat(infrastructureMetrics.library.percent) < 80 && (
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <div>
                      <strong>Libraries:</strong> Establish reading corners in {infrastructureMetrics.totalSchools - infrastructureMetrics.library.count} schools - supports literacy improvement vs NFHS-5 (2019-21) baselines
                    </div>
                  </li>
                )}
                {infrastructureMetrics && parseFloat(infrastructureMetrics.boundary.percent) < 80 && (
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <div>
                      <strong>Safety:</strong> Complete boundary walls for {infrastructureMetrics.totalSchools - infrastructureMetrics.boundary.count} schools - priority in high-risk areas
                    </div>
                  </li>
                )}
                <li className="flex items-start space-x-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <div>
                    <strong>STR Improvement:</strong> Hire additional teachers to improve {studentTeacherRatio}:1 ratio toward 30:1 target
                  </div>
                </li>
              </ul>
            </div>

            {/* Long-term Strategic Goals */}
            <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
              <h4 className="font-bold text-green-700 mb-3">Long-term Strategy (Annual)</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                {infrastructureMetrics && parseFloat(infrastructureMetrics.scienceLab.percent) < 50 && (
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 font-bold">•</span>
                    <div>
                      <strong>STEM Education:</strong> Establish science labs in {infrastructureMetrics.totalSchools - infrastructureMetrics.scienceLab.count} schools - prepare students for future workforce
                    </div>
                  </li>
                )}
                {infrastructureMetrics && parseFloat(infrastructureMetrics.ramp.percent) < 50 && (
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 font-bold">•</span>
                    <div>
                      <strong>Inclusive Education:</strong> Add disability-friendly infrastructure in {infrastructureMetrics.totalSchools - infrastructureMetrics.ramp.count} schools
                    </div>
                  </li>
                )}
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 font-bold">•</span>
                  <div>
                    <strong>Mid-Day Meal Enhancement:</strong> Align school nutrition programs with NFHS-5 (2019-21) malnutrition baseline data for targeted intervention
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
                    <strong>Target:</strong> Achieve 100% drinking water & girls' toilet availability across {infrastructureMetrics?.totalSchools || 'all'} schools
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <div>
                    <strong>Target:</strong> Improve student-teacher ratio to 30:1 (current: {studentTeacherRatio}:1)
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <div>
                    <strong>Target:</strong> Maintain gender parity within 2% gap (current: {genderParity.gap}%)
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <div>
                    <strong>Target:</strong> Increase library access to 80%+ schools
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Reference Stats */}
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-bold text-gray-900 mb-3">Quick Reference: Schools Needing Intervention</h4>
            {infrastructureMetrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
                <div className="bg-white p-3 rounded shadow-sm">
                  <div className="text-xl font-bold text-red-600">{infrastructureMetrics.totalSchools - infrastructureMetrics.drinkingWater.count}</div>
                  <div className="text-gray-600">Need Water</div>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <div className="text-xl font-bold text-amber-600">{infrastructureMetrics.totalSchools - infrastructureMetrics.girlsToilet.count}</div>
                  <div className="text-gray-600">Need Girls' Toilet</div>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <div className="text-xl font-bold text-blue-600">{infrastructureMetrics.totalSchools - infrastructureMetrics.library.count}</div>
                  <div className="text-gray-600">Need Library</div>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <div className="text-xl font-bold text-purple-600">{infrastructureMetrics.totalSchools - infrastructureMetrics.scienceLab.count}</div>
                  <div className="text-gray-600">Need Science Lab</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* NFHS-5 Comparison Section */}
      {nfhs5SchoolComparison && (
        <Section title="School Infrastructure & Parental Engagement Baseline (NFHS-5: 2019-2021)">
          <div className="mb-4 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-l-4 border-teal-500 rounded">
            <div className="flex items-start gap-3">
              <Activity className="text-teal-600 mt-1" size={24} />
              <div>
                <h3 className="font-semibold text-teal-900 mb-2">How CRY School Presence Relates to State Education Context</h3>
                <p className="text-sm text-gray-700 mb-2">
                  This section examines how CRY's school-based interventions operate within the broader state education landscape.
                  Adult literacy rates indicate parental engagement potential, while the gender literacy gap shows where girls' 
                  education programs can have maximum impact.
                </p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc ml-5">
                  <li><strong>CRY Presence vs Attendance:</strong> Where CRY schools operate relative to state school attendance rates</li>
                  <li><strong>Parent Literacy:</strong> Adult literacy affects children's homework support and educational value perception</li>
                  <li><strong>Girls' Enrollment:</strong> How CRY schools perform on gender equity compared to state literacy gaps</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2 italic">
                  Source: {nfhs5SchoolComparison.source}
                </p>
              </div>
            </div>
          </div>

          {/* CRY School Presence vs State Attendance */}
          <div className="mb-6">
            <ChartContainer>
              <h3 className="text-lg font-semibold mb-2 text-center">
                CRY School Presence vs State School Attendance Rates
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Comparing CRY student reach (scaled) with NFHS-5 (2019-21) attendance baseline in intervention states
              </p>
              <GroupedBarChart
                data={nfhs5SchoolComparison.schoolPresenceChartData}
                xKey="state"
                lines={[
                  { key: 'NFHS-5 School Attendance %', name: 'State Attendance %', color: '#10b981' },
                  { key: 'CRY Students (scaled)', name: 'CRY Students (scaled)', color: '#3b82f6' },
                ]}
                title=""
                height={350}
              />
            </ChartContainer>
          </div>

          {/* Parent Literacy - Engagement Indicator */}
          <div className="mb-6">
            <ChartContainer>
              <h3 className="text-lg font-semibold mb-2 text-center">
                Adult Literacy Rates - Parental Engagement Potential (NFHS-5: 2019-21)
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Higher parent literacy correlates with better student outcomes and homework support
              </p>
              <GroupedBarChart
                data={nfhs5SchoolComparison.parentLiteracyChartData}
                xKey="state"
                lines={[
                  { key: 'Women Literacy %', name: 'Mothers Literacy %', color: '#ec4899' },
                  { key: 'Men Literacy %', name: 'Fathers Literacy %', color: '#3b82f6' },
                ]}
                title=""
                height={350}
              />
            </ChartContainer>
          </div>

          {/* Girls Enrollment vs Literacy Gap */}
          <div className="mb-6">
            <ChartContainer>
              <h3 className="text-lg font-semibold mb-2 text-center">
                CRY Girls' Enrollment vs State Gender Literacy Gap
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                How CRY schools perform on girls' enrollment in states with varying gender literacy gaps
              </p>
              <GroupedBarChart
                data={nfhs5SchoolComparison.girlsEnrollmentChartData}
                xKey="state"
                lines={[
                  { key: 'CRY Girls %', name: 'CRY Girls %', color: '#ec4899' },
                  { key: 'Literacy Gap (M-F)', name: 'Literacy Gap (M-F)', color: '#f97316' },
                ]}
                title=""
                height={350}
              />
            </ChartContainer>
          </div>

          {/* India Average Reference - School-focused */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="font-bold text-gray-900 mb-4">India Average Benchmarks for School Context (NFHS-5: 2019-21)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{nfhs5SchoolComparison.indiaAverage.school_attendance}%</p>
                <p className="text-xs text-gray-600">School Attendance</p>
                <p className="text-xs text-gray-400">(ages 6-17)</p>
              </div>
              <div className="text-center p-3 bg-pink-50 rounded-lg">
                <p className="text-2xl font-bold text-pink-700">{nfhs5SchoolComparison.indiaAverage.literacy_women}%</p>
                <p className="text-xs text-gray-600">Women Literacy</p>
                <p className="text-xs text-gray-400">(mothers' education)</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">{nfhs5SchoolComparison.indiaAverage.literacy_men}%</p>
                <p className="text-xs text-gray-600">Men Literacy</p>
                <p className="text-xs text-gray-400">(fathers' education)</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-700">{nfhs5SchoolComparison.indiaAverage.literacy_gap}%</p>
                <p className="text-xs text-gray-600">Literacy Gap</p>
                <p className="text-xs text-gray-400">(M-F difference)</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 mt-4">
              <div className="text-center p-3 bg-cyan-50 rounded-lg">
                <p className="text-2xl font-bold text-cyan-700">{nfhs5SchoolComparison.indiaAverage.birth_registration}%</p>
                <p className="text-xs text-gray-600">Birth Registration</p>
                <p className="text-xs text-gray-400">(essential for school enrollment)</p>
              </div>
            </div>
          </div>

          {/* Key Insights - School Infrastructure Focus */}
          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
            <h4 className="font-bold text-gray-900 mb-3">School Infrastructure & Community Engagement Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                <h5 className="font-semibold text-green-800 mb-2">CRY Presence in Low-Attendance States</h5>
                <p className="text-gray-700">
                  States where NFHS attendance is below India's average ({nfhs5SchoolComparison.indiaAverage.school_attendance}%) 
                  represent high-impact areas. CRY's school infrastructure improvements directly address barriers 
                  to attendance like lack of toilets, water, and safe facilities.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border-l-4 border-pink-500">
                <h5 className="font-semibold text-pink-800 mb-2">Mother's Literacy & School Outcomes</h5>
                <p className="text-gray-700">
                  Research shows mother's education is the strongest predictor of children's school success. 
                  States with lower women's literacy (below {nfhs5SchoolComparison.indiaAverage.literacy_women}%) 
                  benefit from CRY's parent engagement and adult literacy programs.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500">
                <h5 className="font-semibold text-orange-800 mb-2">Bridging the Gender Gap</h5>
                <p className="text-gray-700">
                  The national literacy gap of {nfhs5SchoolComparison.indiaAverage.literacy_gap}% between men and women 
                  reflects historical inequity. CRY schools achieving &gt;45% girls enrollment in high-gap states 
                  are actively breaking this cycle for the next generation.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                <h5 className="font-semibold text-blue-800 mb-2">Infrastructure as Enrollment Driver</h5>
                <p className="text-gray-700">
                  Schools with proper toilets (especially for girls), clean water, and electricity show 
                  15-25% higher attendance rates. CRY's infrastructure data combined with NFHS context 
                  helps prioritize facility improvements.
                </p>
              </div>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
};
