import { useState, useCallback } from 'react';
import { SearchResponse, SearchRequest } from '../types/content-extraction';
import { SimilarDocument } from '../types/file';
import {
  searchContent,
  semanticSearch,
  findSimilarFiles
} from '../services/api';

const useSemanticSearch = () => {
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [similarFiles, setSimilarFiles] = useState<SimilarDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeSearch = useCallback(async (request: SearchRequest & { semantic?: boolean }): Promise<SearchResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = request.semantic
        ? await semanticSearch(request.query, request.limit)
        : await searchContent(request);
      setResults(response);
      return response;
    } catch (err) {
      setError('Failed to execute search');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const findSimilar = useCallback(async (fileId: number, threshold: number = 0.6, limit: number = 10): Promise<SimilarDocument[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await findSimilarFiles(fileId, threshold, limit);
      setSimilarFiles(response);
      return response;
    } catch (err) {
      setError('Failed to find similar files');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
    setSimilarFiles([]);
    setError(null);
  }, []);

  return {
    results,
    similarFiles,
    isLoading,
    error,
    executeSearch,
    findSimilar,
    clearResults
  };
};

export default useSemanticSearch;