import React, { useState, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';
import {
  LoadingSpinner,
  ErrorMessage,
  Section,
  ChartContainer,
} from '../components/Dashboard';
import { GroupedBarChart } from '../components/Charts';
import { useData } from '../hooks/useData';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Lightbulb, AlertTriangle, CheckCircle, ArrowRight, Building, Users, Activity, MapPin, Globe, Heart } from 'lucide-react';

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

interface ChartData {
  genderDistributionByState: any;
  enrollmentTrends: any;
  facilityDistribution: any;
  stateWiseComparison: any;
  indiaMap: any;
  ageDistribution: any;
  dropoutReasons: any;
  infrastructureAvailability: any;
  teacherDemographics: any;
  socialDiversity: any;
  // New charts
  yearOverYear: any;
  projectDistribution: any;
  facilityTypeBreakdown: any;
  studentTeacherRatio: any;
  nutritionRadar: any;
  regionalComparison: any;
  specialNeeds: any;
  locationDistribution: any;
  districtHeatmap: any;
  schoolCategory: any;
}

export const AdvancedAnalytics: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch('/data/advanced_analytics.json');
        if (!response.ok) {
          throw new Error('Failed to load analytics data');
        }
        const data = await response.json();
        setChartData(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    };

    fetchChartData();
  }, []);

  const handleMapClick = (event: any) => {
    if (event.points && event.points[0]) {
      const clickedState = event.points[0].location;
      setSelectedState(clickedState === selectedState ? null : clickedState);
    }
  };

  const clearStateFilter = () => {
    setSelectedState(null);
  };

  // Data hooks for nutrition analysis
  const { data: nfhs5Data } = useData({
    dataPath: '/data/nfhs5_nutrition_data.json',
  });
  const { data: insightsData } = useData({
    dataPath: '/data/insights_data.json',
  });

  // State hooks for nutrition filters
  const [nutritionSelectedMetric, setNutritionSelectedMetric] = useState<'underweight' | 'stunting' | 'wasting'>('underweight');
  const [nutritionSelectedState, setNutritionSelectedState] = useState<string>('All States');
  const [nutritionSelectedDistrict, setNutritionSelectedDistrict] = useState<string>('All Districts');

  // Get available states and districts from insights data
  const { availableStates, availableDistricts } = useMemo(() => {
    const insights = insightsData as InsightsData | null;
    if (!insights) {
      return { availableStates: [], availableDistricts: [] };
    }

    const states = insights.stateList || [];
    const districts = nutritionSelectedState !== 'All States' && insights.districtsByState
      ? insights.districtsByState[nutritionSelectedState] || []
      : [];

    return { availableStates: states, availableDistricts: districts };
  }, [insightsData, nutritionSelectedState]);

  // Reset district when state changes
  const handleNutritionStateChange = (state: string) => {
    setNutritionSelectedState(state);
    setNutritionSelectedDistrict('All Districts');
  };

  // Generate nutrition trends from NFHS-5 official government data
  const nutritionAnalysis = useMemo(() => {
    if (!nfhs5Data || !(nfhs5Data as NFHS5Data).state_data) return null;

    const nfhs = nfhs5Data as NFHS5Data;
    const comparisons: any[] = [];
    const indiaAvg = nfhs.india_average;
    
    Object.entries(nfhs.state_data).forEach(([state, data]) => {
      ['underweight', 'stunting', 'wasting'].forEach((metric) => {
        const stateValue = data[metric as keyof NFHS5StateData];
        const avgValue = indiaAvg[metric as keyof NFHS5StateData];
        
        comparisons.push({
          location: state,
          metric,
          value2023: avgValue,
          value2024: stateValue,
          change: stateValue - avgValue,
          isNFHS5: true,
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
      .filter((c: any) => c.metric === nutritionSelectedMetric);

    if (nutritionSelectedState !== 'All States') {
      filteredComparisons = filteredComparisons.filter((c: any) => 
        c.location.toLowerCase() === nutritionSelectedState.toLowerCase()
      );
    }

    filteredComparisons = filteredComparisons
      .sort((a: any, b: any) => a.change - b.change)
      .slice(0, 15);

    return filteredComparisons.map((c: any) => ({
      location: c.location,
      '2023': parseFloat(c.value2023.toFixed(1)),
      '2024': parseFloat(c.value2024.toFixed(1)),
    }));
  }, [nutritionAnalysis, nutritionSelectedMetric, nutritionSelectedState]);

  // CRY-NFHS5 Correlation analysis
  const correlationAnalysis = useMemo(() => {
    const insights = insightsData as InsightsData | null;
    if (!insights || !insights.stateCorrelations) return null;

    let correlations = insights.stateCorrelations;

    if (nutritionSelectedState !== 'All States') {
      correlations = correlations.filter(c => c.state === nutritionSelectedState);
    }

    const withPriority = correlations.map(c => ({
      ...c,
      priorityScore: (c.underweight_vs_avg + c.stunting_vs_avg + c.wasting_vs_avg) / 3,
      interventionNeeded: c.underweight_vs_avg > 0 || c.stunting_vs_avg > 0 || c.wasting_vs_avg > 0,
    }));

    const sorted = withPriority.sort((a, b) => b.priorityScore - a.priorityScore);

    return {
      all: sorted,
      highPriority: sorted.filter(c => c.priorityScore > 5).slice(0, 5),
      performing: sorted.filter(c => c.priorityScore < 0).slice(-5).reverse(),
      totalCryChildren: correlations.reduce((sum, c) => sum + c.cryChildren, 0),
    };
  }, [insightsData, nutritionSelectedState]);

  // District-level data for selected state
  const districtData = useMemo(() => {
    const insights = insightsData as InsightsData | null;
    if (!insights || nutritionSelectedState === 'All States') return null;

    const stateData = insights.cryStateData?.[nutritionSelectedState];
    if (!stateData || !stateData.districts) return null;

    return Object.entries(stateData.districts)
      .map(([district, data]) => ({
        district,
        ...data,
      }))
      .sort((a, b) => b.totalChildren - a.totalChildren);
  }, [insightsData, nutritionSelectedState]);

  // Chart data for CRY Program Reach by State
  const cryReachChartData = useMemo(() => {
    if (!correlationAnalysis) return [];

    return correlationAnalysis.all
      .slice(0, 12)
      .map(c => ({
        state: c.state,
        'CRY Children': c.cryChildren,
        'Boys': c.cryBoys,
        'Girls': c.cryGirls,
      }));
  }, [correlationAnalysis]);

  // Chart data for Nutrition vs CRY Reach
  const nutritionVsReachChartData = useMemo(() => {
    if (!correlationAnalysis) return [];

    return correlationAnalysis.all
      .slice(0, 10)
      .map(c => ({
        state: c.state,
        'Underweight %': c.nfhs5_underweight,
        'Stunting %': c.nfhs5_stunting,
        'Wasting %': c.nfhs5_wasting,
      }));
  }, [correlationAnalysis]);

  // District chart data
  const districtChartData = useMemo(() => {
    if (!districtData) return [];

    return districtData.slice(0, 10).map(d => ({
      district: d.district,
      'Total Children': d.totalChildren,
      'Boys': d.boys,
      'Girls': d.girls,
    }));
  }, [districtData]);

  // Map GeoJSON state names to data state names
  const mapStateNameToDataName = (geojsonState: string): string => {
    const reverseMapping: Record<string, string> = {
      'Orissa': 'Odisha',
      'Uttaranchal': 'Uttarakhand',
      'Delhi': 'Delhi',
      'Jammu and Kashmir': 'Jammu & Kashmir',
      // All other states use same name
    };
    return reverseMapping[geojsonState] || geojsonState;
  };

  // Filter chart data based on selected state
  const getFilteredGenderData = () => {
    if (!chartData || !selectedState || !chartData.genderDistributionByState) {
      return chartData?.genderDistributionByState || { data: [], layout: {} };
    }
    
    const dataStateName = mapStateNameToDataName(selectedState);
    
    // Now y values are plain arrays, so we can filter properly
    const data = chartData.genderDistributionByState.data.map((trace: any) => {
      const stateIndex = trace.x.findIndex((state: string) => state === dataStateName);
      
      if (stateIndex === -1) {
        return {
          ...trace,
          x: [],
          y: []
        };
      }
      
      return {
        ...trace,
        x: [trace.x[stateIndex]],
        y: [trace.y[stateIndex]]
      };
    });
    
    return {
      ...chartData.genderDistributionByState,
      data,
      layout: {
        ...chartData.genderDistributionByState.layout,
        xaxis: {
          ...chartData.genderDistributionByState.layout.xaxis,
          title: `${dataStateName} - Gender Distribution`
        }
      }
    };
  };

  const getFilteredStateComparison = () => {
    if (!chartData || !selectedState || !chartData.stateWiseComparison) {
      return chartData?.stateWiseComparison || { data: [], layout: {} };
    }
    
    const dataStateName = mapStateNameToDataName(selectedState);
    
    // Filter with plain arrays
    const data = chartData.stateWiseComparison.data.map((trace: any) => {
      const stateIndex = trace.x.findIndex((state: string) => state === dataStateName);
      
      if (stateIndex === -1) {
        return {
          ...trace,
          x: [],
          y: []
        };
      }
      
      return {
        ...trace,
        x: [trace.x[stateIndex]],
        y: [trace.y[stateIndex]]
      };
    });
    
    return {
      ...chartData.stateWiseComparison,
      data,
      layout: {
        ...chartData.stateWiseComparison.layout,
        xaxis: {
          ...chartData.stateWiseComparison.layout.xaxis,
          title: `${dataStateName} - Metrics Comparison`
        }
      }
    };
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!chartData) return <ErrorMessage message="No data available" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="p-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            Advanced Analytics
            {selectedState && (
              <span className="text-xl ml-4 text-yellow-400">
                - Filtered by {selectedState}
              </span>
            )}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Comprehensive insights across all data sources with interactive visualizations powered by Plotly.js
          </p>
          
          {/* Dashboard Guide */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-l-4 border-gray-900/60 dark:border-gray-100/40 rounded-lg mb-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How to Use This Dashboard:</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li><strong>Interactive Map:</strong> Click on any state to filter all charts and see state-specific data</li>
              <li><strong>Clear Filters:</strong> Use the "Clear Filter" button to return to all-states view</li>
              <li><strong>Hover for Details:</strong> Hover over any chart element to see exact values and percentages</li>
              <li><strong>Zoom & Pan:</strong> Use Plotly controls (top-right of charts) to zoom, pan, or download charts</li>
              <li><strong>Context Badges:</strong> Charts with "All States (No Filter)" badges show aggregate data regardless of state selection</li>
            </ul>
          </div>
          
          {selectedState && (
            <button
              onClick={clearStateFilter}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-md font-semibold transition-colors"
            >
              Clear Filter - Show All States
            </button>
          )}
        </div>

        {/* India Map - State-wise Child Distribution */}
        <Section title="Geographic Distribution">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <TrendingUp className="text-yellow-400 mr-2" size={24} />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  India Map: State-wise Beneficiary Records
                </h3>
              </div>
              {selectedState && (
                <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                  {selectedState} selected - Click again to deselect
                </span>
              )}
            </div>
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>What do the numbers mean?</strong> Each value on this map shows the total number of <strong>beneficiary records</strong> linked to CRY-supported children and facilities in that state.
                <span className="block mt-1">
                  Here, <span className="font-medium">beneficiaries</span> include children reached through Child Annual Surveys and Education programs, as well as children served through Anganwadi centres and schools where CRY is working.
                </span>
                <span>• Child Annual Surveys (503,635 records) • Child Education Data (474,240 records) • Anganwadi Centers (3,998 centers) • Schools (3,255 schools)</span>
                <span className="block mt-1 italic text-xs">
                  Note: The same child may appear in multiple program datasets; figures represent program records and service touchpoints across 2023-2024, not a de-duplicated count of unique children.
                </span>
              </p>
            </div>
            {chartData.indiaMap ? (
              <Plot
                data={chartData.indiaMap.data}
                layout={{
                  ...chartData.indiaMap.layout,
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { color: '#6b7280' },
                }}
                config={{ responsive: true, displayModeBar: true }}
                style={{ width: '100%', height: '600px' }}
                onClick={handleMapClick}
              />
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Map data not available</p>
            )}
          </div>
        </Section>

        {/* Gender Distribution by State */}
        <Section title="Gender Analysis">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <BarChart3 className="text-blue-500 mr-2" size={24} />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Gender Distribution by State
                  {selectedState && <span className="text-sm ml-2 text-yellow-400">({selectedState})</span>}
                </h3>
              </div>
              <Plot
                data={getFilteredGenderData().data}
                layout={{
                  ...getFilteredGenderData().layout,
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { color: '#6b7280' },
                  height: 400,
                }}
                config={{ responsive: true }}
                style={{ width: '100%' }}
              />
            </div>

            {/* Multi-metric State Comparison - Moved here */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <BarChart3 className="text-purple-500 mr-2" size={24} />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Multi-metric State Comparison
                  {selectedState && <span className="text-sm ml-2 text-yellow-400">({selectedState})</span>}
                </h3>
              </div>
              <Plot
                data={getFilteredStateComparison().data}
                layout={{
                  ...getFilteredStateComparison().layout,
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { color: '#6b7280' },
                  height: 500,
                }}
                config={{ responsive: true }}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </Section>

        {/* Overall Gender Distribution */}
        <Section title="Aggregate Analysis">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <PieChart className="text-pink-500 mr-2" size={24} />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Overall Gender Distribution
                </h3>
              </div>
              {selectedState && (
                <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                  All States (No Filter)
                </span>
              )}
            </div>
            <Plot
              data={chartData.facilityDistribution.data}
              layout={{
                ...chartData.facilityDistribution.layout,
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { color: '#6b7280' },
                height: 400,
              }}
              config={{ responsive: true }}
              style={{ width: '100%' }}
            />
          </div>
        </Section>

        {/* Enrollment Trends */}
        <Section title="Temporal Analysis">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <TrendingUp className="text-green-500 mr-2" size={24} />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Enrollment Trends Over Time
                </h3>
              </div>
              {selectedState && (
                <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                  All States (No Filter)
                </span>
              )}
            </div>
            <Plot
              data={chartData.enrollmentTrends.data}
              layout={{
                ...chartData.enrollmentTrends.layout,
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { color: '#6b7280' },
                height: 400,
              }}
              config={{ responsive: true }}
              style={{ width: '100%' }}
            />
          </div>
        </Section>

        {/* Age Distribution */}
        <Section title="Age Demographics">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <BarChart3 className="text-cyan-500 mr-2" size={24} />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Age Band Distribution
                </h3>
              </div>
              {selectedState && (
                <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                  All States (No Filter)
                </span>
              )}
            </div>
            {chartData.ageDistribution ? (
              <Plot
                data={chartData.ageDistribution.data}
                layout={{
                  ...chartData.ageDistribution.layout,
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { color: '#6b7280' },
                }}
                config={{ responsive: true }}
                style={{ width: '100%' }}
              />
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Age distribution data not available</p>
            )}
          </div>
        </Section>

        {/* Education Insights */}
        <Section title="Education Insights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dropout Reasons */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <TrendingUp className="text-red-500 mr-2" size={24} />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Dropout Reasons
                  </h3>
                </div>
                {selectedState && (
                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                    All States (No Filter)
                  </span>
                )}
              </div>
              {chartData.dropoutReasons ? (
                <Plot
                  data={chartData.dropoutReasons.data}
                  layout={{
                    ...chartData.dropoutReasons.layout,
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#6b7280' },
                  }}
                  config={{ responsive: true }}
                  style={{ width: '100%' }}
                />
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Dropout data not available</p>
              )}
            </div>

            {/* School Infrastructure */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <BarChart3 className="text-emerald-500 mr-2" size={24} />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    School Infrastructure
                  </h3>
                </div>
                {selectedState && (
                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                    All States (No Filter)
                  </span>
                )}
              </div>
              {chartData.infrastructureAvailability ? (
                <Plot
                  data={chartData.infrastructureAvailability.data}
                  layout={{
                    ...chartData.infrastructureAvailability.layout,
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#6b7280' },
                  }}
                  config={{ responsive: true }}
                  style={{ width: '100%' }}
                />
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Infrastructure data not available</p>
              )}
            </div>
          </div>
        </Section>

        {/* Demographics Analysis */}
        <Section title="Demographics & Diversity">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Teacher Demographics */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <PieChart className="text-indigo-500 mr-2" size={24} />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Teacher Demographics
                  </h3>
                </div>
                {selectedState && (
                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                    All States (No Filter)
                  </span>
                )}
              </div>
              {chartData.teacherDemographics ? (
                <Plot
                  data={chartData.teacherDemographics.data}
                  layout={{
                    ...chartData.teacherDemographics.layout,
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#6b7280' },
                  }}
                  config={{ responsive: true }}
                  style={{ width: '100%' }}
                />
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Teacher data not available</p>
              )}
            </div>

            {/* Social Diversity */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <PieChart className="text-violet-500 mr-2" size={24} />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Social Diversity
                  </h3>
                </div>
                {selectedState && (
                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                    All States (No Filter)
                  </span>
                )}
              </div>
              {chartData.socialDiversity ? (
                <Plot
                  data={chartData.socialDiversity.data}
                  layout={{
                    ...chartData.socialDiversity.layout,
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#6b7280' },
                  }}
                  config={{ responsive: true }}
                  style={{ width: '100%' }}
                />
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Diversity data not available</p>
              )}
            </div>
          </div>
        </Section>

        {/* Facility & Partner Analysis */}
        <Section title="Facility & Partner Analysis">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Partner Organization Distribution */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Building className="text-teal-500 mr-2" size={24} />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Partner Organizations
                  </h3>
                </div>
              </div>
              {chartData.projectDistribution ? (
                <Plot
                  data={chartData.projectDistribution.data}
                  layout={{
                    ...chartData.projectDistribution.layout,
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#6b7280' },
                  }}
                  config={{ responsive: true }}
                  style={{ width: '100%' }}
                />
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Partner data not available</p>
              )}
            </div>

            {/* Facility Type Breakdown */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <BarChart3 className="text-indigo-500 mr-2" size={24} />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Facility Types
                  </h3>
                </div>
              </div>
              {chartData.facilityTypeBreakdown ? (
                <Plot
                  data={chartData.facilityTypeBreakdown.data}
                  layout={{
                    ...chartData.facilityTypeBreakdown.layout,
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#6b7280' },
                  }}
                  config={{ responsive: true }}
                  style={{ width: '100%' }}
                />
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Facility type data not available</p>
              )}
            </div>
          </div>
        </Section>

        {/* Student-Teacher Ratio & School Categories */}
        <Section title="School Quality Metrics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student-Teacher Ratio */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Users className="text-amber-500 mr-2" size={24} />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Student-Teacher Ratio
                  </h3>
                </div>
              </div>
              {chartData.studentTeacherRatio ? (
                <Plot
                  data={chartData.studentTeacherRatio.data}
                  layout={{
                    ...chartData.studentTeacherRatio.layout,
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#6b7280' },
                  }}
                  config={{ responsive: true }}
                  style={{ width: '100%' }}
                />
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Student-teacher ratio data not available</p>
              )}
            </div>

            {/* School Categories */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <PieChart className="text-sky-500 mr-2" size={24} />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    School Categories
                  </h3>
                </div>
              </div>
              {chartData.schoolCategory ? (
                <Plot
                  data={chartData.schoolCategory.data}
                  layout={{
                    ...chartData.schoolCategory.layout,
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#6b7280' },
                  }}
                  config={{ responsive: true }}
                  style={{ width: '100%' }}
                />
              ) : (
                <p className="text-gray-500 dark:text-gray-400">School category data not available</p>
              )}
            </div>
          </div>
        </Section>

        {/* Anganwadi Services & Regional Distribution */}
        <Section title="Anganwadi Services & Coverage">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Nutrition Services Radar */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Activity className="text-rose-500 mr-2" size={24} />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Anganwadi Services Availability
                  </h3>
                </div>
              </div>
              {chartData.nutritionRadar ? (
                <Plot
                  data={chartData.nutritionRadar.data}
                  layout={{
                    ...chartData.nutritionRadar.layout,
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#6b7280' },
                  }}
                  config={{ responsive: true }}
                  style={{ width: '100%' }}
                />
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Nutrition services data not available</p>
              )}
            </div>

            {/* Location Distribution */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <MapPin className="text-green-600 mr-2" size={24} />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Rural vs Urban Distribution
                  </h3>
                </div>
              </div>
              {chartData.locationDistribution ? (
                <Plot
                  data={chartData.locationDistribution.data}
                  layout={{
                    ...chartData.locationDistribution.layout,
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#6b7280' },
                  }}
                  config={{ responsive: true }}
                  style={{ width: '100%' }}
                />
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Location distribution data not available</p>
              )}
            </div>
          </div>
        </Section>

        {/* Regional & District Analysis */}
        <Section title="Geographic Analysis">
          <div className="grid grid-cols-1 gap-6">
            {/* Regional Comparison */}
            {chartData.regionalComparison && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Globe className="text-purple-500 mr-2" size={24} />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Regional Distribution
                    </h3>
                  </div>
                </div>
                <Plot
                  data={chartData.regionalComparison.data}
                  layout={{
                    ...chartData.regionalComparison.layout,
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#6b7280' },
                  }}
                  config={{ responsive: true }}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            {/* District Heatmap */}
            {chartData.districtHeatmap && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <BarChart3 className="text-cyan-500 mr-2" size={24} />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Top Districts by Coverage
                    </h3>
                  </div>
                </div>
                <Plot
                  data={chartData.districtHeatmap.data}
                  layout={{
                    ...chartData.districtHeatmap.layout,
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#6b7280' },
                  }}
                  config={{ responsive: true }}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>
        </Section>

        {/* Special Needs Analysis */}
        {chartData.specialNeeds && (
          <Section title="Inclusive Education">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Heart className="text-pink-500 mr-2" size={24} />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Children with Special Needs
                  </h3>
                </div>
              </div>
              <Plot
                data={chartData.specialNeeds.data}
                layout={{
                  ...chartData.specialNeeds.layout,
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { color: '#6b7280' },
                }}
                config={{ responsive: true }}
                style={{ width: '100%' }}
              />
            </div>
          </Section>
        )}

        {/* Nutrition Analysis Section - CRY-NFHS5 Correlation */}
        <Section title="CRY Program & Nutrition Analysis (NFHS-5: 2019-2021 Baseline)">
          <div className="mb-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 p-6 rounded-lg shadow-md">
              <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">Nutrition & CRY Program Correlation:</h3>
              <ul className="text-sm text-purple-800 dark:text-purple-300 space-y-1">
                <li><strong>Nutrition Baselines:</strong> NFHS-5 (2019-21) official data on underweight, stunting, wasting by state</li>
                <li><strong>CRY-NFHS5 Correlations:</strong> How CRY program presence relates to nutrition outcomes</li>
                <li><strong>State-wise Analysis:</strong> Compare nutrition indicators across states with CRY presence</li>
              </ul>
            </div>

            {/* State & District Filters */}
            <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <MapPin className="mr-2 text-blue-500" size={20} />
                Nutrition Analysis Filters
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* State Filter */}
                <div>
                  <label htmlFor="nutrition-state-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State
                  </label>
                  <select
                    id="nutrition-state-filter"
                    value={nutritionSelectedState}
                    onChange={(e) => handleNutritionStateChange(e.target.value)}
                    title="Select a state to filter nutrition data"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 dark:bg-gray-700"
                  >
                    <option value="All States">All States</option>
                    {availableStates.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                {/* District Filter */}
                <div>
                  <label htmlFor="nutrition-district-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    District
                  </label>
                  <select
                    id="nutrition-district-filter"
                    value={nutritionSelectedDistrict}
                    onChange={(e) => setNutritionSelectedDistrict(e.target.value)}
                    disabled={nutritionSelectedState === 'All States'}
                    title="Select a district to filter data"
                    className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 ${
                      nutritionSelectedState === 'All States' ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed text-gray-500' : 'dark:bg-gray-700'
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
              {nutritionSelectedState !== 'All States' && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Showing data for:</strong> {nutritionSelectedState}
                    {nutritionSelectedDistrict !== 'All Districts' && ` > ${nutritionSelectedDistrict}`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CRY-NFHS5 Correlation Analysis */}
          {correlationAnalysis && (
            <div className="space-y-6">
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 rounded">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Insight:</strong> This section correlates CRY's program reach with NFHS-5 (2019-21) baseline nutrition data. 
                  States with <span className="text-red-600 font-semibold">high malnutrition but low CRY coverage</span> need priority intervention.
                  States with <span className="text-green-600 font-semibold">high CRY reach in high-need areas</span> show good strategic alignment.
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{correlationAnalysis.all.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">States with CRY Programs</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">{correlationAnalysis.totalCryChildren.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total CRY Children</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300">{correlationAnalysis.highPriority.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">High Priority States</p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* CRY Program Reach by State */}
                {cryReachChartData.length > 0 && (
                  <ChartContainer>
                    <h3 className="text-lg font-semibold mb-4 text-center text-gray-900 dark:text-gray-100">
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
                    <h3 className="text-lg font-semibold mb-4 text-center text-gray-900 dark:text-gray-100">
                      Malnutrition Rates in CRY States (NFHS-5: 2019-21 Baseline)
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
              <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                <h3 className="text-lg font-semibold p-4 bg-gray-50 dark:bg-gray-700 border-b text-gray-900 dark:text-gray-100">
                  State-wise CRY Coverage & Nutrition Status
                </h3>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">State</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">CRY Children</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Underweight %</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stunting %</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Wasting %</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {correlationAnalysis.all.slice(0, 10).map((corr, idx) => (
                      <tr key={idx} className={corr.interventionNeeded ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{corr.state}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{corr.cryChildren.toLocaleString()}</td>
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
            </div>
          )}

          {/* District-Level Data (when state is selected) */}
          {districtData && districtData.length > 0 && (
            <div className="mt-6 space-y-6">
              <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-500 rounded">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>District Breakdown:</strong> Showing CRY program reach across {districtData.length} districts in {nutritionSelectedState}.
                </p>
              </div>

              {/* District Bar Chart */}
              {districtChartData.length > 0 && (
                <ChartContainer>
                  <h3 className="text-lg font-semibold mb-4 text-center text-gray-900 dark:text-gray-100">
                    Children Enrolled by District - {nutritionSelectedState}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {districtData.map((d, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-blue-400">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{d.district}</h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{d.totalChildren.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{d.boys.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Boys</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-pink-600 dark:text-pink-400">{d.girls.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Girls</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nutrition & Health Trends */}
          {nutritionAnalysis && (
            <div className="mt-6 space-y-6">
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 rounded">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Data Source:</strong> {nutritionAnalysis.source}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  This chart shows <strong>official government nutrition data</strong> from the National Family Health Survey (NFHS-5: 2019-2021) 
                  conducted in 2019-2021. The bars compare each state's values against India's national average.
                </p>
                <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                  <p><strong>Key Terms:</strong></p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li><strong>Underweight:</strong> Low weight-for-age (indicates overall malnutrition) - India Avg: {nutritionAnalysis.indiaAverage.underweight}%</li>
                    <li><strong>Stunting:</strong> Low height-for-age (chronic malnutrition) - India Avg: {nutritionAnalysis.indiaAverage.stunting}%</li>
                    <li><strong>Wasting:</strong> Low weight-for-height (acute malnutrition) - India Avg: {nutritionAnalysis.indiaAverage.wasting}%</li>
                  </ul>
                </div>
              </div>
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 rounded">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>How to Read:</strong> States where the "State Value" bar is <span className="text-green-600 font-semibold">lower than the India Average are performing better</span>.
                  States with <span className="text-red-600 font-semibold">higher values need more intervention</span>.
                </p>
              </div>

              {/* Metric Selector */}
              <div className="mb-4 flex space-x-4">
                <button
                  onClick={() => setNutritionSelectedMetric('underweight')}
                  className={`px-4 py-2 rounded-md font-semibold transition ${
                    nutritionSelectedMetric === 'underweight'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Underweight
                </button>
                <button
                  onClick={() => setNutritionSelectedMetric('stunting')}
                  className={`px-4 py-2 rounded-md font-semibold transition ${
                    nutritionSelectedMetric === 'stunting'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Stunting
                </button>
                <button
                  onClick={() => setNutritionSelectedMetric('wasting')}
                  className={`px-4 py-2 rounded-md font-semibold transition ${
                    nutritionSelectedMetric === 'wasting'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Wasting
                </button>
              </div>

              <ChartContainer>
                <h3 className="text-lg font-semibold mb-4 text-center capitalize text-gray-900 dark:text-gray-100">
                  {nutritionSelectedMetric} % by State vs India Average (NFHS-5: 2019-21)
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
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No nutrition data available</p>
                )}
              </ChartContainer>

              {/* Top Improvements and Declines */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-green-50 dark:bg-green-900/30 p-6 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-bold text-green-900 dark:text-green-200 mb-3 flex items-center">
                    <TrendingDown className="mr-2" size={20} />
                    Top 5 Best Performing States (Below National Average)
                  </h4>
                  <div className="space-y-2">
                    {nutritionAnalysis.comparisons
                      .filter((c: any) => c.metric === nutritionSelectedMetric && c.change < 0)
                      .sort((a: any, b: any) => a.change - b.change)
                      .slice(0, 5)
                      .map((c: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="font-medium text-gray-800 dark:text-gray-200">{c.location}</span>
                          <span className="text-green-700 dark:text-green-400 font-bold">
                            {c.change.toFixed(1)}% below avg
                          </span>
                        </div>
                      ))}
                    {nutritionAnalysis.comparisons.filter((c: any) => c.metric === nutritionSelectedMetric && c.change < 0).length === 0 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">No states below national average</p>
                    )}
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-lg border-l-4 border-red-500">
                  <h4 className="font-bold text-red-900 dark:text-red-200 mb-3 flex items-center">
                    <TrendingUp className="mr-2" size={20} />
                    Top 5 States Needing Attention (Above National Average)
                  </h4>
                  <div className="space-y-2">
                    {nutritionAnalysis.comparisons
                      .filter((c: any) => c.metric === nutritionSelectedMetric && c.change > 0)
                      .sort((a: any, b: any) => b.change - a.change)
                      .slice(0, 5)
                      .map((c: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="font-medium text-gray-800 dark:text-gray-200">{c.location}</span>
                          <span className="text-red-700 dark:text-red-400 font-bold">
                            +{c.change.toFixed(1)}% above avg
                          </span>
                        </div>
                      ))}
                    {nutritionAnalysis.comparisons.filter((c: any) => c.metric === nutritionSelectedMetric && c.change > 0).length === 0 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">No states above national average</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* Key Insights & Recommendations */}
        <Section title="Key Insights & Strategic Recommendations">
          <div className="space-y-6">
            {/* Executive Summary */}
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 p-6 rounded-lg shadow-lg border-l-4 border-blue-600">
              <div className="flex items-center mb-4">
                <Lightbulb className="text-blue-600 dark:text-blue-400 mr-3" size={28} />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Executive Summary</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                Comprehensive analysis of <strong>985,000+ records</strong> across Child Annual Surveys (503,635 records spanning 2023-2024), 
                Education programs (474,240 records), Anganwadi centers (3,998 centers across 2023-2024), and Schools (3,255 schools) 
                reveals key patterns in demographics, infrastructure, teacher resources, and service delivery that can guide strategic program optimization.
              </p>
            </div>

            {/* Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gender Parity Insights */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-pink-500">
                <div className="flex items-center mb-4">
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Gender Parity Analysis</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Positive Trend:</strong> Near gender parity achieved with approximately 49-51% distribution across programs
                    </p>
                  </div>
                  <div className="flex items-start">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Watch Area:</strong> Some states show slight decline in girls' enrollment - monitor Bihar and Jharkhand closely
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-md">
                    <p className="text-sm text-pink-800 dark:text-pink-200">
                      <ArrowRight className="inline mr-1" size={14} />
                      <strong>Recommendation:</strong> Implement targeted girls' retention programs in states showing declining trends. 
                      Focus on providing safe transportation and sanitation facilities.
                    </p>
                  </div>
                </div>
              </div>

              {/* Student-Teacher Ratio */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-cyan-500">
                <div className="flex items-center mb-4">
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Student-Teacher Ratio Analysis</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Critical Finding:</strong> Several states show STR above 30:1, with Bihar at 41:1 requiring urgent attention
                    </p>
                  </div>
                  <div className="flex items-start">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Best Practice:</strong> States with STR below 25:1 show better learning outcomes and retention
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-md">
                    <p className="text-sm text-cyan-800 dark:text-cyan-200">
                      <ArrowRight className="inline mr-1" size={14} />
                      <strong>Recommendation:</strong> Advocate for additional teacher recruitment in high-STR states. 
                      Support teacher training programs to maximize effectiveness.
                    </p>
                  </div>
                </div>
              </div>

              {/* Facility Distribution */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-emerald-500">
                <div className="flex items-center mb-4">
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Facility Type Distribution</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Network Strength:</strong> 3,998 Anganwadi centers (2,013 in 2024 + 1,985 in 2023) form the backbone of early childhood services
                    </p>
                  </div>
                  <div className="flex items-start">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>School Coverage:</strong> 3,255 schools covered (1,600 in 2024 + 1,655 in 2023), with primary schools dominating and secondary education facilities needing expansion
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-md">
                    <p className="text-sm text-emerald-800 dark:text-emerald-200">
                      <ArrowRight className="inline mr-1" size={14} />
                      <strong>Recommendation:</strong> Strengthen transition pathways from primary to secondary schools. 
                      Focus on upper primary and secondary facility expansion in underserved areas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Nutrition & Health Services */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-amber-500">
                <div className="flex items-center mb-4">
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Nutrition & Health Services</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Strong Delivery:</strong> Immunization (87-91%) and health checkup services show high coverage
                    </p>
                  </div>
                  <div className="flex items-start">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Gap Identified:</strong> Take-home ration and nutrition education services need improvement in some regions
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <ArrowRight className="inline mr-1" size={14} />
                      <strong>Recommendation:</strong> Ensure 100% coverage of supplementary nutrition programs. 
                      Integrate nutrition education into regular Anganwadi activities.
                    </p>
                  </div>
                </div>
              </div>

              {/* Special Needs Inclusion */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-violet-500">
                <div className="flex items-center mb-4">
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Special Needs Inclusion</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Current Status:</strong> 2,500+ children with special needs identified across the program network
                    </p>
                  </div>
                  <div className="flex items-start">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>State Variation:</strong> Maharashtra and Tamil Nadu show highest inclusion rates; other states need support
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-md">
                    <p className="text-sm text-violet-800 dark:text-violet-200">
                      <ArrowRight className="inline mr-1" size={14} />
                      <strong>Recommendation:</strong> Develop specialized training for teachers on inclusive education. 
                      Ensure accessibility infrastructure in all facilities.
                    </p>
                  </div>
                </div>
              </div>

              {/* Rural-Urban Distribution */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-teal-500">
                <div className="flex items-center mb-4">
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Rural-Urban Coverage</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Rural Focus:</strong> Majority of facilities serve rural populations, aligning with CRY's mission
                    </p>
                  </div>
                  <div className="flex items-start">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Urban Gaps:</strong> Urban slum areas may need targeted interventions for migrant and vulnerable children
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-md">
                    <p className="text-sm text-teal-800 dark:text-teal-200">
                      <ArrowRight className="inline mr-1" size={14} />
                      <strong>Recommendation:</strong> Maintain rural coverage while exploring partnerships for urban slum outreach. 
                      Address unique challenges of urban migrant children.
                    </p>
                  </div>
                </div>
              </div>

              {/* CRY-NFHS5 Nutrition Correlation */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-red-500">
                <div className="flex items-center mb-4">
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">CRY-NFHS5 Nutrition Correlation</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Strategic Alignment:</strong> CRY programs operate in states with high malnutrition burden, enabling targeted nutrition interventions
                    </p>
                  </div>
                  <div className="flex items-start">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>High-Priority States:</strong> Bihar, Jharkhand, Madhya Pradesh show stunting and underweight rates above national average
                    </p>
                  </div>
                  <div className="flex items-start">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Success Stories:</strong> Kerala, Tamil Nadu demonstrate that sustained interventions can achieve below-average malnutrition rates
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      <ArrowRight className="inline mr-1" size={14} />
                      <strong>Recommendation:</strong> Leverage CRY's presence in high-malnutrition states to integrate nutrition education with existing programs. 
                      Partner with Anganwadi centers for complementary feeding and growth monitoring. Prioritize states with &gt;35% stunting rates.
                    </p>
                  </div>
                </div>
              </div>

              {/* Data-Driven Intervention Planning */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
                <div className="flex items-center mb-4">
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Data-Driven Intervention Planning</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Geographic Targeting:</strong> NFHS-5 (2019-21) baseline data enables precision targeting of nutrition interventions at district level
                    </p>
                  </div>
                  <div className="flex items-start">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Multi-Indicator Approach:</strong> States with high underweight AND stunting rates require comprehensive interventions addressing both acute and chronic malnutrition
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-md">
                    <p className="text-sm text-indigo-800 dark:text-indigo-200">
                      <ArrowRight className="inline mr-1" size={14} />
                      <strong>Recommendation:</strong> Use district-level CRY reach data combined with NFHS-5 (2019-21) nutrition baselines to create a 
                      "Nutrition Vulnerability Index" for prioritizing resource allocation and measuring program impact over time.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Priority Actions */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <AlertTriangle className="text-yellow-600 mr-2" size={24} />
                <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">Priority Action Items</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <span className="bg-red-500 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">1</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Critical: STR</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Reduce student-teacher ratio in Bihar (41:1) and UP (32:1) through teacher recruitment advocacy and volunteer programs
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <span className="bg-red-500 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">2</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Critical: Dropout</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Address economic factors driving dropouts through conditional cash transfers and family support programs
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <span className="bg-orange-500 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">3</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">High: Infrastructure</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Ensure 100% coverage of toilets, drinking water, and electricity across all school and Anganwadi facilities
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <span className="bg-orange-500 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">4</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">High: Nutrition</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Expand take-home ration and cooked meal programs to achieve 95% coverage across all Anganwadi centers
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <span className="bg-yellow-500 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">5</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Medium: Inclusion</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Develop inclusive education training for teachers and ensure accessibility features in all new facilities
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <span className="bg-yellow-500 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">6</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Strategic: Expansion</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Expand secondary education facilities and strengthen primary-to-secondary transition support programs
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <span className="bg-red-500 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">7</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Critical: Malnutrition</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Target states with &gt;35% stunting rates (Bihar, Jharkhand, MP, UP) with integrated nutrition-education programs leveraging Anganwadi partnerships
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <span className="bg-orange-500 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">8</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">High: District Focus</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Use CRY-NFHS5 correlation data to prioritize districts with highest malnutrition burden and lowest intervention coverage
                  </p>
                </div>
              </div>
            </div>

            {/* Success Metrics */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <CheckCircle className="text-green-500 mr-2" size={24} />
                <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">Key Performance Indicators to Track</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">50%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Girls' Enrollment</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Target parity</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">25:1</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Target STR</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">All states</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">95%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Nutrition Services</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Coverage target</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">&lt;5%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Dropout Rate</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Annual target</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">100%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Basic Infra</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Toilets & water</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">100%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Inclusion</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Special needs</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">&lt;30%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Stunting Rate</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Target in CRY states</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">&lt;25%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Underweight</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Target reduction</div>
                </div>
              </div>
            </div>

            {/* Data Quality Note */}
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                <strong>Note:</strong> Insights derived from analysis of 20+ comprehensive visualizations covering demographics, 
                education, infrastructure, teacher resources, nutrition services, special needs, and geographic distribution across 
                985,000+ program records (Child Annual: 503,635 | Child Education: 474,240 | Anganwadi: 3,998 centers | Schools: 3,255). 
                Nutrition analysis incorporates official NFHS-5 (National Family Health Survey 2019-2021) baseline government data for malnutrition indicators. 
                Recommendations should be validated with on-ground realities. Use the interactive map and nutrition filters to explore state-specific data.
              </p>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-300 dark:border-gray-700">
          <p className="text-center text-sm text-gray-500 dark:text-gray-500">
            Advanced Analytics includes 20 comprehensive visualizations across demographics, education, infrastructure, and diversity
          </p>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-2">
            All visualizations are interactive - hover, zoom, and click to explore the data
          </p>
        </div>
      </div>
    </div>
  );
};
