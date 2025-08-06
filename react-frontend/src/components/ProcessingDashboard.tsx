import React, { useState, useEffect } from 'react';
import { ProcessingStatus } from '../types/content-extraction';
import { getProcessingStatus, retryExtraction } from '../services/api';

const ProcessingDashboard: React.FC = () => {
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadProcessingStatus();

    if (autoRefresh) {
      const interval = setInterval(() => {
        loadProcessingStatus();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadProcessingStatus = async () => {
    try {
      const status = await getProcessingStatus();
      setProcessingStatus(status);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load processing status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (fileId: number) => {
    try {
      await retryExtraction(fileId);
      loadProcessingStatus();
    } catch (error) {
      console.error('Failed to retry extraction:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <div className="spinner spinner-sm"></div>;
      case 'completed':
        return (
          <div className="w-5 h-5 bg-success-100 text-success-600 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="w-5 h-5 bg-error-100 text-error-600 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-5 h-5 bg-neutral-100 text-neutral-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'text-primary-600';
      case 'completed':
        return 'text-success-600';
      case 'failed':
        return 'text-error-600';
      default:
        return 'text-neutral-600';
    }
  };

  const getProgressBar = (status: string, progress?: number) => {
    if (status === 'processing' && progress !== undefined) {
      return (
        <div className="progress-bar mt-2">
          <div 
            className="progress-fill"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      );
    }
    return null;
  };

  const stats = {
    total: processingStatus.length,
    processing: processingStatus.filter((s) => s.status === 'processing').length,
    completed: processingStatus.filter((s) => s.status === 'completed').length,
    failed: processingStatus.filter((s) => s.status === 'failed').length,
    pending: processingStatus.filter((s) => s.status === 'pending').length,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="spinner spinner-lg mx-auto mb-4"></div>
          <p className="text-muted">Loading processing status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card text-center">
          <div className="card-body py-4">
            <div className="text-2xl font-bold text-neutral-900 mb-1">{stats.total}</div>
            <div className="text-small text-muted">Total Files</div>
          </div>
        </div>
        
        <div className="card text-center">
          <div className="card-body py-4">
            <div className="text-2xl font-bold text-primary-600 mb-1">{stats.processing}</div>
            <div className="text-small text-muted">Processing</div>
          </div>
        </div>
        
        <div className="card text-center">
          <div className="card-body py-4">
            <div className="text-2xl font-bold text-success-600 mb-1">{stats.completed}</div>
            <div className="text-small text-muted">Completed</div>
          </div>
        </div>
        
        <div className="card text-center">
          <div className="card-body py-4">
            <div className="text-2xl font-bold text-error-600 mb-1">{stats.failed}</div>
            <div className="text-small text-muted">Failed</div>
          </div>
        </div>
        
        <div className="card text-center">
          <div className="card-body py-4">
            <div className="text-2xl font-bold text-warning-600 mb-1">{stats.pending}</div>
            <div className="text-small text-muted">Pending</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="form-checkbox"
                />
                <span className="text-sm font-medium text-neutral-700">
                  Auto-refresh every 5 seconds
                </span>
              </label>
              
              <div className="text-small text-muted">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
            
            <button
              onClick={loadProcessingStatus}
              className="btn btn-secondary btn-sm"
              disabled={loading}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Now
            </button>
          </div>
        </div>
      </div>

      {/* Processing List */}
      <div className="card">
        <div className="card-header">
          <h3 className="heading-5">Processing Queue</h3>
        </div>

        {processingStatus.length === 0 ? (
          <div className="card-body">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success-100 text-success-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="heading-5 mb-2">All caught up!</h4>
              <p className="text-muted">No files are currently being processed</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {processingStatus.map((item) => (
              <div key={item.file_id} className="p-4 hover:bg-neutral-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(item.status)}
                      <span className="font-medium text-neutral-900 truncate">
                        {item.file_name}
                      </span>
                      <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </div>

                    {getProgressBar(item.status, item.progress)}

                    {item.error && (
                      <div className="mt-2 p-2 bg-error-50 border border-error-200 rounded-lg">
                        <div className="text-sm text-error-700">
                          <strong>Error:</strong> {item.error}
                        </div>
                      </div>
                    )}

                    {item.retry_count !== undefined && item.retry_count > 0 && (
                      <div className="mt-1 text-small text-muted">
                        Retry attempt: {item.retry_count}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {item.status === 'failed' && (
                      <button
                        onClick={() => handleRetry(item.file_id)}
                        className="btn btn-warning btn-sm"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retry
                      </button>
                    )}
                    
                    {item.status === 'processing' && (
                      <div className="text-small text-muted">
                        {item.progress !== undefined && `${item.progress}%`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingDashboard;
