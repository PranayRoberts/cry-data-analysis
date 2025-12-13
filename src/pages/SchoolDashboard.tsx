import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { ComparisonBarChart, GenderDistributionChart, DemographicPieChart } from '../components/Charts';
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

export const SchoolDashboard: React.FC = () => {
  const { data: allData, loading, error } = useData({ dataPath: '/data/school_data.json' });
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

  if (loading) return <LoadingSpinner />;
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
          <li><strong>School Infrastructure:</strong> Availability of essential facilities like libraries, playgrounds, science labs, and boundary walls</li>
          <li><strong>Student Enrollment:</strong> Total student population growth from 2023 to 2024 indicating educational access expansion</li>
          <li><strong>Gender Balance:</strong> Boys vs girls enrollment in schools to ensure equitable access to education</li>
          <li><strong>Quality Indicators:</strong> Infrastructure availability correlates with learning outcomes and student retention</li>
        </ul>
        <p className="text-xs text-orange-700 mt-2 italic"><strong>Why It Matters:</strong> Schools with proper infrastructure show better learning outcomes. Low infrastructure scores indicate urgent need for resource allocation.</p>
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
                      <strong>Drinking Water:</strong> {infrastructureMetrics.totalSchools - infrastructureMetrics.drinkingWater.count} schools lack clean water - partner with local govt for borewells/purifiers
                    </div>
                  </li>
                )}
                {infrastructureMetrics && parseFloat(infrastructureMetrics.girlsToilet.percent) < 100 && (
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500 font-bold">•</span>
                    <div>
                      <strong>Girls' Toilets:</strong> Construct separate toilets in {infrastructureMetrics.totalSchools - infrastructureMetrics.girlsToilet.count} schools to improve girls' retention
                    </div>
                  </li>
                )}
                {studentGrowth < 0 && (
                  <li className="flex items-start space-x-2">
                    <span className="text-red-500 font-bold">•</span>
                    <div>
                      <strong>Enrollment Drop:</strong> Investigate reasons for {Math.abs(studentGrowth)}% decline - conduct community surveys
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
                      <strong>Libraries:</strong> Establish reading corners in {infrastructureMetrics.totalSchools - infrastructureMetrics.library.count} schools without libraries
                    </div>
                  </li>
                )}
                {infrastructureMetrics && parseFloat(infrastructureMetrics.boundary.percent) < 80 && (
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <div>
                      <strong>Safety:</strong> Complete boundary walls for {infrastructureMetrics.totalSchools - infrastructureMetrics.boundary.count} schools
                    </div>
                  </li>
                )}
                <li className="flex items-start space-x-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <div>
                    <strong>Teacher Training:</strong> Upskill teachers on digital learning tools and child-centric pedagogy
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
                      <strong>STEM Education:</strong> Establish science labs in {infrastructureMetrics.totalSchools - infrastructureMetrics.scienceLab.count} schools for hands-on learning
                    </div>
                  </li>
                )}
                {infrastructureMetrics && parseFloat(infrastructureMetrics.ramp.percent) < 50 && (
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 font-bold">•</span>
                    <div>
                      <strong>Inclusive Education:</strong> Add disability-friendly infrastructure (ramps, accessible toilets) to {infrastructureMetrics.totalSchools - infrastructureMetrics.ramp.count} schools
                    </div>
                  </li>
                )}
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 font-bold">•</span>
                  <div>
                    <strong>Digital Readiness:</strong> Equip schools with computers and internet for digital literacy programs
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
                    <strong>Target:</strong> Achieve 100% drinking water & toilet availability by end of year
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <div>
                    <strong>Target:</strong> Improve student-teacher ratio to below 30:1 (current: {studentTeacherRatio}:1)
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
    </div>
  );
};
