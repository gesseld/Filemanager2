import React, { useState, useEffect } from 'react';
import { SearchResult, AITag, SearchRequest } from '../types/content-extraction';
import { searchContent, getTags } from '../services/api';

const AdvancedSearchInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<AITag[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await getTags();
        setAvailableTags(tags);
      } catch (error) {
        console.error('Failed to load tags:', error);
      }
    };
    loadTags();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const request: SearchRequest = {
        query,
        search_content: true
      };
      if (selectedTags.length > 0) {
        request.tags = selectedTags;
      }
      const results = await searchContent(request);
      setSearchResults(results.results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <div className="advanced-search">
      <div className="search-controls">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents..."
        />
        <button 
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="tag-filters">
        <h3>Filter by Tags</h3>
        <div className="tags-container">
          {availableTags.map(tag => (
            <button
              key={tag.id}
              className={`tag ${selectedTags.includes(tag.id.toString()) ? 'selected' : ''}`}
              onClick={() => toggleTag(tag.id.toString())}
            >
              {tag.tag}
            </button>
          ))}
        </div>
      </div>

      <div className="search-results">
        {searchResults.length > 0 ? (
          <ul>
            {searchResults.map(result => (
              <li key={result.file_id}>
                <h4>{result.file_name}</h4>
                {result.highlights && (
                  <div className="highlight">
                    {result.highlights.map((hl, i) => (
                      <p key={i}>{hl.text}</p>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No results found</p>
        )}
      </div>
    </div>
  );
};

export default AdvancedSearchInterface;