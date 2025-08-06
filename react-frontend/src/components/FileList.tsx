import React, { useState, useEffect } from 'react';
import { FileItem } from '../types/file';
import { useFileContext } from '../contexts/FileContext';
import { ExtractedContent } from '../types/content-extraction';
import { getExtractedContent, triggerContentExtraction } from '../services/api';

interface FileListProps {
  files: FileItem[];
  showExtractionStatus?: boolean;
  onPreviewClick?: (fileId: number, fileName: string) => void;
}

const FileList: React.FC<FileListProps> = ({
  files,
  showExtractionStatus = true,
  onPreviewClick,
}) => {
  const { removeFile } = useFileContext();
  const [extractionStatus, setExtractionStatus] = useState<Record<string, ExtractedContent>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (showExtractionStatus) {
      files.forEach((file) => {
        loadExtractionStatus(file.id);
      });
    }
  }, [files, showExtractionStatus]);

  const loadExtractionStatus = async (fileId: string) => {
    try {
      setLoading((prev) => ({ ...prev, [fileId]: true }));
      const status = await getExtractedContent(parseInt(fileId));
      setExtractionStatus((prev) => ({ ...prev, [fileId]: status }));
    } catch (error) {
      console.error('Failed to load extraction status:', error);
    } finally {
      setLoading((prev) => ({ ...prev, [fileId]: false }));
    }
  };

  const handleRetryExtraction = async (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await triggerContentExtraction({
        file_id: parseInt(fileId),
        force_reextract: true,
      });
      loadExtractionStatus(fileId);
    } catch (error) {
      console.error('Failed to retry extraction:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        className: 'badge status-pending', 
        label: 'Pending',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      processing: { 
        className: 'badge status-processing', 
        label: 'Processing',
        icon: <div className="spinner spinner-sm mr-1"></div>
      },
      completed: { 
        className: 'badge status-completed', 
        label: 'Completed',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      },
      failed: { 
        className: 'badge status-failed', 
        label: 'Failed',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={config.className}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconClass = "w-8 h-8 p-1.5 rounded-lg";
    
    switch (extension) {
      case 'pdf':
        return (
          <div className={`${iconClass} bg-red-100 text-red-600`}>
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
        );
      case 'doc':
      case 'docx':
        return (
          <div className={`${iconClass} bg-blue-100 text-blue-600`}>
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
        );
      case 'txt':
        return (
          <div className={`${iconClass} bg-neutral-100 text-neutral-600`}>
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className={`${iconClass} bg-neutral-100 text-neutral-600`}>
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-muted">No files to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {files.map((file) => {
        const status = extractionStatus[file.id];
        const isLoading = loading[file.id];

        return (
          <div
            key={file.id}
            className="card card-hover cursor-pointer transition-all duration-200"
            onClick={() => onPreviewClick?.(parseInt(file.id), file.name)}
          >
            <div className="card-body">
              <div className="flex items-center space-x-4">
                {/* File Icon */}
                {getFileIcon(file.name)}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-1">
                    <h4 className="font-medium text-neutral-900 truncate">
                      {file.name}
                    </h4>
                    <span className="text-small text-muted">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-small text-muted">
                    <span>Uploaded {formatDate(file.uploadDate)}</span>
                    
                    {showExtractionStatus && (
                      <div className="flex items-center space-x-2">
                        {isLoading ? (
                          <div className="flex items-center space-x-1">
                            <div className="spinner spinner-sm"></div>
                            <span>Loading status...</span>
                          </div>
                        ) : status ? (
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(status.extraction_status)}
                            {status.extraction_status === 'failed' && (
                              <button
                                onClick={(e) => handleRetryExtraction(file.id, e)}
                                className="text-xs text-primary-600 hover:text-primary-700 underline"
                              >
                                Retry
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="badge badge-secondary">No status</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {onPreviewClick && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreviewClick(parseInt(file.id), file.name);
                      }}
                      className="btn btn-ghost btn-sm"
                      title="Preview file"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this file?')) {
                        removeFile(file.id);
                      }
                    }}
                    className="btn btn-ghost btn-sm text-error-600 hover:text-error-700 hover:bg-error-50"
                    title="Delete file"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FileList;
