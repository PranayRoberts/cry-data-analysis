import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  trend?: 'up' | 'down' | 'stable';
  percentChange?: number;
  unit?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, trend, percentChange, unit }) => {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  
  // Handle null/undefined/NaN values
  const displayValue = value === null || value === undefined || (typeof value === 'number' && isNaN(value)) 
    ? '0' 
    : typeof value === 'number' 
      ? value.toLocaleString() 
      : value;

  // Determine color based on label content
  const getValueColor = () => {
    const labelLower = label.toLowerCase();
    if (labelLower.includes('boy')) return 'text-blue-600';
    if (labelLower.includes('girl')) return 'text-pink-600';
    return 'text-gray-900';
  };

  const getLabelColor = () => {
    const labelLower = label.toLowerCase();
    if (labelLower.includes('boy')) return 'text-blue-700';
    if (labelLower.includes('girl')) return 'text-pink-700';
    return 'text-gray-700';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-400">
      <p className={`${getLabelColor()} text-sm font-medium`}>{label}</p>
      <h3 className={`text-3xl font-bold mt-2 ${getValueColor()}`}>
        {displayValue}
        {unit && <span className="text-lg ml-1">{unit}</span>}
      </h3>
      {percentChange !== undefined && !isNaN(percentChange) && (
        <div className={`flex items-center mt-2 ${trendColor}`}>
          <TrendIcon size={16} className="mr-1" />
          <span className="text-sm font-semibold">{percentChange > 0 ? '+' : ''}{percentChange}%</span>
        </div>
      )}
    </div>
  );
};

export const FilterBar: React.FC<{
  filters: { [key: string]: string };
  filterOptions: { [key: string]: string[] };
  onFilterChange: (key: string, value: string) => void;
}> = ({ filters, filterOptions, onFilterChange }) => (
  <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-wrap gap-4">
    {Object.entries(filterOptions).map(([filterKey, options]) => {
      const displayKey = filterKey === 'region' ? 'Region' : filterKey === 'district' ? 'District' : filterKey;
      return (
        <div key={filterKey} className="flex flex-col">
          <label htmlFor={`filter-${filterKey}`} className="text-sm font-medium text-gray-700 mb-1">
            {displayKey}
          </label>
          <select
            id={`filter-${filterKey}`}
            value={filters[filterKey] || ''}
            onChange={(e) => onFilterChange(filterKey, e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All {displayKey}s</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    })}
  </div>
);

export const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

export const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
    <strong className="font-bold">Error:</strong>
    <span className="block sm:inline ml-2">{message}</span>
  </div>
);

export const DashboardGrid: React.FC<{ children: React.ReactNode; columns?: number }> = ({
  children,
  columns = 2,
}) => (
  <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-6`}>{children}</div>
);

export const ChartContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">{children}</div>
);

export const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-12 relative">
    <h2 className="text-2xl font-bold mb-6 text-gray-900">{title}</h2>
    {children}
  </div>
);
