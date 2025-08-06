import { useState, useEffect, useRef } from 'react';
import { ProcessingStatus } from '../types/content-extraction';
import { getProcessingStatus } from '../services/api';

interface UseProcessingStatusOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useProcessingStatus = ({
  autoRefresh = true,
  refreshInterval = 5000,
}: UseProcessingStatusOptions = {}) => {
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = async () => {
    try {
      const status = await getProcessingStatus();
      setProcessingStatus(status);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch processing status');
    } finally {
      setLoading(false);
    }
  };

  const startAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      fetchStatus();
    }, refreshInterval);
  };

  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const refresh = () => {
    fetchStatus();
  };

  useEffect(() => {
    fetchStatus();

    if (autoRefresh) {
      startAutoRefresh();
    }

    return () => {
      stopAutoRefresh();
    };
  }, [autoRefresh, refreshInterval]);

  // Check if there are any active processing tasks
  const hasActiveProcessing = processingStatus.some(
    (item) => item.status === 'processing' || item.status === 'pending',
  );

  // Get processing statistics
  const stats = {
    total: processingStatus.length,
    processing: processingStatus.filter((s) => s.status === 'processing').length,
    completed: processingStatus.filter((s) => s.status === 'completed').length,
    failed: processingStatus.filter((s) => s.status === 'failed').length,
    pending: processingStatus.filter((s) => s.status === 'pending').length,
  };

  return {
    processingStatus,
    loading,
    error,
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
    hasActiveProcessing,
    stats,
  };
};
