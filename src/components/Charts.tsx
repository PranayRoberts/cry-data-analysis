import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface ChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  title?: string;
  height?: number;
  colors?: string[];
  domain?: [number | 'auto' | 'dataMin' | 'dataMax', number | 'auto' | 'dataMin' | 'dataMax'];
  scale?: 'auto' | 'linear' | 'log';
}

interface MultiLineChartProps {
  data: any[];
  xKey: string;
  lines: { key: string; name: string; color: string }[];
  title?: string;
  height?: number;
  yAxisLabel?: string;
  isPercentage?: boolean;
  domain?: [number | 'auto' | 'dataMin' | 'dataMax', number | 'auto' | 'dataMin' | 'dataMax'];
  scale?: 'auto' | 'linear' | 'log';
}

interface PieChartDataProps {
  data: Array<{ name: string; value: number }>;
  title?: string;
  height?: number;
}

const CHART_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const TrendLineChart: React.FC<ChartProps> = ({ data, xKey, yKey, title, height = 300 }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full p-4 text-center text-gray-500">
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        <p>No data available</p>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey={yKey} stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const MultiLineChart: React.FC<MultiLineChartProps> = ({
  data,
  xKey,
  lines,
  title,
  height = 300,
}) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full p-4 text-center text-gray-500">
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        <p>No data available</p>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              strokeWidth={2}
              name={line.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ComparisonBarChart: React.FC<ChartProps> = ({
  data,
  xKey,
  yKey,
  title,
  height = 300,
  domain,
  scale = 'auto',
}) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full p-4 text-center text-gray-500">
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        <p>No data available</p>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} barSize={60}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis 
            domain={domain || [0, 'auto']}
            scale={scale}
            tickCount={10}
          />
          <Tooltip />
          <Legend />
          <Bar dataKey={yKey} fill="#3b82f6" minPointSize={5} label={{ position: 'top', fill: '#666', fontSize: 11 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const GroupedBarChart: React.FC<MultiLineChartProps> = ({
  data,
  xKey,
  lines,
  title,
  height = 300,
  yAxisLabel,
  isPercentage = false,
  domain,
  scale = 'auto',
}) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full p-4 text-center text-gray-500">
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        <p>No data available</p>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} barSize={40} barGap={8} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey={xKey} 
            angle={-45} 
            textAnchor="end" 
            interval={0}
            height={80}
            tick={{ fontSize: 11 }}
          />
          <YAxis 
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
            domain={domain || [0, 'auto']}
            scale={scale}
            tickCount={6}
          />
          <Tooltip formatter={(value) => isPercentage ? `${value}%` : value} />
          <Legend wrapperStyle={{ paddingTop: 10 }} />
          {lines.map((line) => (
            <Bar
              key={line.key}
              dataKey={line.key}
              fill={line.color}
              name={line.name}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SimpleAreaChart: React.FC<ChartProps> = ({ data, xKey, yKey, title, height = 300 }) => (
  <div className="w-full">
    {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey={yKey} stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export const DemographicPieChart: React.FC<PieChartDataProps> = ({ data, title, height = 400 }) => {
  // Sort data by value descending for consistent ordering
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const total = sortedData.reduce((sum, item) => sum + item.value, 0);
  
  // Ensure small slices have minimum visibility (at least 1.5% visual representation)
  const minAngle = 5; // Minimum angle in degrees for visibility

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={sortedData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={140}
              fill="#8884d8"
              dataKey="value"
              labelLine={false}
              paddingAngle={2}
              minAngle={minAngle}
              isAnimationActive={false}
              stroke="#fff"
              strokeWidth={2}
            >
              {sortedData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => value.toLocaleString()} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Colored Legend below chart - Table format */}
      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Category</th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Count</th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((entry, index) => {
              const color = CHART_COLORS[index % CHART_COLORS.length];
              const percent = ((entry.value / total) * 100).toFixed(1);
              return (
                <tr 
                  key={entry.name} 
                  className="border-t border-gray-200 dark:border-gray-600"
                  style={{ backgroundColor: `${color}10` }}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded flex-shrink-0" 
                        style={{ backgroundColor: color }}
                      />
                      <span 
                        className="font-medium truncate" 
                        style={{ color: color }}
                        title={entry.name}
                      >
                        {entry.name.length > 30 ? entry.name.substring(0, 27) + '...' : entry.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-gray-900 dark:text-white">
                    {entry.value.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span 
                      className="text-xs font-medium px-2 py-1 rounded-full"
                      style={{ backgroundColor: color, color: 'white' }}
                    >
                      {percent}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const GenderDistributionChart: React.FC<any> = ({ data, title, height = 300 }) => {
  // Calculate dynamic domain based on data
  const minValue = Math.min(
    ...data.flatMap((item: any) => [item.boys || 0, item.girls || 0])
  );
  const domainMin = Math.max(0, Math.floor(minValue * 0.8));
  
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} barSize={60} barGap={8}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis domain={[domainMin, 'dataMax']} tickCount={6} />
          <Tooltip />
          <Legend />
          <Bar dataKey="boys" fill="#3b82f6" name="Boys" />
          <Bar dataKey="girls" fill="#ec4899" name="Girls" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
