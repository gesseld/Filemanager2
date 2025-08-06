export interface ExtractedContent {
  id: number;
  file_id: number;
  content: string | null;
  metadata: Record<string, unknown> | null;
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  file_id: number;
  file_name: string;
  content: string | null;
  score: number;
}

export interface SearchRequest {
  query: string;
  limit?: number;
  offset?: number;
  search_content?: boolean;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  limit: number;
  offset: number;
}

export interface ExtractionTask {
  id: number;
  file_id: number;
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ContentExtractionRequest {
  file_id: number;
  force_reextract?: boolean;
}

export interface ProcessingStatus {
  file_id: number;
  file_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  retry_count?: number;
}

export interface ContentPreviewData {
  file_name: string;
  content: string;
  metadata: Record<string, unknown>;
  extraction_status: string;
}
