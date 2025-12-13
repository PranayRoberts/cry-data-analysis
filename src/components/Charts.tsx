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
          <Bar dataKey={yKey} fill="#3b82f6" />
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
        <BarChart data={data} barSize={40} barGap={8}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis 
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
            domain={domain || [0, 'auto']}
            scale={scale}
            tickCount={6}
          />
          <Tooltip formatter={(value) => isPercentage ? `${value}%` : value} />
          <Legend />
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

export const DemographicPieChart: React.FC<PieChartDataProps> = ({ data, title, height = 300 }) => (
  <div className="w-full">
    {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          labelLine={false}
          label={({ name, value }) => `${name}: ${value}`}
          isAnimationActive={false}
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

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
