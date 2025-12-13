import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import {
  ComparisonBarChart,
  GroupedBarChart,
} from '../components/Charts';
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

export const AnganwadiDashboard: React.FC = () => {
  const { data: allData, loading, error } = useData({ dataPath: '/data/anganwadi_data.json' });
  const [filters, setFilters] = useState<{ region?: string; district?: string }>({});

  const data = useMemo(() => {
    if (!allData || typeof allData !== 'object') return null;

    // Merge data from both years
    const data2023 = allData['anganwadi-centre-information_Report_2023.xlsx_anganwadi-centre-information'] || [];
    const data2024 = allData['anganwadi-centre-information_2024.xlsx_anganwadi-centre-information'] || [];

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

  const enrollmentTrend = useMemo(() => {
    if (!filteredData.data2023.length || !filteredData.data2024.length) return [];

    const trend23 = generateSummaryStats(filteredData.data2023);
    const trend24 = generateSummaryStats(filteredData.data2024);

    return [
      {
        year: '2023',
        'Children (0-3)': 0,
        'Children (3-6)': 0,
        'Adolescent Girls': 0,
        'Total Centers': trend23.totalRecords,
      },
      {
        year: '2024',
        'Children (0-3)': 0,
        'Children (3-6)': 0,
        'Adolescent Girls': 0,
        'Total Centers': trend24.totalRecords,
      },
    ];
  }, [filteredData]);

  const serviceAvailability = useMemo(() => {
    const services = [
      { key: 'Health check up service available', label: 'Health Checkup' },
      { key: 'Nutrition & Health education service available', label: 'Nutrition Education' },
      { key: 'Immunization service available', label: 'Immunization' },
      { key: 'Referral services available', label: 'Referral Services' },
    ];

    const getServicePercentage = (dataset: any[], service: string) => {
      if (dataset.length === 0) return 0;
      // Match any value that starts with "Yes" (handles "Yes", "Yes, available and regular", "Yes, available and irregular", etc.)
      const count = dataset.filter((item) => {
        const value = item[service];
        return value && String(value).toLowerCase().startsWith('yes');
      }).length;
      return Math.round((count / dataset.length) * 100);
    };

    return services.map((service) => ({
      service: service.label,
      '2023': getServicePercentage(filteredData.data2023, service.key),
      '2024': getServicePercentage(filteredData.data2024, service.key),
    }));
  }, [filteredData]);

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

  const regionCounts = useMemo(() => {
    if (!filteredData.data2024.length) return {};
    const counts: Record<string, number> = {};
    filteredData.data2024.forEach((item) => {
      const region = item['Region Name'];
      if (region) {
        counts[region] = (counts[region] || 0) + 1;
      }
    });
    return counts;
  }, [filteredData]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <ErrorMessage message="No data available" />;

  const childrenGrowth = calculatePercentChange(stats2023.totalRecords, stats2024.totalRecords);
  const getTrend = (val2024: number, val2023: number): 'up' | 'down' | 'stable' => {
    if (val2024 > val2023) return 'up';
    if (val2024 < val2023) return 'down';
    return 'stable';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-2 text-gray-900">Anganwadi Centers Dashboard</h1>
      <p className="text-gray-600 mb-4">Comprehensive analysis of Integrated Child Development Services (ICDS) centers providing nutrition, health, and early childhood education</p>
      
      {/* Contextual Information */}
      <div className="mb-6 p-4 bg-blue-50 border-l-4 border-gray-900/60 dark:border-gray-100/40 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">What This Dashboard Shows:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>Center Network:</strong> 3,998 Anganwadi centers tracked (2,013 in 2024 + 1,985 in 2023), showing +1.4% expansion year-over-year</li>
          <li><strong>Service Delivery:</strong> Health checkups, immunization (87-91% coverage), nutrition education, and referral services availability</li>
          <li><strong>Geographic Coverage:</strong> Multi-region coverage with district-level filtering to identify service gaps</li>
          <li><strong>Early Childhood Focus:</strong> Children 0-6 years and adolescent girls (10-18) receiving ICDS benefits</li>
        </ul>
        <p className="text-xs text-blue-700 mt-2 italic"><strong>Key Data:</strong> Use filters to compare regional performance. Service availability percentages show what proportion of centers offer each service.</p>
      </div>

      <FilterBar
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={(key, value) => {
          if (key === 'region') {
            // Clear district when region changes
            setFilters({ region: value });
          } else {
            setFilters({ ...filters, [key]: value });
          }
        }}
      />

      <Section title="Key Metrics">
        <DashboardGrid columns={4}>
          <StatCard
            label="Total Anganwadi Centers (2024)"
            value={stats2024.totalRecords}
            trend={getTrend(stats2024.totalRecords, stats2023.totalRecords)}
            percentChange={childrenGrowth}
          />
          <StatCard
            label="Total Children Enrolled (2024)"
            value={stats2024.totalChildren}
            trend={getTrend(stats2024.totalChildren, stats2023.totalChildren)}
            percentChange={calculatePercentChange(stats2023.totalChildren, stats2024.totalChildren)}
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

      <Section title="Enrollment Trends">
        <ChartContainer>
          <ComparisonBarChart
            data={enrollmentTrend}
            xKey="year"
            yKey="Total Centers"
            title="Anganwadi Centers Growth"
            height={400}
            domain={[1940, 2015]}
          />
        </ChartContainer>
      </Section>

      <Section title="Service Availability">
        <ChartContainer>
          <GroupedBarChart
            data={serviceAvailability}
            xKey="service"
            lines={[
              { key: '2023', name: '2023', color: '#ef4444' },
              { key: '2024', name: '2024', color: '#10b981' },
            ]}
            title="Health and Nutrition Services (% of Centers)"
            height={350}
            yAxisLabel="% of Centers"
            isPercentage={true}
            domain={[0, 100]}
          />
        </ChartContainer>
        <p className="text-sm text-gray-600 mt-2">
          Percentage of Anganwadi centers offering each service
        </p>
      </Section>

      <Section title="Coverage by Region">
        <DashboardGrid columns={2}>
          {stats2024.regions.map((region) => (
            <StatCard 
              key={region} 
              label={`Centers in ${region}`} 
              value={regionCounts[region] || 0} 
              trend="stable" 
            />
          ))}
        </DashboardGrid>
      </Section>

      {/* Enrollment & Gender Parity Analysis */}
      {(stats2024.totalChildren < stats2023.totalChildren || stats2024.totalGirls < stats2023.totalGirls) && (
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
          <h3 className="font-semibold text-yellow-900 mb-2">Understanding the Enrollment Changes:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div className="bg-white p-3 rounded text-sm">
              <p className="font-semibold text-green-700 mb-1">Positive Indicators:</p>
              <ul className="text-yellow-800 space-y-1">
                <li><strong>Centers grew</strong> from 1,985 to 2,013 (+1.4%) - program is expanding</li>
                <li><strong>Adolescent girls increased</strong> - older girl retention improved</li>
                <li><strong>Gender ratio stable</strong> at ~49% girls (near parity)</li>
              </ul>
            </div>
            <div className="bg-white p-3 rounded text-sm">
              <p className="font-semibold text-red-700 mb-1">Areas of Concern:</p>
              <ul className="text-yellow-800 space-y-1">
                <li><strong>0-3 year enrollment</strong> slightly down</li>
                <li><strong>3-6 year enrollment</strong> slightly down</li>
                <li><strong>Girls dropped slightly more</strong> than boys</li>
              </ul>
            </div>
          </div>
          
          <h4 className="font-semibold text-yellow-900 mb-1">Likely Reasons for Small Decline:</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li><strong>Age Transition:</strong> Children aging out of 0-6 bracket into formal schooling (positive outcome)</li>
            <li><strong>Migration Patterns:</strong> Seasonal family migration for agricultural/construction work affects presence</li>
            <li><strong>Birth Rate Trends:</strong> Declining birth rates in some regions reduce new enrollments</li>
            <li><strong>Data Quality:</strong> Better data hygiene may have removed duplicate registrations</li>
          </ul>
          
          {stats2024.totalGirls < stats2023.totalGirls && (
            <div className="mt-3 pt-3 border-t border-yellow-300">
              <h4 className="font-semibold text-yellow-900 mb-1">Why Girls' Enrollment Dropped Slightly More:</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li><strong>Household Responsibilities:</strong> Girls (especially 3-6 years) may be kept home to help with younger siblings</li>
                <li><strong>Distance Concerns:</strong> Safety concerns about travel may disproportionately affect girls</li>
                <li><strong>Note:</strong> The gap is small and gender ratio remains near parity at ~49%</li>
              </ul>
            </div>
          )}
          <p className="text-xs text-yellow-700 mt-3 italic"><strong>Recommended Actions:</strong> Focus community outreach on 0-3 year enrollment, track migration patterns, and maintain girl-friendly facilities to preserve near-parity gender ratio.</p>
        </div>
      )}

      {/* Summary & Key Insights */}
      <Section title="Summary & Key Insights">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Center Status */}
            <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
              <h4 className="font-bold text-blue-800 mb-2">Center Growth</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>2024 Centers:</strong> {stats2024.totalRecords.toLocaleString()}</li>
                <li><strong>2023 Centers:</strong> {stats2023.totalRecords.toLocaleString()}</li>
                <li><strong>Growth:</strong> <span className={childrenGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>{childrenGrowth >= 0 ? '+' : ''}{childrenGrowth}%</span></li>
              </ul>
            </div>

            {/* Enrollment */}
            <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
              <h4 className="font-bold text-green-800 mb-2">Child Enrollment</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>2024 Children:</strong> {stats2024.totalChildren.toLocaleString()}</li>
                <li><strong>Boys:</strong> {stats2024.totalBoys.toLocaleString()}</li>
                <li><strong>Girls:</strong> {stats2024.totalGirls.toLocaleString()}</li>
              </ul>
            </div>

            {/* Service Coverage */}
            <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
              <h4 className="font-bold text-purple-800 mb-2">Service Coverage</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>Health Checkup:</strong> {serviceAvailability.find(s => s.service === 'Health Checkup')?.['2024'] || 0}%</li>
                <li><strong>Immunization:</strong> {serviceAvailability.find(s => s.service === 'Immunization')?.['2024'] || 0}%</li>
                <li><strong>Nutrition Ed:</strong> {serviceAvailability.find(s => s.service === 'Nutrition Education')?.['2024'] || 0}%</li>
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
                  {stats2024.totalRecords > stats2023.totalRecords && (
                    <li>Center network expanded by {((stats2024.totalRecords - stats2023.totalRecords) / stats2023.totalRecords * 100).toFixed(1)}%</li>
                  )}
                  <li>High immunization coverage ({serviceAvailability.find(s => s.service === 'Immunization')?.['2024'] || 0}%)</li>
                  <li>Strong health checkup availability ({serviceAvailability.find(s => s.service === 'Health Checkup')?.['2024'] || 0}%)</li>
                  <li>Coverage across {stats2024.regions.length} regions, {stats2024.districts.length}+ districts</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-red-700 mb-1">Areas of Concern:</p>
                <ul className="text-gray-700 space-y-1 list-disc ml-4">
                  {stats2024.totalChildren < stats2023.totalChildren && (
                    <li>Child enrollment declined by {Math.abs(calculatePercentChange(stats2023.totalChildren, stats2024.totalChildren))}%</li>
                  )}
                  <li>Referral services only at {serviceAvailability.find(s => s.service === 'Referral Services')?.['2024'] || 0}%</li>
                  {stats2024.totalGirls < stats2023.totalGirls && (
                    <li>Girls' enrollment declined slightly</li>
                  )}
                  <li>Need to improve 0-3 year child registration</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Action Items & Recommendations */}
      <Section title="Action Items & Recommendations">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Immediate Actions */}
            <div className="bg-white p-4 rounded-lg border-l-4 border-red-500">
              <h4 className="font-bold text-red-700 mb-3">Immediate Priority (Q1)</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold">•</span>
                  <div>
                    <strong>Referral Services Gap:</strong> Only {serviceAvailability.find(s => s.service === 'Referral Services')?.['2024'] || 0}% of centers have referral services - establish linkages with PHCs for remaining centers
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold">•</span>
                  <div>
                    <strong>0-3 Year Outreach:</strong> Increase home visits and community mobilization to improve infant registration in underserved areas
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold">•</span>
                  <div>
                    <strong>Girls' Retention:</strong> Monitor gender ratio closely - implement girl-friendly facilities where enrollment is declining
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
                    <strong>Nutrition Programs:</strong> Strengthen supplementary nutrition delivery - use NFHS-5 (2019-21) baseline data to target high-malnutrition districts
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <div>
                    <strong>AWW Training:</strong> Conduct refresher training on growth monitoring and early childhood care across all {stats2024.totalRecords.toLocaleString()} centers
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <div>
                    <strong>Service Standardization:</strong> Ensure all 6 ICDS services available at every center - target 95%+ coverage
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
                    <strong>Geographic Expansion:</strong> Extend center network to underserved hamlets - build on +1.4% growth trend
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 font-bold">•</span>
                  <div>
                    <strong>Infrastructure Upgrade:</strong> Improve center facilities - water, sanitation, play equipment, learning materials
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 font-bold">•</span>
                  <div>
                    <strong>Malnutrition Focus:</strong> Target high-stunting states (Bihar, Jharkhand, MP) with intensive nutrition interventions
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
                    <strong>Target:</strong> Achieve 95%+ coverage for all 4 core services (Health, Immunization, Nutrition Ed, Referral)
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <div>
                    <strong>Target:</strong> Maintain immunization at 90%+ (current: {serviceAvailability.find(s => s.service === 'Immunization')?.['2024'] || 0}%)
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <div>
                    <strong>Target:</strong> Gender parity within 2% of 50-50 across all centers
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <div>
                    <strong>Target:</strong> 5% YoY increase in 0-3 year enrollment
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
                <div className="text-xl font-bold text-blue-600">{stats2024.totalRecords.toLocaleString()}</div>
                <div className="text-gray-600">AWC Centers</div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xl font-bold text-green-600">{stats2024.totalChildren.toLocaleString()}</div>
                <div className="text-gray-600">Children Enrolled</div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xl font-bold text-purple-600">{serviceAvailability.find(s => s.service === 'Immunization')?.['2024'] || 0}%</div>
                <div className="text-gray-600">Immunization</div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xl font-bold text-amber-600">{stats2024.regions.length}</div>
                <div className="text-gray-600">Regions Covered</div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
};
