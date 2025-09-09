import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCurrency } from '../../hooks/useCurrency';

interface SalesTrendData {
  date: string;
  sales: number;
  transactions: number;
}

interface SalesTrendChartProps {
  data: SalesTrendData[];
}

const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ data }) => {
  const { formatCurrency, getCurrencySymbol, isLoading } = useCurrency();

  // Convert sales data to local currency for display
  const convertedData = data.map(item => ({
    ...item,
    sales: item.sales // The conversion will happen in the tooltip formatter
  }));

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Sales Trends</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  const currencySymbol = getCurrencySymbol();

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Sales Trends</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={convertedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${currencySymbol}${value.toLocaleString()}`}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Sales']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesTrendChart;
