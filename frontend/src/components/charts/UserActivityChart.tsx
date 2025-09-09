import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UserActivityData {
  user_id: number;
  username: string;
  scan_count: number;
}

interface UserActivityChartProps {
  data: UserActivityData[];
}

const UserActivityChart: React.FC<UserActivityChartProps> = ({ data }) => {
  // Limit to top 10 users for better visualization
  const topUsers = data.slice(0, 10);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">User Scanning Activity</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={topUsers}
            layout="vertical"
            margin={{ left: 100 }} // Extra margin for long usernames
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <YAxis 
              type="category" 
              dataKey="username"
              tick={{ fontSize: 12 }}
              width={80}
            />
            <Tooltip
              formatter={(value: number) => [value, 'Scans']}
              labelFormatter={(label) => `User: ${label}`}
            />
            <Bar
              dataKey="scan_count"
              fill="#8b5cf6"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UserActivityChart;
