import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SimilarDocument } from '../types/file';
import { getSimilarityMatrix, calculateSimilarityMatrix } from '../services/api';
import SimilarDocuments from '../components/SimilarDocuments';
import './SimilarityDashboard.css';

const SimilarityDashboard: React.FC = () => {
  const [matrix, setMatrix] = useState<Record<string, SimilarDocument[]>>({});
  const [threshold, setThreshold] = useState<number>(0.5);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadSimilarityMatrix();
  }, [threshold]);

  const loadSimilarityMatrix = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSimilarityMatrix(threshold);
      setMatrix(data);
    } catch (err) {
      setError('Failed to load similarity matrix');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const recalculateMatrix = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await calculateSimilarityMatrix([], threshold);
      setMatrix(data);
    } catch (err) {
      setError('Failed to recalculate similarity matrix');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentSelect = (docId: string) => {
    navigate(`/files/${docId}`);
  };

  return (
    <div className="similarity-dashboard">
      <div className="dashboard-header">
        <h1>Document Similarity Dashboard</h1>
        <div className="controls">
          <div className="threshold-control">
            <label htmlFor="threshold">Similarity Threshold:</label>
            <input
              type="range"
              id="threshold"
              min="0.1"
              max="1.0"
              step="0.1"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
            />
            <span>{threshold.toFixed(1)}</span>
          </div>
          <button 
            onClick={recalculateMatrix}
            disabled={isLoading}
            className="btn btn-recalculate"
          >
            {isLoading ? 'Processing...' : 'Recalculate Matrix'}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="matrix-view">
        {Object.entries(matrix).map(([fileId, similarDocs]) => (
          <div key={fileId} className="matrix-item">
            <h3>
              <a href={`/files/${fileId}`}>{matrix[fileId]?.[0]?.file_name || fileId}</a>
            </h3>
            <SimilarDocuments 
              documents={similarDocs} 
              onDocumentSelect={handleDocumentSelect}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarityDashboard;