import React, { useState } from 'react';
import { FileItem } from '../types/file';
import { AITag, AISummary } from '../types/content-extraction';
import { generateTags, generateSummary } from '../services/api';

interface AIFeaturesPanelProps {
  file: FileItem;
  tags: AITag[];
  summaries: AISummary[];
  onTagsGenerated: (tags: AITag[]) => void;
  onSummaryGenerated: (summary: AISummary) => void;
}

const AIFeaturesPanel: React.FC<AIFeaturesPanelProps> = ({
  file,
  tags,
  summaries,
  onTagsGenerated,
  onSummaryGenerated
}) => {
  const [tagLoading, setTagLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'llama-3.1-storm-8b' | 'gpt-4' | 'claude-3' | 'deepseek'>('llama-3.1-storm-8b');
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');

  const handleGenerateTags = async () => {
    setTagLoading(true);
    try {
      const newTags = await generateTags(Number(file.id), selectedModel);
      onTagsGenerated(newTags);
    } catch (error) {
      console.error('Error generating tags:', error);
    } finally {
      setTagLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    try {
      const summary = await generateSummary(Number(file.id), selectedModel, summaryLength);
      onSummaryGenerated(summary);
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <div className="ai-features-panel">
      <div className="section">
        <h3>AI Tags</h3>
        <div className="tag-container">
          {tags.map(tag => (
            <span key={tag.id} className="tag">
              {tag.tag} ({Math.round(tag.confidence * 100)}%)
            </span>
          ))}
        </div>
        <button 
          onClick={handleGenerateTags}
          disabled={tagLoading}
          className="btn btn-generate"
        >
          {tagLoading ? 'Generating...' : 'Generate Tags'}
        </button>
      </div>

      <div className="section">
        <h3>AI Summary</h3>
        <div className="model-controls">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as any)}
            className="model-select"
          >
            <option value="llama-3.1-storm-8b">Llama 3.1 Storm 8B</option>
            <option value="gpt-4">GPT-4</option>
            <option value="claude-3">Claude 3</option>
            <option value="deepseek">DeepSeek</option>
          </select>
          <select
            value={summaryLength}
            onChange={(e) => setSummaryLength(e.target.value as any)}
            className="length-select"
          >
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
          </select>
        </div>
        <div className="summary-content">
          {summaries.length > 0 ? (
            summaries.map(summary => (
              <div key={summary.id} className="summary">
                <p>{summary.summary}</p>
                <small>Generated with {summary.model} ({summary.length})</small>
              </div>
            ))
          ) : (
            <p>No summary generated yet</p>
          )}
        </div>
        <button
          onClick={handleGenerateSummary}
          disabled={summaryLoading}
          className="btn btn-generate"
        >
          {summaryLoading ? 'Generating...' : 'Generate Summary'}
        </button>
      </div>
    </div>
  );
};

export default AIFeaturesPanel;