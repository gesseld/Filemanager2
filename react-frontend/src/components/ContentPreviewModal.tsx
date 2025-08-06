import React, { useState, useEffect } from 'react';
import { ContentPreviewData } from '../types/content-extraction';
import { getFileContent, getExtractedContent } from '../services/api';

interface ContentPreviewModalProps {
  fileId: number;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ContentPreviewModal: React.FC<ContentPreviewModalProps> = ({
  fileId,
  fileName,
  isOpen,
  onClose,
}) => {
  const [content, setContent] = useState<string>('');
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
  const [extractionStatus, setExtractionStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && fileId) {
      loadContent();
    }
  }, [isOpen, fileId]);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const extractedContent = await getExtractedContent(fileId);
      setContent(extractedContent.content || '');
      setMetadata(extractedContent.metadata || {});
      setExtractionStatus(extractedContent.extraction_status);
    } catch (err) {
      console.error('Error loading content:', err);
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    try {
      setLoading(true);
      setError(null);

      // Trigger re-extraction
      const { triggerContentExtraction } = await import('../services/api');
      await triggerContentExtraction({ file_id: fileId, force_reextract: true });

      // Reload content after a delay
      setTimeout(() => loadContent(), 2000);
    } catch (err) {
      setError('Failed to retry extraction');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">{fileName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={loadContent}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : extractionStatus === 'failed' ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-500 mb-4">Content extraction failed</p>
                <button
                  onClick={handleRetry}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Retry Extraction
                </button>
              </div>
            </div>
          ) : extractionStatus === 'processing' ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Processing content...</p>
              </div>
            </div>
          ) : extractionStatus === 'pending' ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-600 mb-4">Content not extracted yet</p>
                <button
                  onClick={handleRetry}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Extract Content
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex">
              <div className="flex-1 overflow-auto p-4">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {content || 'No content available'}
                </pre>
              </div>

              {Object.keys(metadata).length > 0 && (
                <div className="w-64 border-l p-4 bg-gray-50 overflow-y-auto">
                  <h3 className="font-semibold mb-2">Metadata</h3>
                  <div className="space-y-2">
                    {Object.entries(metadata).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium">{key}:</span>
                        <span className="text-gray-600 ml-1">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentPreviewModal;
