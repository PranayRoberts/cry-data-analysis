import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../hooks/useData';
import {
  StatCard,
  LoadingSpinner,
  ErrorMessage,
  ChartContainer,
  Section,
  DashboardGrid,
} from '../components/Dashboard';
import { generateSummaryStats } from '../utils/dataProcessor';
import { BarChart3, Users, Building2, BookOpen } from 'lucide-react';

export const MainDashboard: React.FC = () => {
  const { data: anganwadiData, loading: anganwadiLoading, error: anganwadiError } = useData({
    dataPath: '/data/anganwadi_data.json',
  });
  const { data: childData, loading: childLoading, error: childError } = useData({
    dataPath: '/data/child_annual_data.json',
  });
  const { data: educationData, loading: educationLoading, error: educationError } = useData({
    dataPath: '/data/child_education_data.json',
  });
  const { data: schoolData, loading: schoolLoading, error: schoolError } = useData({
    dataPath: '/data/school_data.json',
  });

  const allStats = useMemo(() => {
    console.log('Computing allStats...', { anganwadiData, childData, educationData, schoolData });
    
    const stats = {
      anganwadi: null as any,
      child: null as any,
      education: null as any,
      school: null as any,
    };

    try {
      if (anganwadiData && typeof anganwadiData === 'object') {
        const data2024 =
          anganwadiData['anganwadi-centre-information_2024.xlsx_anganwadi-centre-information'] || [];
        stats.anganwadi = generateSummaryStats(Array.isArray(data2024) ? data2024 : []);
      }

      if (childData && typeof childData === 'object') {
        const data2024 = childData['child-annual-information_Report_2024.xlsx_child-annual-information'] || [];
        stats.child = generateSummaryStats(Array.isArray(data2024) ? data2024 : []);
      }

      if (educationData && typeof educationData === 'object') {
        const data2024 = educationData['child-education_Consolidated_2024.xlsx_child-education'] || [];
        stats.education = generateSummaryStats(Array.isArray(data2024) ? data2024 : []);
      }

      if (schoolData && typeof schoolData === 'object') {
        const data2024 = schoolData['school-level-information_2024.xlsx_school-level-information'] || [];
        stats.school = generateSummaryStats(Array.isArray(data2024) ? data2024 : []);
      }
    } catch (err) {
      console.error('Error computing stats:', err);
    }

    console.log('Computed stats:', stats);
    return stats;
  }, [anganwadiData, childData, educationData, schoolData]);

  const loading = anganwadiLoading || childLoading || educationLoading || schoolLoading;

  const overallStats = useMemo(() => {
    console.log('Computing overallStats from allStats:', allStats);
    
    try {
      const total = {
        centers: (allStats.anganwadi?.totalRecords || 0) + (allStats.school?.totalRecords || 0),
        children: (allStats.child?.totalChildren || 0) + (allStats.education?.totalChildren || 0),
        regions: new Set<string>(),
        districts: new Set<string>(),
      };

      [allStats.anganwadi, allStats.child, allStats.education, allStats.school].forEach((stat) => {
        if (stat?.regions) stat.regions.forEach((r: string) => total.regions.add(r));
        if (stat?.districts) stat.districts.forEach((d: string) => total.districts.add(d));
      });

      const result = {
        ...total,
        regions: total.regions.size,
        districts: total.districts.size,
      };
      
      console.log('Computed overallStats:', result);
      return result;
    } catch (err) {
      console.error('Error computing overallStats:', err);
      return {
        centers: 0,
        children: 0,
        regions: 0,
        districts: 0,
      };
    }
  }, [allStats]);

  const dashboardCards = useMemo(() => [
    {
      title: 'Anganwadi Centers',
      description: 'Early childhood care, nutrition, and preschool education for children 0-6 years',
      icon: Building2,
      path: '/anganwadi',
      stat: allStats.anganwadi?.totalRecords || 0,
      color: 'from-blue-400 to-blue-600',
      metrics: 'Centers, Enrollment, Services',
    },
    {
      title: 'Child Annual Report',
      description: 'Comprehensive child census tracking demographics, health, and household status',
      icon: Users,
      path: '/child-annual',
      stat: allStats.child?.totalChildren || 0,
      color: 'from-green-400 to-green-600',
      metrics: 'Census Data, Gender Parity, Growth',
    },
    {
      title: 'Child Education',
      description: 'School enrollment status, dropout analysis, and educational equity monitoring',
      icon: BookOpen,
      path: '/child-education',
      stat: allStats.education?.totalChildren || 0,
      color: 'from-purple-400 to-purple-600',
      metrics: 'Enrollment, Retention, Equity',
    },
    {
      title: 'School Information',
      description: 'Infrastructure quality, teaching resources, and student population analysis',
      icon: BarChart3,
      path: '/school',
      stat: allStats.school?.totalRecords || 0,
      color: 'from-orange-400 to-orange-600',
      metrics: 'Infrastructure, Students, Quality',
    },
  ], [allStats]);

  // NOW check for errors and loading AFTER all hooks
  if (loading) return <LoadingSpinner />;
  
  const anyError = anganwadiError || childError || educationError || schoolError;
  if (anyError) {
    console.error('Data loading error:', { anganwadiError, childError, educationError, schoolError });
    return <ErrorMessage message={`Failed to load data: ${anyError}`} />;
  }

  if (!anganwadiData && !childData && !educationData && !schoolData) {
    return <ErrorMessage message="No data available. Please check data files." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">CRY Data Analysis Dashboard</h1>
          <p className="text-xl text-gray-600 mb-4">
            Comprehensive insights into child welfare and education across regions
          </p>
          
          {/* Welcome Context */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 ml-6">
            <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-white mb-6">
              Welcome to CRY's Interactive Data Dashboard
            </h2>
            <p className="text-sm text-gray-700 mb-3">
              This dashboard consolidates data from <strong>4 key program areas</strong> spanning <strong>2023-2024</strong>, 
              tracking over <strong>65,000 records</strong> to measure impact on child rights, education, health, and welfare.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="font-bold">•</span>
                <div>
                  <strong>Geographic Coverage:</strong> Multiple regions, states, districts tracking CRY's intervention footprint
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-bold">•</span>
                <div>
                  <strong>Data Sources:</strong> Anganwadi centers, child census, education status, school infrastructure
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-bold">•</span>
                <div>
                  <strong>Key Metrics:</strong> Enrollment trends, gender parity, service delivery, infrastructure quality
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-bold">•</span>
                <div>
                  <strong>How to Use:</strong> Click any module below to explore detailed dashboards with filters and visualizations
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Statistics */}
        <Section title="Overall Statistics">
          <div className="mb-4">
            <p className="text-sm text-gray-700">
              <strong>Summary Metrics:</strong> These numbers represent the aggregate scale of CRY's intervention programs. 
              <span className="font-medium"> Facilities</span> include Anganwadi centers and schools; 
              <span className="font-medium"> Children Tracked</span> shows total beneficiaries across all programs; 
              <span className="font-medium"> Geographic Coverage</span> indicates reach across India.
            </p>
          </div>
          <DashboardGrid columns={4}>
            <StatCard
              label="Total Facilities"
              value={overallStats.centers}
              trend="stable"
            />
            <StatCard
              label="Total Children Tracked"
              value={overallStats.children}
              trend="stable"
            />
            <StatCard
              label="Regions Covered"
              value={overallStats.regions}
              trend="stable"
            />
            <StatCard
              label="Districts Covered"
              value={overallStats.districts}
              trend="stable"
            />
          </DashboardGrid>
        </Section>

        {/* Dashboard Cards */}
        <Section title="Data Modules">
          <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="font-bold text-blue-900 mb-3 text-lg">Getting Started: Where to Find Your Answers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <strong className="block mb-2">For Coverage & Reach Questions:</strong>
                <ul className="space-y-1 ml-4">
                  <li><strong>Executive Summary:</strong> High-level YoY changes, overall growth, strategic insights</li>
                  <li><strong>Key Insights:</strong> Performance rankings, top/bottom performers by location</li>
                </ul>
              </div>
              <div>
                <strong className="block mb-2">For Nutrition & Health Questions:</strong>
                <ul className="space-y-1 ml-4">
                  <li><strong>Key Insights:</strong> Underweight, stunting, wasting trends by district</li>
                  <li><strong>Child Annual Dashboard:</strong> Detailed census and demographic data</li>
                </ul>
              </div>
              <div>
                <strong className="block mb-2">For Education Outcomes:</strong>
                <ul className="space-y-1 ml-4">
                  <li><strong>Education Dashboard:</strong> Enrollment, attendance, dropout analysis</li>
                  <li><strong>School Dashboard:</strong> Infrastructure, teacher ratios, facility quality</li>
                </ul>
              </div>
              <div>
                <strong className="block mb-2">For Infrastructure & Equity:</strong>
                <ul className="space-y-1 ml-4">
                  <li><strong>Key Insights:</strong> Infrastructure impact on outcomes, rural vs urban equity</li>
                  <li><strong>Advanced Analytics:</strong> Interactive maps, correlations, multi-metric comparisons</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-0">
            {dashboardCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.path}
                  to={card.path}
                  className="group hover:shadow-xl transition-all duration-300 relative z-0"
                >
                  <div className={`bg-gradient-to-br ${card.color} p-6 rounded-lg text-white shadow-lg hover:scale-105 transition-transform relative z-0`}>
                    <div className="flex items-center justify-between mb-3">
                      <Icon size={32} className="opacity-80" />
                      <div className="text-3xl font-bold opacity-20">→</div>
                    </div>
                    <h3 className="text-lg font-bold mb-2">{card.title}</h3>
                    <p className="text-sm opacity-90 mb-2">{card.description}</p>
                    <p className="text-xs opacity-75 mb-3 font-medium">{card.metrics}</p>
                    <div className="pt-3 border-t border-white border-opacity-30">
                      <div className="text-2xl font-bold">{card.stat.toLocaleString()}</div>
                      <p className="text-xs opacity-75">
                        {card.title.includes('School') || card.title.includes('Anganwadi') ? 'Facilities' : 'Children'}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Section>

        {/* Quick Insights */}
        <Section title="Quick Insights & The Story Behind Our Data">
          {/* Story Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Coverage Story */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg shadow-md border-l-4 border-green-500">
              <h4 className="font-bold text-green-900 mb-2 text-lg">Program Reach</h4>
              <p className="text-sm text-green-800 mb-3">
                We're tracking <strong>{overallStats.children.toLocaleString()}</strong> children across 
                <strong> {overallStats.centers}</strong> facilities in <strong>{overallStats.districts}</strong> districts.
              </p>
              <div className="bg-white p-3 rounded-md">
                <p className="text-xs text-gray-700">
                  <strong>What this means:</strong> Our geographic footprint ensures diverse coverage across India, 
                  allowing us to measure impact in varied contexts—from urban centers to rural villages.
                </p>
              </div>
            </div>

            {/* Gender Story */}
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-lg shadow-md border-l-4 border-pink-500">
              <h4 className="font-bold text-pink-900 mb-2 text-lg">Gender Equity</h4>
              <p className="text-sm text-pink-800 mb-3">
                Girls represent <strong>{((allStats.child?.totalGirls || 0) + (allStats.education?.totalGirls || 0))}</strong> of 
                <strong> {((allStats.child?.totalChildren || 0) + (allStats.education?.totalChildren || 0))}</strong> tracked children.
              </p>
              <div className="bg-white p-3 rounded-md">
                <p className="text-xs text-gray-700">
                  <strong>What this means:</strong> We monitor gender parity closely. A balanced ratio (close to 50%) 
                  indicates equitable access. Gaps signal areas needing targeted girls' education and health programs.
                </p>
              </div>
            </div>

            {/* Impact Story */}
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-lg shadow-md border-l-4 border-pink-500">
              <h4 className="font-bold text-blue-900 mb-2 text-lg">Data-Driven Impact</h4>
              <p className="text-sm text-blue-800 mb-3">
                With <strong>2 years of data</strong> (2023-2024), we can track trends, identify improvements, 
                and pinpoint areas needing intervention.
              </p>
              <div className="bg-white p-3 rounded-md">
                <p className="text-xs text-gray-700">
                  <strong>What this means:</strong> Year-over-year comparisons reveal where strategies work 
                  (replicate them!) and where challenges persist (prioritize resources there).
                </p>
              </div>
            </div>
          </div>

          {/* Key Questions We Answer */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Key Questions This Dashboard Answers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Program Performance</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>How many children did we reach in 2023 vs 2024?</li>
                  <li>Which districts/blocks show the most growth?</li>
                  <li>Are we maintaining service quality while scaling?</li>
                  <li>Where are attendance and enrollment strongest?</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Health & Nutrition</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>What's the trend in malnutrition (underweight, stunting, wasting)?</li>
                  <li>Which locations improved vs worsened?</li>
                  <li>Are younger age groups (0-3) or older (3-6) more affected?</li>
                  <li>Do boys and girls face different nutrition challenges?</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Education Equity</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>Are girls equally enrolled and attending school?</li>
                  <li>What are the main dropout reasons?</li>
                  <li>How do promotion/retention rates vary by grade and gender?</li>
                  <li>Is rural access comparable to urban?</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Infrastructure Quality</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>Do facilities have toilets, drinking water, electricity?</li>
                  <li>How do teacher/child ratios compare across locations?</li>
                  <li>Does infrastructure quality correlate with better outcomes?</li>
                  <li>Where should we prioritize infrastructure investments?</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Visual Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartContainer>
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold mb-4">Gender Distribution</h3>
                <div className="flex justify-around text-center">
                  <div>
                    <div className="text-3xl font-bold text-blue-600">
                      {((allStats.child?.totalBoys || 0) + (allStats.education?.totalBoys || 0))}
                    </div>
                    <p className="text-gray-600">Boys</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-pink-600">
                      {((allStats.child?.totalGirls || 0) + (allStats.education?.totalGirls || 0))}
                    </div>
                    <p className="text-gray-600">Girls</p>
                  </div>
                </div>
              </div>
            </ChartContainer>

            <ChartContainer>
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold mb-4">Key Facts</h3>
                <ul className="text-left space-y-2 text-gray-700">
                  <li className="flex justify-between">
                    <span>Anganwadi Centers:</span>
                    <span className="font-bold">{allStats.anganwadi?.totalRecords || 0}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Schools:</span>
                    <span className="font-bold">{allStats.school?.totalRecords || 0}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Active Regions:</span>
                    <span className="font-bold">(North, South, East, West) {overallStats.regions} </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Active Districts:</span>
                    <span className="font-bold">{overallStats.districts}</span>
                  </li>
                </ul>
              </div>
            </ChartContainer>
          </div>
        </Section>

        {/* Recommendations */}
        <Section title="Strategic Recommendations">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Actions Items</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-bold text-green-700 mb-2">Continue & Expand</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>Scale successful models to new regions</li>
                  <li>Strengthen high-performing centres/schools</li>
                  <li>Maintain momentum in gender equity gains</li>
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-bold text-yellow-700 mb-2">Areas Needing Attention</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>Investigate regions with declining coverage</li>
                  <li>Address gender gaps if below 45%</li>
                  <li>Focus on underperforming blocks/villages</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-bold text-blue-700 mb-2">Data-Driven Priorities</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>Link infrastructure quality to child outcomes</li>
                  <li>Monitor nutrition/health trends closely</li>
                  <li>Track attendance and retention patterns</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-bold text-purple-700 mb-2">Next Steps</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>Deep-dive into specific dashboards for details</li>
                  <li>Use Advanced Analytics for correlation studies</li>
                  <li>Compare blocks/villages for best practices</li>
                </ul>
              </div>
            </div>
          </div>
        </Section>

        <div className="mt-12 pt-8 border-t border-gray-300">
          <div className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Turning Data Into Action</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-bold text-green-700 mb-2">What's Working</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li><strong>Celebrate Top Performers:</strong> Identify best-performing districts in Key Insights dashboard</li>
                  <li><strong>Replicate Success:</strong> Document and share practices from high-performing centers</li>
                  <li><strong>Visible Progress:</strong> Use Executive Summary to showcase YoY improvements to stakeholders</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-bold text-red-700 mb-2">Where to Focus</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li><strong>Bottom Performers:</strong> Allocate resources to bottom 10 districts (see Key Insights)</li>
                  <li><strong>Rising Malnutrition:</strong> Target districts with worsening nutrition indicators</li>
                  <li><strong>Gender Gaps:</strong> Address locations where girls' participation is below 45%</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-bold text-blue-700 mb-2">Next Steps</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li><strong>Quarterly Reviews:</strong> Set targets for improvement in identified weak areas</li>
                  <li><strong>Infrastructure ROI:</strong> Prioritize facilities with proven outcome correlations</li>
                  <li><strong>Equity Targets:</strong> Establish district-level gender parity and rural-urban balance goals</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Navigation Guide
          <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Where to Go Next</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-blue-50 rounded">
                <strong className="text-blue-900">Anganwadi Dashboard</strong>
                <p className="text-gray-700 mt-1">For early childhood nutrition & centre-level data</p>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <strong className="text-green-900">Child Annual Dashboard</strong>
                <p className="text-gray-700 mt-1">For demographic census and health tracking</p>
              </div>
              <div className="p-3 bg-purple-50 rounded">
                <strong className="text-purple-900">Education Dashboard</strong>
                <p className="text-gray-700 mt-1">For enrollment, retention, and dropout analysis</p>
              </div>
              <div className="p-3 bg-orange-50 rounded">
                <strong className="text-orange-900">Advanced Analytics</strong>
                <p className="text-gray-700 mt-1">For correlations, maps, and complex trends</p>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};
