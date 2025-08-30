import React from 'react';

interface SalesMetrics {
  total_sales: number;
  total_transactions: number;
  average_transaction_value: number;
  daily_sales?: number;
  weekly_sales?: number;
}

interface SalesMetricsCardsProps {
  metrics: SalesMetrics;
}

const SalesMetricsCards: React.FC<SalesMetricsCardsProps> = ({ metrics }) => {
  const cards = [
    {
      title: 'Today\'s Sales',
      value: `$${metrics.daily_sales?.toFixed(2) || '0.00'}`,
      change: '+12%', // This would come from your API
      icon: '💰',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Weekly Revenue',
      value: `$${metrics.weekly_sales?.toFixed(2) || metrics.total_sales.toFixed(2)}`,
      change: '+8%',
      icon: '📈',
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'Avg. Transaction',
      value: `$${metrics.average_transaction_value.toFixed(2)}`,
      change: '+5%',
      icon: '📊',
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'Total Transactions',
      value: metrics.total_transactions.toString(),
      change: '+15%',
      icon: '🛒',
      color: 'bg-orange-50 text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-green-600">{card.change} from yesterday</p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${card.color}`}>
              <span className="text-2xl">{card.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SalesMetricsCards;
