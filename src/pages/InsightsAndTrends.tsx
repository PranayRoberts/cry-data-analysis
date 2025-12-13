import React, { useMemo, useState } from 'react';
import { useData } from '../hooks/useData';
import {
  LoadingSpinner,
  ChartContainer,
  Section,
} from '../components/Dashboard';
import { GroupedBarChart } from '../components/Charts';
import {
  analyzeNutrition,
  compareNutritionYears,
  rankLocations,
  analyzeInfrastructureImpact,
  analyzeEquity,
} from '../utils/dataProcessor';
import { TrendingUp, TrendingDown, Award, AlertCircle } from 'lucide-react';

// Component: Key Insights & Trends Dashboard
export const InsightsAndTrends: React.FC = () => {
  // All hooks must be called unconditionally before any early returns
  
  // Data fetching hooks
  const { data: childData, loading: childLoading } = useData({
    dataPath: '/data/child_annual_data.json',
  });
  const { data: educationData, loading: educationLoading } = useData({
    dataPath: '/data/child_education_data.json',
  });
  const { data: schoolData, loading: schoolLoading } = useData({
    dataPath: '/data/school_data.json',
  });
  const { data: anganwadiData, loading: anganwadiLoading } = useData({
    dataPath: '/data/anganwadi_data.json',
  });

  // State hook
  const [selectedMetric, setSelectedMetric] = useState<'underweight' | 'stunting' | 'wasting'>('underweight');

  // Process datasets
  const processedData = useMemo(() => {
    const result = {
      child2023: [] as any[],
      child2024: [] as any[],
      education2023: [] as any[],
      education2024: [] as any[],
      school2023: [] as any[],
      school2024: [] as any[],
      anganwadi2023: [] as any[],
      anganwadi2024: [] as any[],
    };

    if (childData && typeof childData === 'object') {
      result.child2023 = childData['Child_Annual_2023.xlsx_child-annual-information'] || [];
      result.child2024 = childData['child-annual-information_Report_2024.xlsx_child-annual-information'] || [];
    }

    if (educationData && typeof educationData === 'object') {
      result.education2023 = educationData['child-education_Consolidated_2023.xlsx_child-education'] || [];
      result.education2024 = educationData['child-education_Consolidated_2024.xlsx_child-education'] || [];
    }

    if (schoolData && typeof schoolData === 'object') {
      result.school2023 = schoolData['school-level-information_2023.xlsx_school-level-information'] || [];
      result.school2024 = schoolData['school-level-information_2024.xlsx_school-level-information'] || [];
    }

    if (anganwadiData && typeof anganwadiData === 'object') {
      result.anganwadi2023 = anganwadiData['anganwadi-centre-information_2023.xlsx_anganwadi-centre-information'] || [];
      result.anganwadi2024 = anganwadiData['anganwadi-centre-information_2024.xlsx_anganwadi-centre-information'] || [];
    }

    return result;
  }, [childData, educationData, schoolData, anganwadiData]);

  // Nutrition trends analysis
  const nutritionAnalysis = useMemo(() => {
    if (processedData.child2023.length === 0 || processedData.child2024.length === 0) {
      return null;
    }

    const nutrition2023 = analyzeNutrition(processedData.child2023, 'district');
    const nutrition2024 = analyzeNutrition(processedData.child2024, 'district');
    const comparisons = compareNutritionYears(processedData.child2023, processedData.child2024, 'district');

    console.log('Nutrition Analysis:', {
      '2023 districts': nutrition2023.length,
      '2024 districts': nutrition2024.length,
      'comparisons': comparisons.length,
      'sample comparison': comparisons[0]
    });

    return {
      nutrition2023,
      nutrition2024,
      comparisons,
    };
  }, [processedData]);

  // Top and bottom performers
  const performanceRankings = useMemo(() => {
    if (processedData.education2024.length === 0) {
      return null;
    }

    // Count enrolled children by district
    const districtEnrollment: Record<string, number> = {};
    processedData.education2024.forEach((record: any) => {
      const district = record['District Name'];
      const enrollmentStatus = record['If enrolled, enrollment status'];
      
      if (district && enrollmentStatus === 'Enrolled and currently going to school') {
        districtEnrollment[district] = (districtEnrollment[district] || 0) + 1;
      }
    });

    // Convert to array format for ranking
    const districtData = Object.entries(districtEnrollment).map(([district, count]) => ({
      'District Name': district,
      enrollmentCount: count
    }));

    return rankLocations(districtData, 'enrollmentCount', 'district', 10);
  }, [processedData]);

  // Infrastructure correlation
  const infrastructureAnalysis = useMemo(() => {
    if (processedData.school2024.length === 0 || processedData.education2024.length === 0) {
      return null;
    }

    // Use actual field names from school data
    return analyzeInfrastructureImpact(
      processedData.school2024,
      processedData.education2024,
      ['Toilet for children', 'Availablity of Drinking Water', 'Availability of Electricity', 'Separate kitchen with shed', 'Playground available']
    );
  }, [processedData]);

  // Equity analysis
  const equityAnalysis = useMemo(() => {
    if (processedData.child2024.length === 0) {
      return null;
    }

    // Use 'Location Type' field which contains Rural/Urban data
    return analyzeEquity(processedData.child2024, 'Location Type');
  }, [processedData]);

  // Prepare nutrition chart data - MUST be before any conditional returns
  const nutritionChartData = useMemo(() => {
    if (!nutritionAnalysis) return [];

    const filteredComparisons = nutritionAnalysis.comparisons
      .filter((c) => c.metric === selectedMetric)
      .sort((a, b) => a.change - b.change)
      .slice(0, 15);

    return filteredComparisons.map((c) => ({
      location: c.location.substring(0, 20), // Truncate for readability
      '2023': parseFloat(c.value2023.toFixed(1)),
      '2024': parseFloat(c.value2024.toFixed(1)),
    }));
  }, [nutritionAnalysis, selectedMetric]);

  // Infrastructure impact chart - MUST be before any conditional returns
  const infrastructureChartData = useMemo(() => {
    if (!infrastructureAnalysis) return [];

    return infrastructureAnalysis.map((infra) => ({
      facility: infra.facility,
      'With Infrastructure': parseFloat(infra.hasInfrastructure.avgAttendance.toFixed(1)),
      'Without Infrastructure': parseFloat(infra.noInfrastructure.avgAttendance.toFixed(1)),
    }));
  }, [infrastructureAnalysis]);

  // Loading check AFTER all hooks
  const loading = childLoading || educationLoading || schoolLoading || anganwadiLoading;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-3">Key Insights & Trends</h1>
        <p className="text-xl text-gray-600 mb-4">
          Deep-dive analysis answering critical questions about nutrition, infrastructure, equity, and performance
        </p>

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg shadow-md">
          <h3 className="font-semibold text-purple-900 mb-2">What You'll Find Here:</h3>
          <ul className="text-sm text-purple-800 space-y-1">
            <li><strong>Nutrition Trends:</strong> Underweight, stunting, wasting by location with year-over-year changes</li>
            <li><strong>Performance Rankings:</strong> Top 10 best and worst performing districts/blocks</li>
            <li><strong>Infrastructure Impact:</strong> How toilets, water, electricity affect child outcomes</li>
            <li><strong>Equity Analysis:</strong> Rural vs urban, gender balance, and geographic disparities</li>
          </ul>
        </div>
      </div>

      {/* Nutrition & Health Trends */}
      {nutritionAnalysis && (
        <>
          <Section title="Child Nutrition & Health Trends (2023 vs 2024)">
            <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Data Note:</strong> Nutrition metrics (underweight, stunting, wasting) are calculated using district-level aggregates. 
                The charts display district-wise malnutrition trends based on available child health records.
              </p>
              <div className="text-sm text-gray-700 mt-2 space-y-1">
                <p><strong>Key Terms:</strong></p>
                <ul className="list-disc ml-5 space-y-1">
                  <li><strong>Underweight:</strong> Low weight-for-age (indicates overall malnutrition)</li>
                  <li><strong>Stunting:</strong> Low height-for-age (chronic malnutrition, affects growth)</li>
                  <li><strong>Wasting:</strong> Low weight-for-height (acute malnutrition, immediate concern)</li>
                </ul>
              </div>
            </div>
            <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <p className="text-sm text-gray-700">
                <strong>Insight:</strong> These charts show malnutrition trends by district. 
                <span className="text-red-600 font-semibold"> Downward trends in malnutrition percentages are positive</span> (fewer underweight/stunted children).
                Focus interventions on districts where malnutrition increased or remained high.
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
                {selectedMetric} % by District (Top 15 Districts)
              </h3>
              {nutritionChartData.length > 0 ? (
                <GroupedBarChart
                  data={nutritionChartData}
                  xKey="location"
                  lines={[
                    { key: '2023', name: '2023', color: '#f59e0b' },
                    { key: '2024', name: '2024', color: '#10b981' },
                  ]}
                  title=""
                  height={400}
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
                  Top 5 Improvements (Malnutrition Decreased)
                </h4>
                <div className="space-y-2">
                  {nutritionAnalysis.comparisons
                    .filter((c) => c.metric === selectedMetric && c.change < 0)
                    .sort((a, b) => a.change - b.change)
                    .slice(0, 5)
                    .map((c, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-800">{c.location}</span>
                        <span className="text-green-700 font-bold">
                          {c.change.toFixed(1)}% ↓
                        </span>
                      </div>
                    ))}
                  {nutritionAnalysis.comparisons.filter((c) => c.metric === selectedMetric && c.change < 0).length === 0 && (
                    <p className="text-sm text-gray-600 italic">No improvements detected</p>
                  )}
                </div>
              </div>

              <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                <h4 className="font-bold text-red-900 mb-3 flex items-center">
                  <TrendingUp className="mr-2" size={20} />
                  Top 5 Concerns (Malnutrition Increased)
                </h4>
                <div className="space-y-2">
                  {nutritionAnalysis.comparisons
                    .filter((c) => c.metric === selectedMetric && c.change > 0)
                    .sort((a, b) => b.change - a.change)
                    .slice(0, 5)
                    .map((c, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-800">{c.location}</span>
                        <span className="text-red-700 font-bold">
                          +{c.change.toFixed(1)}% ↑
                        </span>
                      </div>
                    ))}
                  {nutritionAnalysis.comparisons.filter((c) => c.metric === selectedMetric && c.change > 0).length === 0 && (
                    <p className="text-sm text-gray-600 italic">No concerns detected</p>
                  )}
                </div>
              </div>
            </div>
          </Section>
        </>
      )}

      {/* Performance Rankings */}
      {performanceRankings && (
        <Section title="District Performance Rankings (Education/Attendance)">
          <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
            <p className="text-sm text-gray-700">
              <strong>Insight:</strong> These rankings show top and bottom performing districts by enrollment or attendance. 
              Celebrate and learn from top performers; allocate additional resources to bottom performers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg shadow-md">
              <h4 className="font-bold text-green-900 mb-4 text-xl flex items-center">
                <Award className="mr-2 text-yellow-500" size={24} />
                Top 10 Performers
              </h4>
              <div className="space-y-3">
                {performanceRankings.top.map((perf, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      {/* <span className="bg-green-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                        {idx + 1}
                      </span> */}
                      <span className="font-medium text-gray-800">{perf.location}</span>
                    </div>
                    <span className="text-green-700 font-bold">{perf.value.toLocaleString()} enrolled</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Performers */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-lg shadow-md">
              <h4 className="font-bold text-red-900 mb-4 text-xl flex items-center">
                <AlertCircle className="mr-2 text-red-500" size={24} />
                Bottom 10 Performers (Need Support)
              </h4>
              <div className="space-y-3">
                {performanceRankings.bottom.map((perf, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      {/* <span className="bg-red-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                        {idx + 1}
                      </span> */}
                      <span className="font-medium text-gray-800">{perf.location}</span>
                    </div>
                    <span className="text-red-700 font-bold">{perf.value.toLocaleString()} enrolled</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Infrastructure Impact */}
      {infrastructureAnalysis && infrastructureChartData.length > 0 && (
        <Section title="Infrastructure Impact on Child Outcomes">
          <div className="mb-4 p-4 bg-purple-50 border-l-4 border-purple-500 rounded">
            <p className="text-sm text-gray-700">
              <strong>Insight:</strong> This analysis shows the relationship between school infrastructure (toilets, water, electricity) 
              and average attendance rates. <span className="font-semibold">Higher bars = Better outcomes.</span> Use this to justify infrastructure investments.
            </p>
          </div>

          <ChartContainer>
            <h3 className="text-lg font-semibold mb-4 text-center">
              Average Attendance by Infrastructure Availability
            </h3>
            <GroupedBarChart
              data={infrastructureChartData}
              xKey="facility"
              lines={[
                { key: 'With Infrastructure', name: 'With Infra', color: '#10b981' },
                { key: 'Without Infrastructure', name: 'Without Infra', color: '#ef4444' },
              ]}
              title=""
              height={400}
            />
          </ChartContainer>

          {/* Impact Summary */}
          <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
            <h4 className="font-bold text-gray-900 mb-4">Infrastructure Impact Summary</h4>
            <div className="space-y-3">
              {infrastructureAnalysis.map((infra, idx) => {
                const impactPercent = infra.impact.toFixed(1);
                const isPositive = infra.impact > 0;
                
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium text-gray-800">{infra.facility}</span>
                    <div className="text-right">
                      <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{impactPercent}% impact
                      </span>
                      <p className="text-xs text-gray-600">
                        ({infra.hasInfrastructure.count} with / {infra.noInfrastructure.count} without)
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>
      )}

      {/* Equity Analysis */}
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

      {/* Recommendations */}
      <Section title="Actionable Recommendations for Leadership">
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Based on This Analysis:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-green-700 mb-2">Celebrate Successes</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Recognize top-performing districts and replicate their models</li>
                <li>Highlight infrastructure investments that show positive outcomes</li>
                <li>Share best practices from districts with improved nutrition</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-red-700 mb-2">Target Interventions</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Prioritize bottom 10 districts with additional resources</li>
                <li>Address malnutrition increases with targeted health programs</li>
                <li>Invest in infrastructure (toilets, water) at underperforming schools</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-blue-700 mb-2">Monitor & Track</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Set quarterly targets for bottom performers</li>
                <li>Track nutrition metrics monthly in high-concern areas</li>
                <li>Establish infrastructure benchmarks for all facilities</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-purple-700 mb-2">Equity Focus</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Ensure girls' participation reaches 50% in all regions</li>
                <li>Bridge rural-urban gaps in service quality</li>
                <li>Address geographic disparities systematically</li>
              </ul>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
};
