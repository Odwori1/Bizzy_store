import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCurrency } from '../../hooks/useCurrency';

interface TopProduct {
  product_name: string;
  quantity_sold: number;
  total_revenue: number;
}

interface TopProductsChartProps {
  data: TopProduct[];
}

const TopProductsChart: React.FC<TopProductsChartProps> = ({ data }) => {
  const { formatCurrency, getCurrencySymbol, isLoading } = useCurrency();

  // Limit to top 5 products for better visualization
  const top5Products = data.slice(0, 5);

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  const currencySymbol = getCurrencySymbol();

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top5Products}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="product_name"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${currencySymbol}${value.toLocaleString()}`}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Revenue']}
            />
            <Bar
              dataKey="total_revenue"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TopProductsChart;
