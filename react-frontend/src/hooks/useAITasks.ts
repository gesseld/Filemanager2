import { useState, useEffect, useCallback } from 'react';
import { 
  ProcessingStatus,
  AITag,
  AISummary
} from '../types/content-extraction';
import { 
  generateTags,
  generateSummary,
  getProcessingStatus
} from '../services/api';

const useAITasks = () => {
  const [processingTasks, setProcessingTasks] = useState<ProcessingStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProcessingStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const status = await getProcessingStatus();
      setProcessingTasks(status);
    } catch (err) {
      setError('Failed to fetch processing status');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startTagging = useCallback(async (fileId: number, model: string): Promise<AITag[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const tags = await generateTags(fileId, model);
      await fetchProcessingStatus(); // Refresh status
      return tags;
    } catch (err) {
      setError('Failed to start tagging');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProcessingStatus]);

  const startSummarization = useCallback(async (
    fileId: number, 
    model: string,
    length: string
  ): Promise<AISummary> => {
    setIsLoading(true);
    setError(null);
    try {
      const summary = await generateSummary(fileId, model, length);
      await fetchProcessingStatus(); // Refresh status
      return summary;
    } catch (err) {
      setError('Failed to start summarization');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProcessingStatus]);

  useEffect(() => {
    fetchProcessingStatus();
    const interval = setInterval(fetchProcessingStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchProcessingStatus]);

  return {
    processingTasks,
    isLoading,
    error,
    startTagging,
    startSummarization,
    refreshStatus: fetchProcessingStatus
  };
};

export default useAITasks;