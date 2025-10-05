import { useState, useEffect } from 'react';
import { activityService } from '../services/activity';

export interface Activity {
  type: 'sale' | 'inventory' | 'expense';
  id: number;
  description: string;
  amount?: number;
  product_id?: number;
  timestamp: string;
  user_id?: number;
}

export const useActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = async (hours: number = 24, limit: number = 10) => {
    setLoading(true);
    setError(null);
    try {
      const response = await activityService.getRecentActivities(hours, limit);
      setActivities(response.data.activities);
    } catch (err) {
      setError('Failed to load activities');
      console.error('Activity load error:', err);
    } finally {
      setLoading(false);
    }
  };

  return { activities, loading, error, loadActivities };
};
