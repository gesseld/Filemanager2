import React from 'react';
import './SimilarDocuments.css';
import { SimilarDocument } from '../types/file';

interface SimilarDocumentsProps {
  documents: SimilarDocument[];
  onDocumentSelect?: (docId: string) => void;
}

const SimilarDocuments: React.FC<SimilarDocumentsProps> = ({ 
  documents,
  onDocumentSelect
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="similar-documents">
      <h3>Similar Documents</h3>
      {documents.length === 0 ? (
        <p className="no-results">No similar documents found</p>
      ) : (
        <div className="similar-docs-grid">
          {documents.map(doc => (
            <div key={doc.file_id} className="similar-doc-card">
              <div className="similarity-score">
                {Math.round(doc.similarity_score * 100)}% match
              </div>
              <a 
                href={`/files/${doc.file_id}`} 
                className="similar-doc-link"
                onClick={(e) => {
                  if (onDocumentSelect) {
                    e.preventDefault();
                    onDocumentSelect(doc.file_id);
                  }
                }}
              >
                {doc.file_name}
              </a>
              <div className="doc-meta">
                <span>{doc.file_type}</span>
                {doc.size && <span>{formatFileSize(doc.size)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimilarDocuments;