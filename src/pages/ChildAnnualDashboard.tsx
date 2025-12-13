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
import { Users, Filter, TrendingUp, TrendingDown, Activity } from 'lucide-react';

// Interface for NFHS-5 education data
interface NFHS5EducationData {
  source: string;
  description: string;
  indicators: Record<string, string>;
  notes: string;
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

// Interface for NFHS-5 nutrition data
interface NFHS5NutritionData {
  source: string;
  india_average: {
    stunting: number;
    wasting: number;
    underweight: number;
  };
  state_data: Record<string, {
    stunting: number;
    wasting: number;
    underweight: number;
  }>;
}
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
  const { data: nfhs5EducationData, loading: nfhs5EduLoading } = useData({ dataPath: '/data/nfhs5_education_data.json' });
  const { data: nfhs5NutritionData, loading: nfhs5NutLoading } = useData({ dataPath: '/data/nfhs5_nutrition_data.json' });
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

  // Equity analysis from location type data (Rural vs Urban)
  const equityAnalysis = useMemo(() => {
    if (!summaryData) return [];
    const data = summaryData as SummaryData;
    if (!data.byLocationType) return [];
    
    return Object.entries(data.byLocationType)
      .filter(([category]) => category !== 'Unknown' && category !== 'None' && category !== 'null')
      .map(([category, count]) => {
        // For location type, we need to estimate boys/girls from overall ratio
        const totalBoys = Object.values(data.byYear).reduce((sum, y) => sum + y.boys, 0);
        const totalGirls = Object.values(data.byYear).reduce((sum, y) => sum + y.girls, 0);
        const total = totalBoys + totalGirls;
        const ratio = total > 0 ? totalGirls / total : 0.5;
        
        const estimatedGirls = Math.round(count * ratio);
        const estimatedBoys = count - estimatedGirls;
        
        return {
          category,
          totalChildren: count,
          boys: estimatedBoys,
          girls: estimatedGirls,
          genderRatio: count > 0 ? (estimatedGirls / count) * 100 : 0,
        };
      })
      .sort((a, b) => b.totalChildren - a.totalChildren);
  }, [summaryData]);

  // NFHS-5 comparison data - focused on DEMOGRAPHIC indicators relevant to Child Annual Census
  const nfhs5Comparison = useMemo(() => {
    if (!summaryData || !nfhs5EducationData || !nfhs5NutritionData) return null;
    
    const data = summaryData as SummaryData;
    const nfhsEdu = nfhs5EducationData as NFHS5EducationData;
    const nfhsNut = nfhs5NutritionData as NFHS5NutritionData;
    
    // Get CRY states
    const cryStates = Object.keys(data.byState || {}).filter(s => s !== 'Unknown');
    
    // Match CRY states with NFHS-5 data - focus on DEMOGRAPHIC indicators
    const stateComparisons = cryStates.map(state => {
      const cryData = data.byState[state];
      const nfhsEduState = nfhsEdu.state_data[state];
      const nfhsNutState = nfhsNut.state_data[state];
      
      if (!nfhsEduState || !nfhsNutState) return null;
      
      // Calculate CRY gender ratio (girls per 1000 boys)
      const cryGenderRatio = cryData.boys > 0 
        ? Math.round((cryData.girls / cryData.boys) * 1000)
        : 0;
      
      return {
        state,
        cryChildren: cryData.count,
        cryBoys: cryData.boys,
        cryGirls: cryData.girls,
        cryGenderRatio,
        // Demographic indicators (relevant to annual census)
        nfhsSexRatio: nfhsEduState.sex_ratio_birth,
        nfhsBirthRegistration: nfhsEduState.children_under_5, // % children under 5 registered at birth
        nfhsInstitutionalBirths: nfhsEduState.institutional_births,
        nfhsImmunization: nfhsEduState.immunization_full,
        // Key nutrition indicators for child health baseline
        nfhsStunting: nfhsNutState.stunting,
        nfhsWasting: nfhsNutState.wasting,
      };
    }).filter(Boolean);
    
    // Chart data for gender ratio comparison (CRY vs state sex ratio)
    const genderRatioChartData = stateComparisons
      .slice(0, 10)
      .map(s => ({
        state: s!.state.length > 12 ? s!.state.substring(0, 10) + '..' : s!.state,
        'CRY Gender Ratio': s!.cryGenderRatio,
        'NFHS-5 Sex Ratio': s!.nfhsSexRatio,
      }));
    
    // Chart data for birth registration & institutional care (demographic indicators)
    const demographicChartData = stateComparisons
      .slice(0, 10)
      .map(s => ({
        state: s!.state.length > 12 ? s!.state.substring(0, 10) + '..' : s!.state,
        'Birth Registration %': s!.nfhsBirthRegistration,
        'Institutional Births %': s!.nfhsInstitutionalBirths,
      }));

    // Chart data for child health baseline (stunting + wasting = chronic + acute malnutrition)
    const childHealthChartData = stateComparisons
      .slice(0, 10)
      .map(s => ({
        state: s!.state.length > 12 ? s!.state.substring(0, 10) + '..' : s!.state,
        'Stunting %': s!.nfhsStunting,
        'Wasting %': s!.nfhsWasting,
        'Immunization %': s!.nfhsImmunization,
      }));
    
    return {
      stateComparisons,
      genderRatioChartData,
      demographicChartData,
      childHealthChartData,
      indiaAverage: {
        edu: nfhsEdu.india_average,
        nut: nfhsNut.india_average,
      },
      source: nfhsEdu.source,
    };
  }, [summaryData, nfhs5EducationData, nfhs5NutritionData]);

  const isLoading = loading || nfhs5EduLoading || nfhs5NutLoading;
  
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
      <h1 className="text-4xl font-bold mb-2 text-gray-900">Annual Child Report Dashboard</h1>
      <p className="text-gray-600 mb-4">
        Annual census data tracking individual child demographics, health status, and household conditions
        <span className="ml-2 text-green-600 font-semibold">({totalRecords.toLocaleString()} records{filterDescription})</span>
      </p>
      
      {/* Contextual Information */}
      <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
        <h3 className="font-semibold text-green-900 mb-2">What This Dashboard Shows:</h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li><strong>Population Census:</strong> 503,635 children tracked across 2023-2024 annual surveys in CRY intervention areas</li>
          <li><strong>Gender Parity:</strong> Near 50-50 gender balance with ~49% girls enrollment, aligned with SDG 5 targets</li>
          <li><strong>NFHS-5 Baseline (2019-21):</strong> CRY data compared with national sex ratio, birth registration, and immunization benchmarks</li>
          <li><strong>Multi-State Reach:</strong> Coverage across 4 regions, 105+ districts with state-wise and district-wise filtering</li>
        </ul>
        <p className="text-xs text-green-700 mt-2 italic"><strong>Key Insight:</strong> 2024 data shows partial collection (~126K vs 377K in 2023) due to data export timing. Full comparison available after Feb 2025.</p>
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
                    formatter={(value, _entry: any) => {
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

      {/* Equity Analysis: Rural vs Urban */}
      {equityAnalysis && equityAnalysis.length > 0 && (
        <Section title="Equity Analysis: Rural vs Urban">
          <div className="mb-4 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded">
            <p className="text-sm text-gray-700">
              <strong>Insight:</strong> Compare rural and urban children's access to programs. 
              Ensure gender balance (girls ~50%) and equitable coverage across geographic categories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equityAnalysis.map((equity, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow-md border-t-4 border-indigo-500">
                <h4 className="font-bold text-gray-900 mb-4 text-lg">{equity.category}</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Children:</span>
                    <span className="font-bold text-gray-900">{equity.totalChildren.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Boys:</span>
                    <span className="font-bold text-blue-600">{equity.boys.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Girls:</span>
                    <span className="font-bold text-pink-600">{equity.girls.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="text-gray-600">Girls %:</span>
                    <span className={`font-bold ${
                      equity.genderRatio > 48 && equity.genderRatio < 52 ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {equity.genderRatio.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

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
                    <strong>Complete 2024 Census:</strong> Current data at 126K vs 377K target - accelerate field team data entry by Feb 2025
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold">•</span>
                  <div>
                    <strong>NFHS-5 Baseline Alignment:</strong> Focus on states with poor sex ratios per 2019-21 data (Haryana, Punjab) - ensure CRY programs maintain gender parity
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold">•</span>
                  <div>
                    <strong>Birth Registration:</strong> Coordinate with states having low birth registration (&lt;80%) to ensure enrolled children are documented
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
                    <strong>Data Quality Audit:</strong> Review 503K+ records for duplicates and accuracy - validate across 105+ districts
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <div>
                    <strong>Immunization Linkage:</strong> Cross-reference with NFHS-5 (2019-21) immunization data - target states below 70% coverage
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <div>
                    <strong>Gender Ratio Action:</strong> Deploy targeted interventions in states where girls' percentage is below 48%
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
                    <strong>Geographic Expansion:</strong> Extend to new high-need districts identified via NFHS-5 (2019-21) indicators
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 font-bold">•</span>
                  <div>
                    <strong>Nutrition Integration:</strong> Link census data with NFHS-5 (2019-21) malnutrition hotspots for targeted health interventions
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 font-bold">•</span>
                  <div>
                    <strong>Impact Measurement:</strong> Compare CRY children's outcomes against NFHS-5 (2019-21) baselines to demonstrate progress
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
                    <strong>Target:</strong> Match 2023 count (377K) by Feb 2025 - currently at 34%
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

      {/* NFHS-5 Comparison Section */}
      {nfhs5Comparison && (
        <Section title="CRY Data vs NFHS-5 National Indicators (2019-2021 Baseline)">
          <div className="mb-4 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-l-4 border-teal-500 rounded">
            <div className="flex items-start gap-3">
              <Activity className="text-teal-600 mt-1" size={24} />
              <div>
                <h3 className="font-semibold text-teal-900 mb-2">Contextualizing CRY's Impact with NFHS-5 Baseline Data</h3>
                <p className="text-sm text-gray-700 mb-2">
                  The <strong>National Family Health Survey (NFHS-5)</strong> provides baseline health, education, and demographic 
                  indicators for each state. Comparing CRY program data against these national benchmarks helps understand:
                </p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc ml-5">
                  <li><strong>Gender equity:</strong> How CRY's girl-boy ratio compares to national sex ratios</li>
                  <li><strong>Education context:</strong> School attendance rates in CRY intervention states</li>
                  <li><strong>Nutrition challenges:</strong> Stunting, underweight, and anemia levels that affect children</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2 italic">
                  Source: {nfhs5Comparison.source}
                </p>
              </div>
            </div>
          </div>

          {/* Gender Ratio Comparison Chart */}
          <div className="mb-6">
            <ChartContainer>
              <h3 className="text-lg font-semibold mb-2 text-center">
                Gender Ratio Comparison: CRY (2023-24) vs NFHS-5 Baseline (2019-21)
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                CRY Gender Ratio = Girls per 1000 Boys | NFHS-5 Sex Ratio = Females per 1000 Males at Birth
              </p>
              <GroupedBarChart
                data={nfhs5Comparison.genderRatioChartData}
                xKey="state"
                lines={[
                  { key: 'CRY Gender Ratio', name: 'CRY Gender Ratio', color: '#ec4899' },
                  { key: 'NFHS-5 Sex Ratio', name: 'NFHS-5 Sex Ratio', color: '#06b6d4' },
                ]}
                title=""
                height={350}
              />
            </ChartContainer>
          </div>

          {/* Demographic Indicators - Birth Registration & Institutional Care */}
          <div className="mb-6">
            <ChartContainer>
              <h3 className="text-lg font-semibold mb-2 text-center">
                Birth Registration & Maternal Healthcare Coverage (NFHS-5: 2019-21)
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Birth registration (under 5) and institutional birth rates - higher is better
              </p>
              <GroupedBarChart
                data={nfhs5Comparison.demographicChartData}
                xKey="state"
                lines={[
                  { key: 'Birth Registration %', name: 'Birth Registration %', color: '#8b5cf6' },
                  { key: 'Institutional Births %', name: 'Institutional Births %', color: '#10b981' },
                ]}
                title=""
                height={350}
              />
            </ChartContainer>
          </div>

          {/* Child Health Baseline */}
          <div className="mb-6">
            <ChartContainer>
              <h3 className="text-lg font-semibold mb-2 text-center">
                Child Health Baseline in CRY States (NFHS-5: 2019-21)
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Stunting (chronic), wasting (acute malnutrition), and immunization coverage
              </p>
              <GroupedBarChart
                data={nfhs5Comparison.childHealthChartData}
                xKey="state"
                lines={[
                  { key: 'Stunting %', name: 'Stunting %', color: '#ef4444' },
                  { key: 'Wasting %', name: 'Wasting %', color: '#f97316' },
                  { key: 'Immunization %', name: 'Immunization %', color: '#10b981' },
                ]}
                title=""
                height={350}
              />
            </ChartContainer>
          </div>

          {/* India Average Reference - Demographic Indicators */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="font-bold text-gray-900 mb-4">India Average (NFHS-5: 2019-21 Demographic Benchmarks)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-cyan-50 rounded-lg">
                <p className="text-2xl font-bold text-cyan-700">{nfhs5Comparison.indiaAverage.edu.sex_ratio_birth}</p>
                <p className="text-xs text-gray-600">Sex Ratio at Birth</p>
                <p className="text-xs text-gray-400">(females/1000 males)</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{nfhs5Comparison.indiaAverage.edu.immunization_full}%</p>
                <p className="text-xs text-gray-600">Full Immunization</p>
                <p className="text-xs text-gray-400">(12-23 months)</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-700">{nfhs5Comparison.indiaAverage.edu.institutional_births}%</p>
                <p className="text-xs text-gray-600">Institutional Births</p>
                <p className="text-xs text-gray-400">(healthcare facility)</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">{nfhs5Comparison.indiaAverage.edu.children_under_5}%</p>
                <p className="text-xs text-gray-600">Birth Registration</p>
                <p className="text-xs text-gray-400">(under 5 years)</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-700">{nfhs5Comparison.indiaAverage.nut.stunting}%</p>
                <p className="text-xs text-gray-600">Stunting</p>
                <p className="text-xs text-gray-400">(chronic malnutrition)</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-700">{nfhs5Comparison.indiaAverage.nut.wasting}%</p>
                <p className="text-xs text-gray-600">Wasting</p>
                <p className="text-xs text-gray-400">(acute malnutrition)</p>
              </div>
            </div>
          </div>

          {/* Key Insights from Comparison */}
          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
            <h4 className="font-bold text-gray-900 mb-3">Key Demographic Insights from CRY-NFHS Comparison</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-4 rounded-lg border-l-4 border-pink-500">
                <h5 className="font-semibold text-pink-800 mb-2">Gender Parity at Birth</h5>
                <p className="text-gray-700">
                  CRY's gender ratio in enrolled children can be compared against NFHS-5 sex ratio at birth 
                  to assess if programs are reaching girls equitably. A CRY ratio above the state's NFHS sex ratio 
                  indicates strong girls' enrollment.
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                <h5 className="font-semibold text-green-800 mb-2">Immunization Coverage</h5>
                <p className="text-gray-700">
                  States with lower immunization rates (below 76% national average) represent areas where 
                  CRY's health interventions can focus on improving child vaccination coverage for 12-23 month olds.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                <h5 className="font-semibold text-purple-800 mb-2">Maternal Healthcare</h5>
                <p className="text-gray-700">
                  Institutional birth rates indicate healthcare access. States below the 89% national average 
                  may need additional support for maternal health services and safe delivery facilities.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                <h5 className="font-semibold text-blue-800 mb-2">Birth Registration</h5>
                <p className="text-gray-700">
                  Birth registration is crucial for children's access to education, healthcare, and legal rights. 
                  Areas with lower registration rates need targeted interventions to ensure all children are documented.
                </p>
              </div>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
};
