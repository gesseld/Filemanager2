import axios from 'axios';
import {
  AITag,
  AISummary,
  SearchResult,
  ProcessingStatus
} from '../types/content-extraction';

interface QueueStatus {
  active: Record<string, any[]>;
  reserved: Record<string, any[]>;
  scheduled: Record<string, any[]>;
  stats: Record<string, any>;
  registered_tasks: Record<string, string[]>;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface SimilarDocument {
  file_id: string;
  file_name: string;
  similarity_score: number;
  metadata?: Record<string, unknown>;
}

// Create a more flexible type for tag creation that matches the backend expectations
interface TagCreationData {
  tag: string;
  file_id?: string;
  source?: string;
  confidence?: number;
}

// Similarity API functions
export const getSimilarityMatrix = async (threshold: number = 0.5): Promise<Record<string, SimilarDocument[]>> => {
  const response = await axios.get(`${API_BASE_URL}/api/similarity/matrix`, {
    params: { threshold }
  });
  return response.data;
};

export const calculateSimilarityMatrix = async (
  fileIds: string[] = [],
  threshold: number = 0.5
): Promise<Record<string, SimilarDocument[]>> => {
  const response = await axios.post(`${API_BASE_URL}/api/similarity/calculate`, {
    file_ids: fileIds,
    threshold
  });
  return response.data;
};

export const getDocumentSimilarities = async (fileId: string): Promise<SimilarDocument[]> => {
  const response = await axios.get(`${API_BASE_URL}/api/similarity/${fileId}`);
  return response.data;
};

export const calculateDocumentSimilarities = async (fileId: string): Promise<SimilarDocument[]> => {
  const response = await axios.post(`${API_BASE_URL}/api/similarity/${fileId}/calculate`);
  return response.data;
};

// Search API functions
export const searchContent = async (query: string): Promise<{results: SearchResult[]}> => {
  const response = await axios.get(`${API_BASE_URL}/api/search`, {
    params: { q: query }
  });
  return response.data;
};

// Tag API functions
export const getTags = async (): Promise<AITag[]> => {
  const response = await axios.get(`${API_BASE_URL}/api/tags`);
  return response.data;
};

export const createTag = async (tagData: TagCreationData): Promise<AITag> => {
  const response = await axios.post(`${API_BASE_URL}/api/tags`, {
    ...tagData,
    source: tagData.source || 'manual',
    confidence: tagData.confidence || 1.0
  });
  return response.data;
};

export const updateTag = async (id: string, tag: Partial<AITag>): Promise<AITag> => {
  const response = await axios.put(`${API_BASE_URL}/api/tags/${id}`, tag);
  return response.data;
};

export const deleteTag = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/tags/${id}`);
};

// AI Processing API functions
export const generateTags = async (fileId: string, model?: string): Promise<AITag[]> => {
  const response = await axios.post(`${API_BASE_URL}/api/ai/tags/${fileId}`, { model });
  return response.data;
};

export const generateSummary = async (fileId: string, model?: string, length?: string): Promise<AISummary> => {
  const response = await axios.post(`${API_BASE_URL}/api/ai/summary/${fileId}`, { model, length });
  return response.data;
};

export const getProcessingStatus = async (taskId: string = ''): Promise<ProcessingStatus> => {
  const response = await axios.get(`${API_BASE_URL}/api/ai/status/${taskId}`);
  return response.data;
};

export const getProcessingTasks = async (): Promise<ProcessingStatus[]> => {
  const response = await axios.get(`${API_BASE_URL}/api/ai/tasks`);
  return response.data;
};

export const getQueueStatus = async (): Promise<QueueStatus> => {
  const response = await axios.get(`${API_BASE_URL}/api/ai/dashboard/queue-status`);
  return response.data;
};

export const getModelPerformance = async (): Promise<{
  summary_models: Record<string, { avg_time: number; success_rate: number }>;
  tagging_models: Record<string, { avg_time: number; success_rate: number }>;
}> => {
  const response = await axios.get(`${API_BASE_URL}/api/ai/dashboard/model-performance`);
  return response.data;
};
