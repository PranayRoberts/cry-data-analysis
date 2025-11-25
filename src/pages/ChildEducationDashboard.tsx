import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { ComparisonBarChart, GenderDistributionChart } from '../components/Charts';
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

export const ChildEducationDashboard: React.FC = () => {
  const { data: allData, loading, error } = useData({ dataPath: '/data/child_education_data.json' });
  const [filters, setFilters] = useState<{ region?: string; district?: string }>({});

  const data = useMemo(() => {
    if (!allData || typeof allData !== 'object') return null;

    const data2023 = allData['Child_education_Consolidated-2023.xlsx_child-education'] || [];
    const data2024 = allData['child-education_Consolidated_2024.xlsx_child-education'] || [];

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

  const educationComparison = useMemo(() => {
    return [
      {
        metric: 'Total Children',
        2023: stats2023.totalChildren,
        2024: stats2024.totalChildren,
      },
      {
        metric: 'Total Boys',
        2023: stats2023.totalBoys,
        2024: stats2024.totalBoys,
      },
      {
        metric: 'Total Girls',
        2023: stats2023.totalGirls,
        2024: stats2024.totalGirls,
      },
    ];
  }, [stats2023, stats2024]);

  const genderParityData = useMemo(() => {
    return [
      {
        category: 'Overall Enrollment',
        boys: stats2024.totalBoys,
        girls: stats2024.totalGirls,
      },
    ];
  }, [stats2024]);

  const genderParity2023 = useMemo(() => {
    const total = stats2023.totalBoys + stats2023.totalGirls;
    return total > 0 ? ((stats2023.totalGirls / total) * 100) : 0;
  }, [stats2023]);

  const genderParity2024 = useMemo(() => {
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
      <h1 className="text-4xl font-bold mb-2 text-gray-900">Child Education Dashboard</h1>
      <p className="text-gray-600 mb-4">Comprehensive analysis of school enrollment, retention, educational access, and gender parity in education</p>
      
      {/* Contextual Information */}
      <div className="mb-6 p-4 bg-purple-50 border-l-4 border-purple-500 rounded-lg">
        <h3 className="font-semibold text-purple-900 mb-2">What This Dashboard Shows:</h3>
        <ul className="text-sm text-purple-800 space-y-1">
          <li><strong>Enrollment Status:</strong> Track children actively attending school vs dropouts to measure educational continuity</li>
          <li><strong>Gender in Education:</strong> Boys vs girls enrollment to ensure equal educational opportunities (SDG 5: Gender Equality)</li>
          <li><strong>Year-over-Year Progress:</strong> Compare 2023 vs 2024 to identify improvements or areas needing intervention</li>
          <li><strong>Regional Disparities:</strong> Identify geographic areas with low enrollment or high dropout rates</li>
        </ul>
        <p className="text-xs text-purple-700 mt-2 italic"><strong>Action Point:</strong> Red arrows (↓) indicate declining metrics requiring immediate attention; green arrows (↑) show positive impact of interventions.</p>
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
            label="Gender Parity (2024)"
            value={genderParity2024.toFixed(1)}
            unit="%"
            trend={genderParity2024 >= genderParity2023 ? 'up' : 'down'}
            percentChange={parseFloat((genderParity2024 - genderParity2023).toFixed(2))}
          />
        </DashboardGrid>
      </Section>

      <Section title="Year-over-Year Comparison">
        <ChartContainer>
          <ComparisonBarChart
            data={educationComparison}
            xKey="metric"
            yKey="2024"
            title="Education Metrics Comparison"
            height={350}
            domain={[200, 'dataMax']}
          />
        </ChartContainer>
      </Section>

      <Section title="Gender Distribution">
        <ChartContainer>
          <GenderDistributionChart data={genderParityData} title="Boys vs Girls Enrollment" height={400} />
        </ChartContainer>
      </Section>

      <Section title="Geographic Coverage">
        <DashboardGrid columns={2}>
          <StatCard label="Regions Covered" value={stats2024.regions.length} trend="stable" />
          <StatCard label="Districts Covered" value={stats2024.districts.length} trend="stable" />
        </DashboardGrid>
      </Section>

      {/* Enrollment & Gender Parity Analysis */}
      {(stats2024.totalChildren < stats2023.totalChildren || stats2024.totalGirls < stats2023.totalGirls) && (
        <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
          <h3 className="font-semibold text-orange-900 mb-2">Why Enrollment May Have Decreased:</h3>
          <ul className="text-sm text-orange-800 space-y-1">
            <li><strong>Data Collection Period:</strong> 2024 data may reflect a different point in the academic year than 2023</li>
            <li><strong>Economic Pressures:</strong> Families facing financial hardship may pull children out for child labor</li>
            <li><strong>School Accessibility:</strong> Distance to schools, lack of transportation, or unsafe routes</li>
            <li><strong>COVID-19 Aftermath:</strong> Continued recovery from pandemic-era disruptions to education</li>
            <li><strong>Regional Factors:</strong> Natural disasters, conflicts, or displacement in certain areas</li>
          </ul>
          {stats2024.totalGirls < stats2023.totalGirls && (
            <div className="mt-3 pt-3 border-t border-orange-300">
              <h4 className="font-semibold text-orange-900 mb-1">Why Girls' Enrollment Dropped More Than Boys:</h4>
              <ul className="text-sm text-orange-800 space-y-1">
                <li><strong>Domestic Responsibilities:</strong> Girls are disproportionately assigned household and caregiving duties</li>
                <li><strong>Safety Concerns:</strong> Lack of safe transport or harassment on routes to school</li>
                <li><strong>Inadequate Sanitation:</strong> Schools without proper girls' toilets see higher female dropout rates</li>
                <li><strong>Early Marriage:</strong> Cultural pressures for early marriage interrupt girls' education</li>
                <li><strong>Menstrual Hygiene:</strong> Lack of facilities and awareness leads to absenteeism and eventual dropout</li>
                <li><strong>Family Priorities:</strong> When resources are limited, families may prioritize boys' education</li>
              </ul>
            </div>
          )}
          <p className="text-xs text-orange-700 mt-3 italic"><strong>Recommended Actions:</strong> Implement girl-specific retention programs, improve school sanitation, provide scholarships, conduct community awareness on girls' education, and ensure safe transportation.</p>
        </div>
      )}
    </div>
  );
};
