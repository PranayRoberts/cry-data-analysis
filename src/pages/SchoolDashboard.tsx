import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { ComparisonBarChart, GenderDistributionChart, DemographicPieChart } from '../components/Charts';
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

export const SchoolDashboard: React.FC = () => {
  const { data: allData, loading, error } = useData({ dataPath: '/data/school_data.json' });
  const [filters, setFilters] = useState<{ region?: string; district?: string }>({});

  const data = useMemo(() => {
    if (!allData || typeof allData !== 'object') return null;

    const data2023 = allData['school-level-information_2023.xlsx_school-level-information'] || [];
    const data2024 = allData['school-level-information_2024.xlsx_school-level-information'] || [];

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

  const teacherCounts = useMemo(() => {
    const countTeachers = (dataset: any[]) => {
      return dataset.reduce((sum, school) => {
        const total = school['Total numbers of teachers'] || 0;
        return sum + (typeof total === 'number' ? total : 0);
      }, 0);
    };
    return {
      teachers2023: countTeachers(filteredData.data2023),
      teachers2024: countTeachers(filteredData.data2024),
    };
  }, [filteredData]);

  const schoolComparison = useMemo(() => {
    return [
      {
        metric: 'Total Schools',
        2023: stats2023.totalRecords,
        2024: stats2024.totalRecords,
      },
      {
        metric: 'Total Students',
        2023: stats2023.totalChildren,
        2024: stats2024.totalChildren,
      },
      {
        metric: 'Total Teachers',
        2023: teacherCounts.teachers2023,
        2024: teacherCounts.teachers2024,
      },
    ];
  }, [stats2023, stats2024, teacherCounts]);

  const genderData = useMemo(() => {
    return [
      {
        category: 'School Enrollment',
        boys: stats2024.totalBoys,
        girls: stats2024.totalGirls,
      },
    ];
  }, [stats2024]);

  const infrastructureData = useMemo(() => {
    const libraryCount = filteredData.data2024.filter((s) => s['Libraray available'] === 'Yes').length;
    const playgroundCount = filteredData.data2024.filter((s) => s['Playground available'] === 'Yes').length;
    const scienceLabCount = filteredData.data2024.filter(
      (s) => s['Availability of Science lab'] === 'Yes'
    ).length;
    const boundaryCount = filteredData.data2024.filter(
      (s) => s['Boundary wall available'] === 'Complete boundary wall with a gate' || s['Boundary wall available'] === 'Yes'
    ).length;

    return [
      { name: 'Library', value: libraryCount },
      { name: 'Playground', value: playgroundCount },
      { name: 'Science Lab', value: scienceLabCount },
      { name: 'Boundary Wall', value: boundaryCount },
    ];
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

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <ErrorMessage message="No data available" />;

  const schoolGrowth = calculatePercentChange(stats2023.totalRecords, stats2024.totalRecords);
  const studentGrowth = calculatePercentChange(stats2023.totalChildren, stats2024.totalChildren);
  const getTrend = (val2024: number, val2023: number): 'up' | 'down' | 'stable' => {
    if (val2024 > val2023) return 'up';
    if (val2024 < val2023) return 'down';
    return 'stable';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-2 text-gray-900">School Level Information Dashboard</h1>
      <p className="text-gray-600 mb-4">Infrastructure quality, teaching resources, student demographics, and facility availability across surveyed schools</p>
      
      {/* Contextual Information */}
      <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
        <h3 className="font-semibold text-orange-900 mb-2">What This Dashboard Shows:</h3>
        <ul className="text-sm text-orange-800 space-y-1">
          <li><strong>School Infrastructure:</strong> Availability of essential facilities like libraries, playgrounds, science labs, and boundary walls</li>
          <li><strong>Student Enrollment:</strong> Total student population growth from 2023 to 2024 indicating educational access expansion</li>
          <li><strong>Gender Balance:</strong> Boys vs girls enrollment in schools to ensure equitable access to education</li>
          <li><strong>Quality Indicators:</strong> Infrastructure availability correlates with learning outcomes and student retention</li>
        </ul>
        <p className="text-xs text-orange-700 mt-2 italic"><strong>Why It Matters:</strong> Schools with proper infrastructure show better learning outcomes. Low infrastructure scores indicate urgent need for resource allocation.</p>
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
            label="Total Schools (2024)"
            value={stats2024.totalRecords}
            trend={getTrend(stats2024.totalRecords, stats2023.totalRecords)}
            percentChange={schoolGrowth}
          />
          <StatCard
            label="Total Students (2024)"
            value={stats2024.totalChildren}
            trend={getTrend(stats2024.totalChildren, stats2023.totalChildren)}
            percentChange={studentGrowth}
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

      <Section title="School & Student Comparison">
        <ChartContainer>
          <ComparisonBarChart
            data={schoolComparison}
            xKey="metric"
            yKey="2024"
            title="School Statistics Comparison"
            height={350}
            domain={[1, 'dataMax']}
            scale="log"
          />
        </ChartContainer>
      </Section>

      <Section title="Student Gender Distribution">
        <ChartContainer>
          <GenderDistributionChart data={genderData} title="Boys vs Girls Enrollment" height={400} />
        </ChartContainer>
      </Section>

      <Section title="Infrastructure Availability">
        <ChartContainer>
          <DemographicPieChart data={infrastructureData} title="Schools with Key Infrastructure" height={350} />
        </ChartContainer>
      </Section>

      <Section title="Geographic Coverage">
        <DashboardGrid columns={2}>
          <StatCard label="Regions Covered" value={stats2024.regions.length} trend="stable" />
          <StatCard label="Districts Covered" value={stats2024.districts.length} trend="stable" />
        </DashboardGrid>
      </Section>
    </div>
  );
};
