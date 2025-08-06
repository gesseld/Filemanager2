import React, { useState } from 'react';
import SimilarDocuments from './SimilarDocuments';
import { FileItem, SimilarDocument } from '../types/file';
import { ExtractedContent, AISummary, AITag } from '../types/content-extraction';
import { triggerContentExtraction, generateSummary, generateTags } from '../services/api';

interface FileDetailsProps {
  file: FileItem;
  extractedContent?: ExtractedContent;
  onReextract: (fileId: string) => void;
  similarDocuments?: SimilarDocument[];
}

const FileDetails: React.FC<FileDetailsProps> = ({ file, extractedContent, onReextract, similarDocuments = [] }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        className: 'badge status-pending', 
        label: 'Pending',
        icon: '⏳'
      },
      processing: { 
        className: 'badge status-processing', 
        label: 'Processing',
        icon: '🔄'
      },
      completed: { 
        className: 'badge status-completed', 
        label: 'Completed',
        icon: '✅'
      },
      failed: { 
        className: 'badge status-failed', 
        label: 'Failed',
        icon: '❌'
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return `${config.icon} ${config.label}`;
  };

  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [fileTags, setFileTags] = useState<AITag[]>([]);

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const summary = await generateSummary(Number(file.id), 'llama-3.1-storm-8b', 'medium');
      setAiSummary(summary);
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleGenerateTags = async () => {
    setIsGeneratingTags(true);
    try {
      const tags = await generateTags(Number(file.id), 'hybrid');
      setFileTags(tags);
    } catch (error) {
      console.error('Failed to generate tags:', error);
    } finally {
      setIsGeneratingTags(false);
    }
  };

  return (
    <div className="file-details">
      <div className="file-header">
        <h2>{file.name}</h2>
        <div className="file-meta">
          <span>Uploaded: {formatDate(file.uploadDate)}</span>
          <span>Size: {formatFileSize(file.size)}</span>
          <span>Type: {file.name.split('.').pop()?.toUpperCase()}</span>
        </div>
      </div>

      <div className="processing-status">
        <h3>Processing Status</h3>
        <div className="status-badge">
          {getStatusBadge(extractedContent?.extraction_status || 'pending')}
        </div>
        {extractedContent?.extraction_status === 'failed' && (
          <button
            onClick={() => onReextract(file.id)}
            className="btn btn-retry"
          >
            Retry Extraction
          </button>
        )}
      </div>

      <div className="ai-actions">
        <button
          onClick={handleGenerateSummary}
          disabled={isGeneratingSummary}
          className="btn btn-ai"
        >
          {isGeneratingSummary ? 'Generating...' : 'Generate Summary'}
        </button>
        <button
          onClick={handleGenerateTags}
          disabled={isGeneratingTags}
          className="btn btn-ai"
        >
          {isGeneratingTags ? 'Generating...' : 'Auto-Tag'}
        </button>
      </div>

      {aiSummary && (
        <div className="ai-summary">
          <h3>AI Summary</h3>
          <div className="summary-content">
            {aiSummary.summary}
          </div>
        </div>
      )}

      {fileTags.length > 0 && (
        <div className="file-tags">
          <h3>Tags</h3>
          <div className="tags-container">
            {fileTags.map(tag => (
              <span key={tag.id} className="tag">
                {tag.tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {extractedContent && (
        <div className="extracted-content">
          <h3>Extracted Content</h3>
          <div className="content-preview">
            {extractedContent.content?.slice(0, 500)}...
            {extractedContent.content && extractedContent.content.length > 500 && (
              <button className="btn btn-show-more">Show More</button>
            )}
          </div>
        </div>
      )}

      <SimilarDocuments documents={similarDocuments || []} />

      <div className="file-actions">
        <button className="btn btn-download">Download</button>
        <button className="btn btn-delete">Delete</button>
      </div>
    </div>
  );
};

export default FileDetails;