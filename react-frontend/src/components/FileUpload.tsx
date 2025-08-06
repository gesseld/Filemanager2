import React, { useCallback, useState } from 'react';

interface FileUploadProps {
  onFilesUploaded: (files: File[]) => void;
  maxFiles: number;
  accept: string[];
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesUploaded, maxFiles, accept }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>(
    'idle',
  );
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        setUploadedFiles(files);
        setUploadStatus('uploading');
        setUploadProgress(0);

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        try {
          await onFilesUploaded(files.slice(0, maxFiles));
          setUploadProgress(100);
          setUploadStatus('success');
          
          // Reset after success
          setTimeout(() => {
            setUploadStatus('idle');
            setUploadProgress(0);
            setUploadedFiles([]);
          }, 3000);
        } catch (error) {
          setUploadStatus('error');
          clearInterval(progressInterval);
        }
      }
    },
    [onFilesUploaded, maxFiles],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set dragging to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    
    if (files.length > 0) {
      setUploadedFiles(files);
      setUploadStatus('uploading');
      setUploadProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      try {
        await onFilesUploaded(files.slice(0, maxFiles));
        setUploadProgress(100);
        setUploadStatus('success');
        
        // Reset after success
        setTimeout(() => {
          setUploadStatus('idle');
          setUploadProgress(0);
          setUploadedFiles([]);
        }, 3000);
      } catch (error) {
        setUploadStatus('error');
        clearInterval(progressInterval);
      }
    }
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
    switch (extension) {
      // Documents
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📑';
      case 'txt':
      case 'md':
        return '📃';
      
      // Images
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
      case 'webp':
        return '🖼️';
      
      // Archives
      case 'zip':
      case 'rar':
      case 'tar':
      case 'gz':
      case '7z':
        return '🗜️';
      
      // Code
      case 'js':
      case 'ts':
      case 'py':
      case 'json':
      case 'xml':
      case 'html':
      case 'css':
        return '💻';
      
      default:
        return '📁';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Main Upload Zone */}
      <div
        className={`upload-zone transition-all duration-300 ${
          isDragging ? 'upload-zone-active scale-105' : ''
        } ${uploadStatus === 'uploading' ? 'pointer-events-none opacity-75' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-6">
          {/* Upload Icon */}
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            isDragging 
              ? 'bg-primary-200 text-primary-700 scale-110' 
              : 'bg-primary-100 text-primary-600'
          }`}>
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {/* Upload Text */}
          <div className="text-center space-y-2">
            <h3 className="heading-4">
              {isDragging ? 'Drop files here' : 'Upload Documents'}
            </h3>
            <p className="text-body">
              {isDragging 
                ? 'Release to upload your files' 
                : 'Drag & drop files here, or click to select'
              }
            </p>
            <p className="text-small text-muted">
              Supports: PDF, Word, Excel, PowerPoint, Images, Archives, Code • Max {maxFiles} files • Up to 50MB each
            </p>
          </div>

          {/* Upload Button */}
          <div>
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              multiple={maxFiles > 1}
              accept={accept.join(',')}
              disabled={uploadStatus === 'uploading'}
            />
            <label
              htmlFor="file-upload"
              className={`btn btn-primary btn-lg cursor-pointer ${
                uploadStatus === 'uploading' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {uploadStatus === 'uploading' ? 'Uploading...' : 'Select Files'}
            </label>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadStatus === 'uploading' && (
        <div className="card animate-fade-in">
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="heading-5">Uploading Files</h4>
                <span className="text-sm font-medium text-primary-600">
                  {uploadProgress}% complete
                </span>
              </div>
              
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.slice(0, 3).map((file, index) => (
                    <div key={index} className="flex items-center space-x-3 text-sm">
                      <span className="text-lg">{getFileIcon(file.name)}</span>
                      <span className="flex-1 truncate">{file.name}</span>
                      <span className="text-muted">{formatFileSize(file.size)}</span>
                      <div className="spinner spinner-sm"></div>
                    </div>
                  ))}
                  {uploadedFiles.length > 3 && (
                    <p className="text-small text-muted">
                      +{uploadedFiles.length - 3} more files...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {uploadStatus === 'success' && (
        <div className="alert alert-success animate-fade-in">
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="font-medium">Upload successful!</p>
            <p className="text-sm mt-1">
              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded and processing started.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {uploadStatus === 'error' && (
        <div className="alert alert-error animate-fade-in">
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="font-medium">Upload failed</p>
            <p className="text-sm mt-1">
              There was an error uploading your files. Please try again.
            </p>
          </div>
          <button
            onClick={() => {
              setUploadStatus('idle');
              setUploadProgress(0);
              setUploadedFiles([]);
            }}
            className="btn btn-error btn-sm"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
