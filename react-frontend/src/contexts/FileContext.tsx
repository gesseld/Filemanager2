import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { FileItem } from '../types/file';
import {
  uploadFile as apiUploadFile,
  listFiles as apiListFiles,
  searchFiles as apiSearchFiles,
  getFile as apiGetFile,
  removeFile as apiRemoveFile,
} from '../services/api';

interface FileContextType {
  files: FileItem[];
  currentFile: FileItem | null;
  isLoading: boolean;
  error: string | null;
  isBackendAvailable: boolean;
  uploadFile: (file: File) => Promise<void>;
  fetchFiles: () => Promise<void>;
  searchFiles: (query: string) => Promise<void>;
  getFile: (fileId: string) => Promise<void>;
  removeFile: (fileId: string) => Promise<void>;
  clearError: () => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const FileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);

  const handleError = (err: unknown) => {
    let message = 'An unknown error occurred';
    
    if (err instanceof Error) {
      message = err.message;
      
      // Check if it's a network/CORS error
      if (message.includes('Network Error') || 
          message.includes('CORS') || 
          message.includes('Failed to fetch')) {
        setIsBackendAvailable(false);
        message = 'Unable to connect to the server. Please check your connection and try again.';
      }
    }
    
    setError(message);
    setIsLoading(false);
    console.error('FileContext error:', err);
  };

  const clearError = () => {
    setError(null);
  };

  const uploadFile = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      const uploadedFile = await apiUploadFile(file);
      setFiles((prev) => [...prev, uploadedFile]);
      setIsBackendAvailable(true);
    } catch (err) {
      handleError(err);
      throw err; // Re-throw to allow component-level handling
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fileList = await apiListFiles();
      setFiles(fileList);
      setIsBackendAvailable(true);
    } catch (err) {
      handleError(err);
      // Don't throw here to prevent app crashes
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchFiles = async (query: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const results = await apiSearchFiles(query);
      setFiles(results);
      setIsBackendAvailable(true);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getFile = async (fileId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const file = await apiGetFile(fileId);
      setCurrentFile(file);
      setIsBackendAvailable(true);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = async (fileId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await apiRemoveFile(fileId);
      setFiles((prev) => prev.filter((file) => file.id !== fileId));
      if (currentFile?.id === fileId) {
        setCurrentFile(null);
      }
      setIsBackendAvailable(true);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Only try to fetch files on mount if we haven't detected backend issues
  useEffect(() => {
    if (isBackendAvailable) {
      fetchFiles();
    }
  }, [fetchFiles, isBackendAvailable]);

  return (
    <FileContext.Provider
      value={{
        files,
        currentFile,
        isLoading,
        error,
        isBackendAvailable,
        uploadFile,
        fetchFiles,
        searchFiles,
        getFile,
        removeFile,
        clearError,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

export const useFileContext = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFileContext must be used within a FileProvider');
  }
  return context;
};
