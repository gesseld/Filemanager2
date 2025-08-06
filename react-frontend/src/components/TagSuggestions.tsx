import React, { useState, useEffect } from 'react';
import { AITag } from '../types/content-extraction';
import { generateTags, createTag } from '../services/api';

interface TagSuggestionsProps {
  fileId: number;
  onTagAdded: (tag: AITag) => void;
}

const TagSuggestions: React.FC<TagSuggestionsProps> = ({ fileId, onTagAdded }) => {
  const [suggestions, setSuggestions] = useState<AITag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('llama-3.1-storm-8b');

  const loadSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tags = await generateTags(fileId, selectedModel);
      setSuggestions(tags);
    } catch (err) {
      setError('Failed to load tag suggestions');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptTag = async (tag: AITag) => {
    try {
      const createdTag = await createTag({
        tag: tag.tag,
        source: 'user-accepted'
      });
      onTagAdded(createdTag);
      setSuggestions(suggestions.filter(t => t.tag !== tag.tag));
    } catch (err) {
      setError('Failed to save tag');
      console.error(err);
    }
  };

  const handleRejectTag = (tag: AITag) => {
    setSuggestions(suggestions.filter(t => t.tag !== tag.tag));
  };

  useEffect(() => {
    loadSuggestions();
  }, [fileId, selectedModel]);

  if (isLoading) return <div>Loading tag suggestions...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="tag-suggestions">
      <div className="model-selector">
        <label>AI Model:</label>
        <select 
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
        >
          <option value="llama-3.1-storm-8b">Llama 3.1 Storm 8B</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
        </select>
        <button onClick={loadSuggestions}>Refresh</button>
      </div>

      <div className="suggestions-list">
        {suggestions.length > 0 ? (
          <ul>
            {suggestions.map((tag) => (
              <li key={tag.tag}>
                <span>{tag.tag}</span>
                <div className="actions">
                  <button 
                    className="accept"
                    onClick={() => handleAcceptTag(tag)}
                  >
                    Accept
                  </button>
                  <button 
                    className="reject"
                    onClick={() => handleRejectTag(tag)}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No tag suggestions available</p>
        )}
      </div>
    </div>
  );
};

export default TagSuggestions;