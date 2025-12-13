import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { ComparisonBarChart, GenderDistributionChart } from '../components/Charts';
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

  if (loading) return <LoadingSpinner />;
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
          <li><strong>Enrollment Status:</strong> Track children actively attending school vs dropouts to measure educational continuity</li>
          <li><strong>Gender in Education:</strong> Boys vs girls enrollment to ensure equal educational opportunities (SDG 5: Gender Equality)</li>
          <li><strong>Year-over-Year Progress:</strong> Compare 2023 vs 2024 to identify improvements or areas needing intervention</li>
          <li><strong>Regional Disparities:</strong> Use the Region and District filters to identify geographic areas with low enrollment or high dropout rates</li>
        </ul>
        <p className="text-xs text-purple-700 mt-2 italic"><strong>Action Point:</strong> Red arrows indicate declining metrics requiring immediate attention; green arrows show positive impact of interventions.</p>
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
                    <strong>Dropout Investigation:</strong> Identify districts with highest dropout rates and conduct household surveys
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold">•</span>
                  <div>
                    <strong>Girls' Retention:</strong> Launch targeted campaigns in areas where girls' enrollment dropped
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold">•</span>
                  <div>
                    <strong>School Sanitation:</strong> Audit schools for girls' toilets and menstrual hygiene facilities
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
                    <strong>Scholarship Programs:</strong> Expand financial support for at-risk students, prioritizing girls
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <div>
                    <strong>Community Awareness:</strong> Conduct parent meetings on importance of continuous education
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <div>
                    <strong>Safe Transport:</strong> Partner with local authorities for safe school transport options
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
                    <strong>Skill Development:</strong> Introduce vocational training to improve school-to-work transition
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 font-bold">•</span>
                  <div>
                    <strong>Digital Learning:</strong> Expand digital literacy programs in underserved areas
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 font-bold">•</span>
                  <div>
                    <strong>Teacher Training:</strong> Invest in quality teaching through regular upskilling programs
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
                    <strong>Target:</strong> Achieve 50% gender parity (current: {genderParity2024.toFixed(1)}%)
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <div>
                    <strong>Target:</strong> Reduce dropout rate by 10% year-over-year
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
    </div>
  );
};
