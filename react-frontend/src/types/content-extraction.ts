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

export interface AITag {
  id: number;
  file_id: number;
  tag: string;
  confidence: number;
  source: 'spacy' | 'gliclass' | 'api';
  created_at: string;
}

export interface AISummary {
  id: number;
  file_id: number;
  summary: string;
  model: 'llama-3.1-storm-8b' | 'gpt-4' | 'claude-3' | 'deepseek';
  length: 'short' | 'medium' | 'long';
  created_at: string;
}

export interface SearchResult {
  file_id: number;
  file_name: string;
  content: string | null;
  score: number;
  highlights?: Array<{
    text: string;
    positions: Array<{ start: number; end: number }>;
  }>;
}

export interface SearchRequest {
  query: string;
  limit?: number;
  offset?: number;
  search_content?: boolean;
  tags?: string[];
}

export interface SemanticSearchResult {
  file_id: number;
  file_name: string;
  file_type: string;
  similarity_score: number;
  distance: number;
}

export interface SimilarFilesResponse {
  file_id: number;
  similar_files: SemanticSearchResult[];
  count: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  limit: number;
  offset: number;
  semantic?: boolean;
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

export interface AITagRequest {
  file_id: number;
  strategy: 'spacy' | 'gliclass' | 'api' | 'hybrid';
}

export interface AISummaryRequest {
  file_id: number;
  model: 'llama-3.1-storm-8b' | 'gpt-4' | 'claude-3' | 'deepseek';
  length: 'short' | 'medium' | 'long';
}
