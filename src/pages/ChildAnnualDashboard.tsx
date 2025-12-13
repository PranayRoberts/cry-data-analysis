import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { GroupedBarChart, GenderDistributionChart } from '../components/Charts';
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
import { Users, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

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
  byAgeBand: Record<string, number>;
  byFacilityType: Record<string, number>;
  byLocationType: Record<string, number>;
  bySocialCategory: Record<string, number>;
  byReligion: Record<string, number>;
  byEducationalStatus: Record<string, number>;
  byDropoutReason: Record<string, number>;
  specialNeeds: { yes: number; no: number };
  stateYearData: Record<string, Record<string, YearData>>;
  regionYearData: Record<string, Record<string, YearData>>;
  districtYearData: Record<string, Record<string, YearData>>;
  regionDistrictMap: Record<string, string[]>;
  sampleRecords: Record<string, unknown>[];
}

export const ChildAnnualDashboard: React.FC = () => {
  const { data: summaryData, loading, error } = useData({ dataPath: '/data/child_annual_data.json' });
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

  const genderData = useMemo(() => {
    return [
      {
        category: 'Annual Enrollment',
        boys: stats2024.totalBoys,
        girls: stats2024.totalGirls,
      },
    ];
  }, [stats2024]);

  const enrollmentData = useMemo(() => {
    return [
      {
        category: 'Boys',
        '2023': stats2023.totalBoys,
        '2024': stats2024.totalBoys,
      },
      {
        category: 'Girls',
        '2023': stats2023.totalGirls,
        '2024': stats2024.totalGirls,
      },
      {
        category: 'Total',
        '2023': stats2023.totalChildren,
        '2024': stats2024.totalChildren,
      },
    ];
  }, [stats2023, stats2024]);

  const girlPercentage2023 = useMemo(() => {
    const total = stats2023.totalBoys + stats2023.totalGirls;
    return total > 0 ? ((stats2023.totalGirls / total) * 100) : 0;
  }, [stats2023]);

  const girlPercentage2024 = useMemo(() => {
    const total = stats2024.totalBoys + stats2024.totalGirls;
    return total > 0 ? ((stats2024.totalGirls / total) * 100) : 0;
  }, [stats2024]);

  // Get total records count for display (filtered or total)
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

  // Visual summary data for region overview
  const visualSummaryData = useMemo(() => {
    if (!summaryData) return null;
    const data = summaryData as SummaryData;
    const regions = ['North', 'South', 'East', 'West'];
    
    // Get region data
    const regionData = regions.map(region => {
      const regionInfo = data.byRegion?.[region] || { count: 0, boys: 0, girls: 0 };
      return {
        region,
        totalChildren: regionInfo.count,
        boys: regionInfo.boys,
        girls: regionInfo.girls,
      };
    }).filter(r => r.totalChildren > 0);

    // Calculate totals based on filter
    let totals = { totalChildren: 0, boys: 0, girls: 0 };
    if (filters.region && data.byRegion?.[filters.region]) {
      const r = data.byRegion[filters.region];
      totals = { totalChildren: r.count, boys: r.boys, girls: r.girls };
    } else {
      totals = regionData.reduce((acc, r) => ({
        totalChildren: acc.totalChildren + r.totalChildren,
        boys: acc.boys + r.boys,
        girls: acc.girls + r.girls,
      }), { totalChildren: 0, boys: 0, girls: 0 });
    }

    // Gender pie chart data
    const genderPieData = [
      { name: 'Boys', value: totals.boys, color: '#3b82f6' },
      { name: 'Girls', value: totals.girls, color: '#ec4899' },
    ];

    // Region bar chart data
    const regionBarData = regionData.map(r => ({
      name: r.region,
      Boys: r.boys,
      Girls: r.girls,
      Total: r.totalChildren,
    }));

    // Calculate gender parity percentage
    const genderParity = totals.totalChildren > 0 
      ? ((totals.girls / totals.totalChildren) * 100).toFixed(1) 
      : '0';

    return {
      regions,
      regionData,
      totals,
      genderPieData,
      regionBarData,
      genderParity,
    };
  }, [summaryData, filters.region]);

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
      <h1 className="text-4xl font-bold mb-2 text-gray-900">Annual Child Report Dashboard</h1>
      <p className="text-gray-600 mb-4">
        Annual census data tracking individual child demographics, health status, and household conditions
        <span className="ml-2 text-green-600 font-semibold">({totalRecords.toLocaleString()} records{filterDescription})</span>
      </p>
      
      {/* Contextual Information */}
      <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
        <h3 className="font-semibold text-green-900 mb-2">What This Dashboard Shows:</h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li><strong>Population Census:</strong> Total children registered and tracked in CRY intervention areas</li>
          <li><strong>Gender Parity:</strong> Boys vs girls ratio to identify gender gaps (target: 50-50 balance)</li>
          <li><strong>Growth Trends:</strong> Year-over-year changes showing program expansion or contraction</li>
          <li><strong>Geographic Reach:</strong> Regional distribution revealing coverage across states and districts</li>
        </ul>
        <p className="text-xs text-green-700 mt-2 italic"><strong>Key Insight:</strong> Use the Region and District filters below to drill down into specific areas. Percentage changes highlight program growth; gender distribution shows inclusivity.</p>
      </div>

      {/* Data Collection Timing Explanation */}
      <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg">
        <h3 className="font-semibold text-amber-900 mb-2">Important: Understanding the 2024 Data (-66% shown)</h3>
        <p className="text-sm text-amber-800 mb-2">
          The apparent decrease in 2024 is due to <strong>data collection timing differences</strong>, not program decline:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-amber-800">
          <div className="bg-white p-3 rounded">
            <p className="font-semibold text-amber-900">2023 Data Collection:</p>
            <ul className="list-disc ml-4 mt-1 space-y-1">
              <li>Oct 2023 - Feb 2024 (5 months)</li>
              <li>Peak: Jan 2024 = 193,105 records</li>
              <li>Total: 377,133 records (full cycle)</li>
            </ul>
          </div>
          <div className="bg-white p-3 rounded">
            <p className="font-semibold text-amber-900">2024 Data Collection:</p>
            <ul className="list-disc ml-4 mt-1 space-y-1">
              <li>Aug 2024 - Dec 2024 (4 months so far)</li>
              <li>Peak: Nov 2024 = 68,768 records</li>
              <li>Total: 126,502 records (ongoing)</li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-amber-700 mt-3 italic">
          <strong>Note:</strong> The 2024 data was exported mid-cycle. Expect similar numbers to 2023 once the full collection period (through Feb 2025) is complete.
        </p>
      </div>

      {/* Visual Summary Section - Children Overview by Region */}
      {visualSummaryData && (
        <Section title="Children Overview by Region">
          {/* Region Filter Buttons */}
          <div className="mb-6 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-600" />
              <span className="font-medium text-gray-700">Quick Region Filter:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['All', ...visualSummaryData.regions].map(region => (
                <button
                  key={region}
                  onClick={() => setFilters(region === 'All' ? {} : { region })}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    (region === 'All' && !filters.region) || filters.region === region
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
            {filters.region && (
              <span className="text-sm text-green-600 font-medium">
                Showing data for {filters.region} region
              </span>
            )}
          </div>

          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Children Card */}
            <div className="bg-white border-2 border-green-500 p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Users size={32} className="text-green-600" />
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {filters.region || 'All Regions'}
                </span>
              </div>
              <div className="text-4xl font-bold mb-1 text-gray-900">
                {visualSummaryData.totals.totalChildren.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Children (2023-2024)</div>
            </div>

            {/* Boys Card */}
            <div className="bg-white border-2 border-sky-500 p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">👦</span>
                <span className="text-xs bg-sky-100 text-sky-800 px-2 py-1 rounded-full">
                  {visualSummaryData.totals.totalChildren > 0 
                    ? ((visualSummaryData.totals.boys / visualSummaryData.totals.totalChildren) * 100).toFixed(1) 
                    : 0}%
                </span>
              </div>
              <div className="text-4xl font-bold mb-1 text-gray-900">
                {visualSummaryData.totals.boys.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Boys</div>
            </div>

            {/* Girls Card */}
            <div className="bg-white border-2 border-pink-500 p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">👧</span>
                <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded-full">
                  {visualSummaryData.genderParity}%
                </span>
              </div>
              <div className="text-4xl font-bold mb-1 text-gray-900">
                {visualSummaryData.totals.girls.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Girls</div>
            </div>

            {/* Gender Parity Card */}
            <div className="bg-white border-2 border-purple-500 p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">⚖️</span>
                {parseFloat(visualSummaryData.genderParity) >= 48 ? (
                  <TrendingUp size={20} className="text-green-600" />
                ) : (
                  <TrendingDown size={20} className="text-red-600" />
                )}
              </div>
              <div className="text-4xl font-bold mb-1 text-gray-900">
                {visualSummaryData.genderParity}%
              </div>
              <div className="text-sm text-gray-600">Girls' Share (Target: 50%)</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gender Pie Chart */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Gender Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <Pie
                    data={visualSummaryData.genderPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={false}
                  >
                    {visualSummaryData.genderPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry: any) => {
                      const item = visualSummaryData.genderPieData.find(d => d.name === value);
                      return `${value}: ${item ? item.value.toLocaleString() : ''}`;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Stats below chart 
              <div className="mt-2 grid grid-cols-2 gap-4 text-center">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{visualSummaryData.totals.boys.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Boys ({((visualSummaryData.totals.boys / visualSummaryData.totals.totalChildren) * 100).toFixed(1)}%)</div>
                </div>
                <div className="bg-pink-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-pink-600">{visualSummaryData.totals.girls.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Girls ({((visualSummaryData.totals.girls / visualSummaryData.totals.totalChildren) * 100).toFixed(1)}%)</div>
                </div>
              </div>
              */}
            </div>

            {/* Region Bar Chart */}
            <div className="bg-white p-6 rounded-xl shadow-lg lg:col-span-2">
              <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Children by Region & Gender</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={visualSummaryData.regionBarData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}K` : value} />
                  <Tooltip 
                    formatter={(value: number) => value.toLocaleString()}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend />
                  <Bar dataKey="Boys" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Girls" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Region Details Table */}
          <div className="mt-6 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="text-lg font-bold text-gray-800">Regional Breakdown (Child Annual Data)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Children</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Boys</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Girls</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Girls %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {visualSummaryData.regionData.map((region, idx) => (
                    <tr 
                      key={region.region} 
                      className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${filters.region === region.region ? 'bg-green-50' : ''} hover:bg-green-50 cursor-pointer transition-colors`}
                      onClick={() => setFilters({ region: region.region })}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            region.region === 'North' ? 'bg-blue-500' :
                            region.region === 'South' ? 'bg-green-500' :
                            region.region === 'East' ? 'bg-yellow-500' : 'bg-purple-500'
                          }`}></div>
                          <span className="font-medium text-gray-900">{region.region}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                        {region.totalChildren.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-blue-600 font-medium">
                        {region.boys.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-pink-600 font-medium">
                        {region.girls.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (region.girls / region.totalChildren) >= 0.48 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {((region.girls / region.totalChildren) * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-gray-100 font-bold">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">Total</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                      {visualSummaryData.regionData.reduce((sum, r) => sum + r.totalChildren, 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-blue-700">
                      {visualSummaryData.regionData.reduce((sum, r) => sum + r.boys, 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-pink-700">
                      {visualSummaryData.regionData.reduce((sum, r) => sum + r.girls, 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {(() => {
                          const totalKids = visualSummaryData.regionData.reduce((sum, r) => sum + r.totalChildren, 0);
                          const totalGirls = visualSummaryData.regionData.reduce((sum, r) => sum + r.girls, 0);
                          return totalKids > 0 ? ((totalGirls / totalKids) * 100).toFixed(1) : '0';
                        })()}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-gray-50 border-t text-xs text-gray-500 italic">
              Click on any region row to filter the dashboard by that region
            </div>
          </div>
        </Section>
      )}

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
            label="Girl Child % (2024)"
            value={girlPercentage2024.toFixed(1)}
            unit="%"
            trend={girlPercentage2024 >= girlPercentage2023 ? 'up' : 'down'}
            percentChange={parseFloat((girlPercentage2024 - girlPercentage2023).toFixed(2))}
          />
        </DashboardGrid>
      </Section>

      <Section title="Enrollment Trend">
        <ChartContainer>
          <GroupedBarChart
            data={enrollmentData}
            xKey="category"
            lines={[
              { key: '2023', name: '2023', color: '#ef4444' },
              { key: '2024', name: '2024', color: '#10b981' },
            ]}
            title="Annual Enrollment Growth (2023 vs 2024)"
            height={400}
            domain={[200, 'dataMax']}
          />
        </ChartContainer>
        <p className="text-sm text-gray-600 mt-2">
          Comparison of boys, girls, and total children enrolled in annual census
        </p>
      </Section>

      <Section title="Gender Distribution">
        <ChartContainer>
          <GenderDistributionChart data={genderData} title="Boys vs Girls Annual" height={400} />
        </ChartContainer>
      </Section>

      {/* Summary & Key Takeaways */}
      <Section title="Summary & Key Insights">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Data Status */}
            <div className="bg-white p-4 rounded-lg border-l-4 border-amber-500">
              <h4 className="font-bold text-amber-800 mb-2">Data Collection Status</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>2023:</strong> Complete cycle (377K records)</li>
                <li><strong>2024:</strong> Partial (~34% of expected)</li>
                <li><strong>Cumulative:</strong> 503,635 records</li>
                <li><strong>Next Update:</strong> Feb 2025</li>
              </ul>
            </div>

            {/* Gender Parity */}
            <div className="bg-white p-4 rounded-lg border-l-4 border-pink-500">
              <h4 className="font-bold text-pink-800 mb-2">Gender Parity Analysis</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>Girls (2024):</strong> {girlPercentage2024.toFixed(1)}% ({stats2024.totalGirls.toLocaleString()})</li>
                <li><strong>Boys (2024):</strong> {(100 - girlPercentage2024).toFixed(1)}% ({stats2024.totalBoys.toLocaleString()})</li>
                <li><strong>Status:</strong> {girlPercentage2024 >= 48 ? '✓ Near parity' : '⚠ Gap exists'}</li>
                <li><strong>Trend:</strong> {girlPercentage2024 >= girlPercentage2023 ? '↑ Improving' : '↓ Slight decline'}</li>
              </ul>
            </div>

            {/* Coverage */}
            <div className="bg-white p-4 rounded-lg border-l-4 border-pink-500">
              <h4 className="font-bold text-blue-800 mb-2">Geographic Coverage</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>Regions:</strong> 4 (North, South, East, West)</li>
                <li><strong>Districts:</strong> 105+</li>
                <li><strong>Current Filter:</strong> {filterDescription || 'All India'}</li>
                <li><strong>Filtered Count:</strong> {totalRecords.toLocaleString()}</li>
              </ul>
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-white p-4 rounded-lg mb-6">
            <h4 className="font-bold text-gray-900 mb-3">Key Insights for Leadership</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-green-700 mb-1">Positive Indicators:</p>
                <ul className="text-gray-700 space-y-1 list-disc ml-4">
                  <li>Gender ratio stable at ~{girlPercentage2024.toFixed(0)}% girls (near parity)</li>
                  <li>Data collection infrastructure working effectively</li>
                  <li>Multi-state reach demonstrates program scale</li>
                  <li>Consistent tracking methodology enables YoY analysis</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-amber-700 mb-1">Points to Note:</p>
                <ul className="text-gray-700 space-y-1 list-disc ml-4">
                  <li>2024 data is partial - full comparison after Feb 2025</li>
                  <li>-66% shown is timing difference, not actual decline</li>
                  <li>Peak data entry months (Jan-Feb) still ahead</li>
                  <li>Use cumulative 503K for impact reporting</li>
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
                    <strong>Complete 2024 Census:</strong> Ensure all field teams complete data entry by Feb 2025
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold">•</span>
                  <div>
                    <strong>State Performance:</strong> Identify states lagging in 2024 submissions and deploy support
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold">•</span>
                  <div>
                    <strong>Gender Monitoring:</strong> Track weekly gender ratio to ensure parity is maintained
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
                    <strong>Data Quality Audit:</strong> Review and clean duplicates, validate accuracy
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <div>
                    <strong>Low-Performing Districts:</strong> Deploy additional resources to districts with low counts
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <div>
                    <strong>Health Integration:</strong> Link census data with nutrition and health interventions
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
                    <strong>Geographic Expansion:</strong> Extend coverage to new underserved districts
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 font-bold">•</span>
                  <div>
                    <strong>Digital Census:</strong> Explore mobile-based data collection for faster updates
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 font-bold">•</span>
                  <div>
                    <strong>Outcome Tracking:</strong> Link census to education and health outcomes for impact measurement
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
                    <strong>Target:</strong> Match 2023 count (377K) by Feb 2025
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <div>
                    <strong>Target:</strong> Maintain gender parity within 2% of 50-50
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <div>
                    <strong>Target:</strong> 100% district coverage in all 4 regions
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <div>
                    <strong>Target:</strong> Reduce data entry lag to under 30 days
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Reference */}
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-bold text-gray-900 mb-3">Quick Reference: Key Numbers</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xl font-bold text-green-600">503,635</div>
                <div className="text-gray-600">Cumulative Records</div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xl font-bold text-blue-600">377,133</div>
                <div className="text-gray-600">2023 Complete</div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xl font-bold text-amber-600">126,502</div>
                <div className="text-gray-600">2024 (Partial)</div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xl font-bold text-pink-600">{girlPercentage2024.toFixed(1)}%</div>
                <div className="text-gray-600">Girls Percentage</div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
};
