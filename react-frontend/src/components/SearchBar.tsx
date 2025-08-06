import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string, searchContent: boolean) => void;
  placeholder?: string;
  showContentToggle?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search files...',
  showContentToggle = true,
}) => {
  const [query, setQuery] = useState('');
  const [searchContent, setSearchContent] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, searchContent);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('', searchContent);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-4">
        {/* Main Search Input */}
        <div className={`relative transition-all duration-200 ${
          isFocused ? 'transform scale-[1.02]' : ''
        }`}>
          <div className={`flex items-center border-2 rounded-xl bg-white transition-all duration-200 ${
            isFocused 
              ? 'border-primary-500 shadow-lg shadow-primary-100' 
              : 'border-neutral-300 hover:border-neutral-400'
          }`}>
            {/* Search Icon */}
            <div className="pl-4 pr-3">
              <svg 
                className={`w-5 h-5 transition-colors duration-200 ${
                  isFocused ? 'text-primary-600' : 'text-neutral-400'
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Input Field */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className="flex-1 py-4 px-2 text-lg bg-transparent border-none outline-none placeholder-neutral-400"
            />

            {/* Clear Button */}
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 mr-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Search Button */}
            <button
              type="submit"
              className="btn btn-primary mr-2 px-6"
              disabled={!query.trim()}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
          </div>
        </div>

        {/* Search Options */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Content Toggle */}
          {showContentToggle && (
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={searchContent}
                    onChange={(e) => setSearchContent(e.target.checked)}
                    className="form-checkbox"
                  />
                </div>
                <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900 transition-colors">
                  Search file content
                </span>
              </label>
              
              <div className="group relative">
                <svg className="w-4 h-4 text-neutral-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  Enable to search within document content using AI
                </div>
              </div>
            </div>
          )}

          {/* Search Suggestions */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-neutral-500">Quick search:</span>
            <div className="flex space-x-1">
              {['contracts', 'reports', 'invoices'].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setQuery(suggestion);
                    onSearch(suggestion, searchContent);
                  }}
                  className="px-2 py-1 text-xs bg-neutral-100 text-neutral-600 rounded-md hover:bg-neutral-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Tips */}
        {isFocused && !query && (
          <div className="animate-fade-in bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <h4 className="text-sm font-medium text-neutral-900 mb-2">Search Tips:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-600">
              <div className="flex items-center space-x-2">
                <span className="font-mono bg-white px-1 rounded">contract</span>
                <span>Find files containing "contract"</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono bg-white px-1 rounded">"exact phrase"</span>
                <span>Search for exact phrases</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono bg-white px-1 rounded">file:pdf</span>
                <span>Filter by file type</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono bg-white px-1 rounded">budget AND 2024</span>
                <span>Use AND, OR, NOT operators</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default SearchBar;
