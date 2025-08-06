import React, { useState, useEffect } from 'react';
import { AISummary } from '../types/content-extraction';
import { generateSummary } from '../services/api';

interface AISummaryDisplayProps {
  fileId: number;
}

const AISummaryDisplay: React.FC<AISummaryDisplayProps> = ({ fileId }) => {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('llama-3.1-storm-8b');
  const [selectedLength, setSelectedLength] = useState('medium');

  const loadSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const summaryData = await generateSummary(fileId, selectedModel, selectedLength);
      setSummary(summaryData);
    } catch (err) {
      setError('Failed to generate summary');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [fileId, selectedModel, selectedLength]);

  if (isLoading) return <div>Generating summary...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="ai-summary-display">
      <div className="controls">
        <div className="control-group">
          <label>Model:</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            <option value="llama-3.1-storm-8b">Llama 3.1 Storm 8B</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
          </select>
        </div>

        <div className="control-group">
          <label>Length:</label>
          <select
            value={selectedLength}
            onChange={(e) => setSelectedLength(e.target.value)}
          >
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
          </select>
        </div>

        <button onClick={loadSummary}>Regenerate</button>
      </div>

      {summary ? (
        <div className="summary-content">
          <h3>AI Summary</h3>
          <p>{summary.summary}</p>
          <div className="summary-meta">
            <span>Model: {summary.model}</span>
            <span>Generated: {new Date(summary.created_at).toLocaleString()}</span>
          </div>
        </div>
      ) : (
        <p>No summary available</p>
      )}
    </div>
  );
};

export default AISummaryDisplay;