import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TopProduct {
  product_name: string;
  quantity_sold: number;
  total_revenue: number;
}

interface TopProductsChartProps {
  data: TopProduct[];
}

const TopProductsChart: React.FC<TopProductsChartProps> = ({ data }) => {
  // Limit to top 5 products for better visualization
  const top5Products = data.slice(0, 5);

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
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value) => [`$${value}`, 'Revenue']}
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
