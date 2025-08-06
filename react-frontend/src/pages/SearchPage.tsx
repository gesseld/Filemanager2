import React, { useState } from 'react';

const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    // Simulate search delay
    setTimeout(() => {
      setSearchResults([]);
      setIsSearching(false);
    }, 1000);
  };

  const quickSearchTerms = ['contracts', 'invoices', 'reports', 'presentations', 'meeting notes'];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        padding: '32px'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#111827', 
            marginBottom: '8px' 
          }}>
            🔍 Search Documents
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Find exactly what you're looking for with our powerful AI-driven search engine
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} style={{ marginBottom: '32px' }}>
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files by name or content..."
              style={{
                flex: 1,
                padding: '16px',
                fontSize: '16px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              style={{
                padding: '16px 24px',
                backgroundColor: isSearching ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isSearching ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {isSearching ? '🔄 Searching...' : '🔍 Search'}
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" id="searchContent" />
            <label htmlFor="searchContent" style={{ fontSize: '14px', color: '#6b7280' }}>
              Search within document content (semantic search)
            </label>
          </div>
        </form>

        {/* Quick Search Terms */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#111827', 
            marginBottom: '12px' 
          }}>
            Quick Search
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {quickSearchTerms.map((term) => (
              <button
                key={term}
                onClick={() => setSearchQuery(term)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '20px',
                  fontSize: '14px',
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#111827', 
              marginBottom: '16px' 
            }}>
              Search Results for "{searchQuery}"
            </h3>
            
            {isSearching ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '48px',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔄</div>
                <p>Searching through your documents...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '48px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <h4 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '8px' 
                }}>
                  No results found
                </h4>
                <p style={{ color: '#6b7280' }}>
                  Try different keywords or upload some documents first
                </p>
              </div>
            ) : (
              <div>
                {/* Results would be displayed here */}
              </div>
            )}
          </div>
        )}

        {/* Search Tips */}
        {!searchQuery && (
          <div>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#111827', 
              marginBottom: '16px' 
            }}>
              Search Tips & Features
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '24px' 
            }}>
              <div style={{
                padding: '20px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
                <h4 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  marginBottom: '8px',
                  color: '#111827'
                }}>
                  Basic Search
                </h4>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
                  Enter keywords to search file names and content
                </p>
                <code style={{ 
                  fontSize: '12px', 
                  backgroundColor: '#e2e8f0', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  color: '#3b82f6'
                }}>
                  contract agreement
                </code>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📝</div>
                <h4 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  marginBottom: '8px',
                  color: '#111827'
                }}>
                  Phrase Search
                </h4>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
                  Use quotes for exact phrase matching
                </p>
                <code style={{ 
                  fontSize: '12px', 
                  backgroundColor: '#e2e8f0', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  color: '#3b82f6'
                }}>
                  "project timeline"
                </code>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤖</div>
                <h4 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  marginBottom: '8px',
                  color: '#111827'
                }}>
                  Semantic Search
                </h4>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
                  AI understands context and meaning
                </p>
                <code style={{ 
                  fontSize: '12px', 
                  backgroundColor: '#e2e8f0', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  color: '#3b82f6'
                }}>
                  financial reports
                </code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
