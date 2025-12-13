import React, { useMemo, useState } from 'react';
import { useData } from '../hooks/useData';
import {
  LoadingSpinner,
  ChartContainer,
  Section,
} from '../components/Dashboard';
import { GroupedBarChart } from '../components/Charts';
import { TrendingUp, TrendingDown, MapPin } from 'lucide-react';

// Interface for NFHS-5 nutrition data
interface NFHS5StateData {
  stunting: number;
  wasting: number;
  underweight: number;
}

interface NFHS5Data {
  source: string;
  description: string;
  indicators: Record<string, string>;
  notes: string;
  india_average: NFHS5StateData;
  state_data: Record<string, NFHS5StateData>;
}

// Interface for insights data with correlations
interface StateCorrelation {
  state: string;
  cryChildren: number;
  cryBoys: number;
  cryGirls: number;
  nfhs5_underweight: number;
  nfhs5_stunting: number;
  nfhs5_wasting: number;
  underweight_vs_avg: number;
  stunting_vs_avg: number;
  wasting_vs_avg: number;
  districts: string[];
}

interface InsightsData {
  stateList: string[];
  districtsByState: Record<string, string[]>;
  nfhs5: {
    indiaAverage: NFHS5StateData;
    stateData: Record<string, NFHS5StateData>;
  };
  cryStateData: Record<string, {
    totalChildren: number;
    boys: number;
    girls: number;
    districts: Record<string, { totalChildren: number; boys: number; girls: number }>;
  }>;
  stateCorrelations: StateCorrelation[];
}

// Component: Key Insights & Trends Dashboard
export const InsightsAndTrends: React.FC = () => {
  // Data fetching hooks
  const { loading: childLoading } = useData({
    dataPath: '/data/child_annual_data.json',
  });
  const { loading: educationLoading } = useData({
    dataPath: '/data/child_education_data.json',
  });
  const { loading: schoolLoading } = useData({
    dataPath: '/data/school_data.json',
  });
  const { loading: anganwadiLoading } = useData({
    dataPath: '/data/anganwadi_data.json',
  });
  const { data: nfhs5Data, loading: nfhs5Loading } = useData({
    dataPath: '/data/nfhs5_nutrition_data.json',
  });
  const { data: insightsData, loading: insightsLoading } = useData({
    dataPath: '/data/insights_data.json',
  });

  // State hooks for filters
  const [selectedMetric, setSelectedMetric] = useState<'underweight' | 'stunting' | 'wasting'>('underweight');
  const [selectedState, setSelectedState] = useState<string>('All States');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');

  // Get available states and districts from insights data
  const { availableStates, availableDistricts } = useMemo(() => {
    const insights = insightsData as InsightsData | null;
    if (!insights) {
      return { availableStates: [], availableDistricts: [] };
    }

    const states = insights.stateList || [];
    const districts = selectedState !== 'All States' && insights.districtsByState
      ? insights.districtsByState[selectedState] || []
      : [];

    return { availableStates: states, availableDistricts: districts };
  }, [insightsData, selectedState]);

  // Reset district when state changes
  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict('All Districts');
  };

  // Generate nutrition trends from NFHS-5 official government data
  const nutritionAnalysis = useMemo(() => {
    if (!nfhs5Data || !(nfhs5Data as NFHS5Data).state_data) return null;

    const nfhs = nfhs5Data as NFHS5Data;
    const comparisons: any[] = [];
    const indiaAvg = nfhs.india_average;
    
    // Use real NFHS-5 state-wise nutrition data
    Object.entries(nfhs.state_data).forEach(([state, data]) => {
      // NFHS-5 provides 2019-2021 data - we show actual values
      // For comparison, we use India average as baseline to show relative performance
      
      ['underweight', 'stunting', 'wasting'].forEach((metric) => {
        const stateValue = data[metric as keyof NFHS5StateData];
        const avgValue = indiaAvg[metric as keyof NFHS5StateData];
        
        comparisons.push({
          location: state,
          metric,
          value2023: avgValue, // India average as baseline
          value2024: stateValue, // Actual state value
          change: stateValue - avgValue, // Difference from national average
          isNFHS5: true, // Flag that this is real NFHS-5 data
        });
      });
    });
    
    return { 
      comparisons,
      source: nfhs.source,
      indiaAverage: indiaAvg,
    };
  }, [nfhs5Data]);

  // Prepare nutrition chart data - filter by selected state
  const nutritionChartData = useMemo(() => {
    if (!nutritionAnalysis) return [];

    let filteredComparisons = nutritionAnalysis.comparisons
      .filter((c: any) => c.metric === selectedMetric);

    // Apply state filter
    if (selectedState !== 'All States') {
      filteredComparisons = filteredComparisons.filter((c: any) => 
        c.location.toLowerCase() === selectedState.toLowerCase()
      );
    }

    filteredComparisons = filteredComparisons
      .sort((a: any, b: any) => a.change - b.change)
      .slice(0, 15);

    return filteredComparisons.map((c: any) => ({
      location: c.location, // Full state name - no truncation
      '2023': parseFloat(c.value2023.toFixed(1)),
      '2024': parseFloat(c.value2024.toFixed(1)),
    }));
  }, [nutritionAnalysis, selectedMetric, selectedState]);

  // CRY-NFHS5 Correlation analysis
  const correlationAnalysis = useMemo(() => {
    const insights = insightsData as InsightsData | null;
    if (!insights || !insights.stateCorrelations) return null;

    let correlations = insights.stateCorrelations;

    // Filter by selected state
    if (selectedState !== 'All States') {
      correlations = correlations.filter(c => c.state === selectedState);
    }

    // Calculate priority scores (higher = needs more attention)
    const withPriority = correlations.map(c => ({
      ...c,
      priorityScore: (c.underweight_vs_avg + c.stunting_vs_avg + c.wasting_vs_avg) / 3,
      interventionNeeded: c.underweight_vs_avg > 0 || c.stunting_vs_avg > 0 || c.wasting_vs_avg > 0,
    }));

    // Sort by priority (worst first)
    const sorted = withPriority.sort((a, b) => b.priorityScore - a.priorityScore);

    return {
      all: sorted,
      highPriority: sorted.filter(c => c.priorityScore > 5).slice(0, 5),
      performing: sorted.filter(c => c.priorityScore < 0).slice(-5).reverse(),
      totalCryChildren: correlations.reduce((sum, c) => sum + c.cryChildren, 0),
    };
  }, [insightsData, selectedState]);

  // District-level data for selected state
  const districtData = useMemo(() => {
    const insights = insightsData as InsightsData | null;
    if (!insights || selectedState === 'All States') return null;

    const stateData = insights.cryStateData?.[selectedState];
    if (!stateData || !stateData.districts) return null;

    return Object.entries(stateData.districts)
      .map(([district, data]) => ({
        district,
        ...data,
      }))
      .sort((a, b) => b.totalChildren - a.totalChildren);
  }, [insightsData, selectedState]);

  // Chart data for CRY Program Reach by State
  const cryReachChartData = useMemo(() => {
    if (!correlationAnalysis) return [];

    return correlationAnalysis.all
      .slice(0, 12)
      .map(c => ({
        state: c.state, // Full state name
        'CRY Children': c.cryChildren,
        'Boys': c.cryBoys,
        'Girls': c.cryGirls,
      }));
  }, [correlationAnalysis]);

  // Chart data for Nutrition vs CRY Reach (scatter-like bar chart)
  const nutritionVsReachChartData = useMemo(() => {
    if (!correlationAnalysis) return [];

    return correlationAnalysis.all
      .slice(0, 10)
      .map(c => ({
        state: c.state, // Full state name
        'Underweight %': c.nfhs5_underweight,
        'Stunting %': c.nfhs5_stunting,
        'Wasting %': c.nfhs5_wasting,
      }));
  }, [correlationAnalysis]);

  // District chart data
  const districtChartData = useMemo(() => {
    if (!districtData) return [];

    return districtData.slice(0, 10).map(d => ({
      district: d.district, // Full district name
      'Total Children': d.totalChildren,
      'Boys': d.boys,
      'Girls': d.girls,
    }));
  }, [districtData]);

  // Loading check
  const loading = childLoading || educationLoading || schoolLoading || anganwadiLoading || nfhs5Loading || insightsLoading;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-3">Key Insights & Trends</h1>
        <p className="text-xl text-gray-600 mb-4">
          Deep-dive analysis of nutrition trends and CRY program correlations with NFHS-5 government data
        </p>

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg shadow-md">
          <h3 className="font-semibold text-purple-900 mb-2">What You'll Find Here:</h3>
          <ul className="text-sm text-purple-800 space-y-1">
            <li><strong>Nutrition Trends:</strong> NFHS-5 official data on underweight, stunting, wasting by state</li>
            <li><strong>CRY-NFHS5 Correlations:</strong> How CRY program presence relates to nutrition outcomes</li>
            <li><strong>State-wise Analysis:</strong> Compare nutrition indicators across states with CRY presence</li>
            <li><strong>Actionable Recommendations:</strong> Data-driven insights for leadership decisions</li>
          </ul>
        </div>

        {/* State & District Filters */}
        <Section title="Filters">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* State Filter */}
            <div>
              <label htmlFor="state-filter" className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="inline mr-1" size={16} />
                State
              </label>
              <select
                id="state-filter"
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                title="Select a state to filter data"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="All States">All States</option>
                {availableStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* District Filter */}
            <div>
              <label htmlFor="district-filter" className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="inline mr-1" size={16} />
                District
              </label>
              <select
                id="district-filter"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={selectedState === 'All States'}
                title="Select a district to filter data"
                className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                  selectedState === 'All States' ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                }`}
              >
                <option value="All Districts">All Districts</option>
                {availableDistricts.map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Summary */}
          {selectedState !== 'All States' && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Showing data for:</strong> {selectedState}
                {selectedDistrict !== 'All Districts' && ` > ${selectedDistrict}`}
              </p>
            </div>
          )}
        </Section>
      </div>

      {/* CRY-NFHS5 Correlation Section */}
      {correlationAnalysis && (
        <Section title="CRY Program Reach vs. Nutrition Needs (Data Correlation)">
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded">
            <p className="text-sm text-gray-700">
              <strong>Insight:</strong> This section correlates CRY's program reach with NFHS-5 nutrition data. 
              States with <span className="text-red-600 font-semibold">high malnutrition but low CRY coverage</span> need priority intervention.
              States with <span className="text-green-600 font-semibold">high CRY reach in high-need areas</span> show good strategic alignment.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-blue-700">{correlationAnalysis.all.length}</p>
              <p className="text-sm text-gray-600">States with CRY Programs</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-green-700">{correlationAnalysis.totalCryChildren.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Total CRY Children</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-red-700">{correlationAnalysis.highPriority.length}</p>
              <p className="text-sm text-gray-600">High Priority States</p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* CRY Program Reach by State */}
            {cryReachChartData.length > 0 && (
              <ChartContainer>
                <h3 className="text-lg font-semibold mb-4 text-center">
                  CRY Program Reach by State (Children Enrolled)
                </h3>
                <GroupedBarChart
                  data={cryReachChartData}
                  xKey="state"
                  lines={[
                    { key: 'Boys', name: 'Boys', color: '#3b82f6' },
                    { key: 'Girls', name: 'Girls', color: '#ec4899' },
                  ]}
                  title=""
                  height={420}
                />
              </ChartContainer>
            )}

            {/* Malnutrition Rates by State */}
            {nutritionVsReachChartData.length > 0 && (
              <ChartContainer>
                <h3 className="text-lg font-semibold mb-4 text-center">
                  Malnutrition Rates in CRY States (NFHS-5 Data)
                </h3>
                <GroupedBarChart
                  data={nutritionVsReachChartData}
                  xKey="state"
                  lines={[
                    { key: 'Underweight %', name: 'Underweight', color: '#ef4444' },
                    { key: 'Stunting %', name: 'Stunting', color: '#f97316' },
                    { key: 'Wasting %', name: 'Wasting', color: '#eab308' },
                  ]}
                  title=""
                  height={420}
                />
              </ChartContainer>
            )}
          </div>

          {/* Correlation Table */}
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold p-4 bg-gray-50 border-b">
              State-wise CRY Coverage & Nutrition Status
            </h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CRY Children</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Underweight %</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stunting %</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Wasting %</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Priority</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {correlationAnalysis.all.slice(0, 10).map((corr, idx) => (
                  <tr key={idx} className={corr.interventionNeeded ? 'bg-red-50' : 'bg-green-50'}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{corr.state}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">{corr.cryChildren.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={corr.underweight_vs_avg > 0 ? 'text-red-600' : 'text-green-600'}>
                        {corr.nfhs5_underweight}% 
                        <span className="text-xs ml-1">({corr.underweight_vs_avg > 0 ? '+' : ''}{corr.underweight_vs_avg.toFixed(1)})</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={corr.stunting_vs_avg > 0 ? 'text-red-600' : 'text-green-600'}>
                        {corr.nfhs5_stunting}%
                        <span className="text-xs ml-1">({corr.stunting_vs_avg > 0 ? '+' : ''}{corr.stunting_vs_avg.toFixed(1)})</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={corr.wasting_vs_avg > 0 ? 'text-red-600' : 'text-green-600'}>
                        {corr.nfhs5_wasting}%
                        <span className="text-xs ml-1">({corr.wasting_vs_avg > 0 ? '+' : ''}{corr.wasting_vs_avg.toFixed(1)})</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        corr.priorityScore > 5 ? 'bg-red-200 text-red-800' :
                        corr.priorityScore > 0 ? 'bg-yellow-200 text-yellow-800' :
                        'bg-green-200 text-green-800'
                      }`}>
                        {corr.priorityScore > 5 ? 'High' : corr.priorityScore > 0 ? 'Medium' : 'Low'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* District-Level Data (when state is selected) */}
      {districtData && districtData.length > 0 && (
        <Section title={`District-wise CRY Coverage in ${selectedState}`}>
          <div className="mb-4 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded">
            <p className="text-sm text-gray-700">
              <strong>District Breakdown:</strong> Showing CRY program reach across {districtData.length} districts in {selectedState}.
            </p>
          </div>

          {/* District Bar Chart */}
          {districtChartData.length > 0 && (
            <ChartContainer>
              <h3 className="text-lg font-semibold mb-4 text-center">
                Children Enrolled by District - {selectedState}
              </h3>
              <GroupedBarChart
                data={districtChartData}
                xKey="district"
                lines={[
                  { key: 'Boys', name: 'Boys', color: '#6366f1' },
                  { key: 'Girls', name: 'Girls', color: '#ec4899' },
                ]}
                title=""
                height={420}
              />
            </ChartContainer>
          )}

          {/* District Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {districtData.map((d, idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-400">
                <h4 className="font-semibold text-gray-900 mb-2">{d.district}</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xl font-bold text-blue-600">{d.totalChildren.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-indigo-600">{d.boys.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Boys</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-pink-600">{d.girls.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Girls</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Nutrition & Health Trends */}
      {nutritionAnalysis && (
        <>
          <Section title="Child Nutrition & Health by State (NFHS-5 Official Data)">
            <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Data Source:</strong> {nutritionAnalysis.source}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                This chart shows <strong>official government nutrition data</strong> from the National Family Health Survey (NFHS-5) 
                conducted in 2019-2021. The bars compare each state's values against India's national average.
              </p>
              <div className="text-sm text-gray-700 mt-2 space-y-1">
                <p><strong>Key Terms:</strong></p>
                <ul className="list-disc ml-5 space-y-1">
                  <li><strong>Underweight:</strong> Low weight-for-age (indicates overall malnutrition) - India Avg: {nutritionAnalysis.indiaAverage.underweight}%</li>
                  <li><strong>Stunting:</strong> Low height-for-age (chronic malnutrition) - India Avg: {nutritionAnalysis.indiaAverage.stunting}%</li>
                  <li><strong>Wasting:</strong> Low weight-for-height (acute malnutrition) - India Avg: {nutritionAnalysis.indiaAverage.wasting}%</li>
                </ul>
              </div>
            </div>
            <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <p className="text-sm text-gray-700">
                <strong>How to Read:</strong> States where the "State Value" bar is <span className="text-green-600 font-semibold">lower than the India Average are performing better</span>.
                States with <span className="text-red-600 font-semibold">higher values need more intervention</span>.
              </p>
            </div>

            {/* Metric Selector */}
            <div className="mb-4 flex space-x-4">
              <button
                onClick={() => setSelectedMetric('underweight')}
                className={`px-4 py-2 rounded-md font-semibold transition ${
                  selectedMetric === 'underweight'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Underweight
              </button>
              <button
                onClick={() => setSelectedMetric('stunting')}
                className={`px-4 py-2 rounded-md font-semibold transition ${
                  selectedMetric === 'stunting'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Stunting
              </button>
              <button
                onClick={() => setSelectedMetric('wasting')}
                className={`px-4 py-2 rounded-md font-semibold transition ${
                  selectedMetric === 'wasting'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Wasting
              </button>
            </div>

            <ChartContainer>
              <h3 className="text-lg font-semibold mb-4 text-center capitalize">
                {selectedMetric} % by State vs India Average (NFHS-5 Data)
              </h3>
              {nutritionChartData.length > 0 ? (
                <GroupedBarChart
                  data={nutritionChartData}
                  xKey="location"
                  lines={[
                    { key: '2023', name: 'India Average', color: '#6b7280' },
                    { key: '2024', name: 'State Value', color: '#3b82f6' },
                  ]}
                  title=""
                  height={450}
                />
              ) : (
                <p className="text-gray-500 text-center py-8">No nutrition data available</p>
              )}
            </ChartContainer>

            {/* Top Improvements and Declines */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-green-900 mb-3 flex items-center">
                  <TrendingDown className="mr-2" size={20} />
                  Top 5 Best Performing States (Below National Average)
                </h4>
                <div className="space-y-2">
                  {nutritionAnalysis.comparisons
                    .filter((c: any) => c.metric === selectedMetric && c.change < 0)
                    .sort((a: any, b: any) => a.change - b.change)
                    .slice(0, 5)
                    .map((c: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-800">{c.location}</span>
                        <span className="text-green-700 font-bold">
                          {c.change.toFixed(1)}% below avg
                        </span>
                      </div>
                    ))}
                  {nutritionAnalysis.comparisons.filter((c: any) => c.metric === selectedMetric && c.change < 0).length === 0 && (
                    <p className="text-sm text-gray-600 italic">No states below national average</p>
                  )}
                </div>
              </div>

              <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                <h4 className="font-bold text-red-900 mb-3 flex items-center">
                  <TrendingUp className="mr-2" size={20} />
                  Top 5 States Needing Attention (Above National Average)
                </h4>
                <div className="space-y-2">
                  {nutritionAnalysis.comparisons
                    .filter((c: any) => c.metric === selectedMetric && c.change > 0)
                    .sort((a: any, b: any) => b.change - a.change)
                    .slice(0, 5)
                    .map((c: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-800">{c.location}</span>
                        <span className="text-red-700 font-bold">
                          +{c.change.toFixed(1)}% above avg
                        </span>
                      </div>
                    ))}
                  {nutritionAnalysis.comparisons.filter((c: any) => c.metric === selectedMetric && c.change > 0).length === 0 && (
                    <p className="text-sm text-gray-600 italic">No states above national average</p>
                  )}
                </div>
              </div>
            </div>
          </Section>
        </>
      )}
    </div>
  );
};
