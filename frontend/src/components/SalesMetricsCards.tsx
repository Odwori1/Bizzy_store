import React from 'react';
import { CurrencyDisplay } from "./CurrencyDisplay";
import { useBusinessStore } from '../hooks/useBusiness';

interface SalesMetrics {
  total_sales: number;
  total_sales_original?: number;
  total_transactions: number;
  average_transaction_value: number;
  average_transaction_value_original?: number;
  daily_sales?: number;
  daily_sales_original?: number;
  weekly_sales?: number;
  weekly_sales_original?: number;
  primary_currency?: string;
}

interface SalesMetricsCardsProps {
  metrics: SalesMetrics;
}

const SalesMetricsCards: React.FC<SalesMetricsCardsProps> = ({ metrics }) => {
  const { business } = useBusinessStore();
  const businessCurrency = business?.currency_code || 'USD';

  const cards = [
    {
      title: 'Today\'s Sales',
      value: (
        <CurrencyDisplay
          amount={metrics.daily_sales || metrics.total_sales || 0}
          originalAmount={metrics.daily_sales_original || metrics.total_sales_original || 0}
          originalCurrencyCode={metrics.primary_currency || businessCurrency}
          preserveOriginal={true}
        />
      ),
      change: '+12%',
      icon: '💰',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Weekly Revenue',
      value: (
        <CurrencyDisplay
          amount={metrics.weekly_sales || metrics.total_sales || 0}
          originalAmount={metrics.weekly_sales_original || metrics.total_sales_original || 0}
          originalCurrencyCode={metrics.primary_currency || businessCurrency}
          preserveOriginal={true}
        />
      ),
      change: '+8%',
      icon: '📈',
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'Avg. Transaction',
      value: (
        <CurrencyDisplay
          amount={metrics.average_transaction_value || 0}
          originalAmount={metrics.average_transaction_value_original || 0}
          originalCurrencyCode={metrics.primary_currency || businessCurrency}
          preserveOriginal={true}
        />
      ),
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
