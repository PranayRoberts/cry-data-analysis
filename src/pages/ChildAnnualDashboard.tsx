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
import { generateSummaryStats, filterData, calculatePercentChange } from '../utils/dataProcessor';

export const ChildAnnualDashboard: React.FC = () => {
  const { data: allData, loading, error } = useData({ dataPath: '/data/child_annual_data.json' });
  const [filters, setFilters] = useState<{ region?: string; district?: string }>({});

  const data = useMemo(() => {
    if (!allData || typeof allData !== 'object') return null;

    const data2023 = allData['Child_Annual_2023.xlsx_child-annual-information'] || [];
    const data2024 = allData['child-annual-information_Report_2024.xlsx_child-annual-information'] || [];

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

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <ErrorMessage message="No data available" />;

  const childrenGrowth = calculatePercentChange(stats2023.totalChildren, stats2024.totalChildren);
  const getTrend = (val2024: number, val2023: number): 'up' | 'down' | 'stable' => {
    if (val2024 > val2023) return 'up';
    if (val2024 < val2023) return 'down';
    return 'stable';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-2 text-gray-900">Annual Child Report Dashboard</h1>
      <p className="text-gray-600 mb-4">Annual census data tracking individual child demographics, health status, and household conditions</p>
      
      {/* Contextual Information */}
      <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
        <h3 className="font-semibold text-green-900 mb-2">What This Dashboard Shows:</h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li><strong>Population Census:</strong> Total children registered and tracked in CRY intervention areas</li>
          <li><strong>Gender Parity:</strong> Boys vs girls ratio to identify gender gaps (target: 50-50 balance)</li>
          <li><strong>Growth Trends:</strong> Year-over-year changes showing program expansion or contraction</li>
          <li><strong>Geographic Reach:</strong> Regional distribution revealing coverage across states and districts</li>
        </ul>
        <p className="text-xs text-green-700 mt-2 italic"><strong>Key Insight:</strong> Percentage changes highlight program growth; gender distribution shows inclusivity. Green arrows (↑) indicate positive trends.</p>
      </div>

      <FilterBar
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={(key, value) => {
          if (key === 'region') {
            setFilters({ region: value });
          } else {
            setFilters({ ...filters, [key]: value });
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
    </div>
  );
};
