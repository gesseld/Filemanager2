import React from 'react';
import { SearchResult } from '../types/content-extraction';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  loading?: boolean;
  onPreviewClick?: (fileId: number, fileName: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  query,
  loading = false,
  onPreviewClick,
}) => {
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text;

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.toLowerCase() === searchTerm.toLowerCase()) {
        return (
          <mark key={index} className="bg-yellow-200 px-1 rounded">
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;

    const start = Math.max(0, content.toLowerCase().indexOf(query.toLowerCase()) - 50);
    const end = Math.min(content.length, start + maxLength);

    let truncated = content.substring(start, end);
    if (start > 0) truncated = '...' + truncated;
    if (end < content.length) truncated = truncated + '...';

    return truncated;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Searching...</span>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No results found for "{query}"</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
      </p>

      {results.map((result) => (
        <div
          key={result.file_id}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onPreviewClick?.(result.file_id, result.file_name)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-800">
                {result.file_name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Relevance score: {(result.score * 100).toFixed(1)}%
              </p>
            </div>
            {onPreviewClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreviewClick(result.file_id, result.file_name);
                }}
                className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
              >
                Preview
              </button>
            )}
          </div>

          {result.content && (
            <div className="mt-3">
              <p className="text-sm text-gray-700 line-clamp-3">
                {highlightText(truncateContent(result.content), query)}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SearchResults;
