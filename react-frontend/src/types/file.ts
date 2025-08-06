export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  url?: string;
  metadata?: Record<string, unknown>;
  has_embeddings?: boolean;
}

export interface SimilarDocument {
  file_id: string;
  file_name: string;
  file_type: string;
  size?: number;
  similarity_score: number;
  distance: number;
}
