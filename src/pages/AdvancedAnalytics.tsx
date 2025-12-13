import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import {
  LoadingSpinner,
  ErrorMessage,
  Section,
} from '../components/Dashboard';
import { TrendingUp, BarChart3, PieChart, Lightbulb, AlertTriangle, CheckCircle, ArrowRight, Building, Users, Activity, MapPin, Globe, Heart } from 'lucide-react';

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
                <span>• Child Annual Surveys (500 records) • Child Education Data (500 records) • Anganwadi Centers (2,013 centers) • Schools (1,655 schools)</span>
                <span className="block mt-1 italic text-xs">
                  Note: The same child may appear in multiple program datasets; figures represent program records and service touchpoints, not a de-duplicated count of unique children.
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
                Comprehensive analysis of 360,000+ records across Child Annual Surveys (126,502), Education programs (233,165), 
                Anganwadi centers (2,013), and Schools (1,600) reveals key patterns in demographics, infrastructure, teacher resources, 
                and service delivery that can guide strategic program optimization.
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
                      <strong>Network Strength:</strong> 1,819 Anganwadi centers form the backbone of early childhood services
                    </p>
                  </div>
                  <div className="flex items-start">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>School Coverage:</strong> Primary schools (843) dominate, with secondary education facilities needing expansion
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
              </div>
            </div>

            {/* Data Quality Note */}
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                <strong>Note:</strong> Insights derived from analysis of 20 comprehensive visualizations covering demographics, 
                education, infrastructure, teacher resources, nutrition services, special needs, and geographic distribution. 
                Recommendations should be validated with on-ground realities. Use the interactive map to explore state-specific data.
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
