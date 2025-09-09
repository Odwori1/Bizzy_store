import { api } from './api';

export const activityService = {
  getRecentActivities: (hours: number = 24, limit: number = 10) => {
    return api.get(`/api/activity/recent?hours=${hours}&limit=${limit}`);
  },
};
