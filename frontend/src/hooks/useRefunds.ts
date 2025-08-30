import { useState, useCallback } from 'react';
import { Refund, RefundCreate } from '../types';
import { refundsService } from '../services/refunds';

export const useRefunds = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRefund = useCallback(async (refundData: RefundCreate): Promise<Refund | null> => {
    setLoading(true);
    setError(null);
    try {
      const refund = await refundsService.createRefund(refundData);
      setLoading(false);
      return refund;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to process refund');
      setLoading(false);
      return null;
    }
  }, []);

  const getRefundsBySale = useCallback(async (saleId: number): Promise<Refund[]> => {
    setLoading(true);
    setError(null);
    try {
      const refunds = await refundsService.getRefundsBySale(saleId);
      setLoading(false);
      return refunds;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch refunds');
      setLoading(false);
      return [];
    }
  }, []);

  return {
    loading,
    error,
    createRefund,
    getRefundsBySale,
  };
};
