import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  AxiosHeaders,
} from 'axios';
import { FileItem } from '../types/file';
import {
  SearchResponse,
  SearchRequest,
  ExtractedContent,
  ExtractionTask,
  ContentExtractionRequest,
  ProcessingStatus,
} from '../types/content-extraction';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'http://backend:8000');

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = new AxiosHeaders(config.headers);
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
    } else {
      console.error('Network Error:', error.message);
    }
    return Promise.reject(error);
  },
);

export const uploadFile = async (file: File): Promise<FileItem> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const listFiles = async (): Promise<FileItem[]> => {
  const response = await api.get('/files');
  return response.data;
};

export const searchFiles = async (query: string): Promise<FileItem[]> => {
  const response = await api.get('/files/search', {
    params: { q: query },
  });
  return response.data;
};

export const getFile = async (fileId: string): Promise<FileItem> => {
  const response = await api.get(`/files/${fileId}`);
  return response.data;
};

export const removeFile = async (fileId: string): Promise<void> => {
  await api.delete(`/files/${fileId}`);
};

// Content Extraction APIs
export const searchContent = async (request: SearchRequest): Promise<SearchResponse> => {
  const response = await api.post('/content/search', request);
  return response.data;
};

export const getExtractedContent = async (fileId: number): Promise<ExtractedContent> => {
  const response = await api.get(`/content/extracted/${fileId}`);
  return response.data;
};

export const triggerContentExtraction = async (
  request: ContentExtractionRequest,
): Promise<ExtractionTask> => {
  const response = await api.post('/content/extract', request);
  return response.data;
};

export const getExtractionTask = async (taskId: string): Promise<ExtractionTask> => {
  const response = await api.get(`/content/tasks/${taskId}`);
  return response.data;
};

export const retryExtraction = async (fileId: number): Promise<ExtractionTask> => {
  const response = await api.post(`/content/retry/${fileId}`);
  return response.data;
};

export const getProcessingStatus = async (): Promise<ProcessingStatus[]> => {
  const response = await api.get('/content/processing-status');
  return response.data;
};

export const getFileContent = async (fileId: number): Promise<string> => {
  const response = await api.get(`/content/file/${fileId}/content`);
  return response.data;
};
