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
          <li><strong>Center Growth:</strong> Track expansion of Anganwadi centers from 2023 to 2024</li>
          <li><strong>Child Enrollment:</strong> Monitor children served across age groups (0-3 years, 3-6 years, adolescent girls 10-18)</li>
          <li><strong>Service Delivery:</strong> Evaluate availability of critical services like immunization, health checkups, and nutrition programs</li>
          <li><strong>Geographic Coverage:</strong> Identify service gaps and areas needing intervention across regions and districts</li>
        </ul>
        <p className="text-xs text-blue-700 mt-2 italic"><strong>How to use:</strong> Apply region/district filters to compare performance, look for upward trends (↑) indicating growth, and identify centers with high service availability.</p>
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
          <h3 className="font-semibold text-yellow-900 mb-2">Why Enrollment May Have Decreased:</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li><strong>Data Collection Timing:</strong> 2024 data may have been collected earlier in the year before full enrollment cycles completed</li>
            <li><strong>Migration Patterns:</strong> Seasonal migration of families for agricultural or construction work affects child presence at centers</li>
            <li><strong>Age Transition:</strong> Children aging out of the 0-6 year bracket transition to formal schooling</li>
            <li><strong>Center Consolidation:</strong> Some smaller centers may have merged or closed due to infrastructure issues</li>
          </ul>
          {stats2024.totalGirls < stats2023.totalGirls && (
            <div className="mt-3 pt-3 border-t border-yellow-300">
              <h4 className="font-semibold text-yellow-900 mb-1">Why Girls' Enrollment May Have Dropped More:</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li><strong>Household Responsibilities:</strong> Girls are often kept home to help with siblings or household chores</li>
                <li><strong>Distance to Centers:</strong> Safety concerns about travel distance disproportionately affect girls</li>
                <li><strong>Early Marriage Pressure:</strong> In some regions, social pressures reduce girls' participation in programs</li>
                <li><strong>Lack of Separate Facilities:</strong> Inadequate toilet/sanitation facilities for girls can deter enrollment</li>
              </ul>
            </div>
          )}
          <p className="text-xs text-yellow-700 mt-3 italic"><strong>Recommended Actions:</strong> Conduct community outreach, ensure safe transportation, improve sanitation facilities, and engage with families on the importance of girls' participation.</p>
        </div>
      )}
    </div>
  );
};
