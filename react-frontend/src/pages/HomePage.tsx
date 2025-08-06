import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <h1 style={{ 
        fontSize: '48px', 
        fontWeight: 'bold', 
        color: '#111827', 
        marginBottom: '24px' 
      }}>
        EntrepEAI File Manager
      </h1>
      <p style={{ 
        fontSize: '20px', 
        color: '#6b7280', 
        marginBottom: '40px',
        maxWidth: '600px',
        margin: '0 auto 40px auto',
        lineHeight: '1.6'
      }}>
        Upload, process, and search through your documents with advanced AI-powered content extraction and semantic search capabilities.
      </p>
      
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        justifyContent: 'center', 
        flexWrap: 'wrap',
        marginBottom: '60px'
      }}>
        <Link to="/upload" style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '16px 32px',
          backgroundColor: '#3b82f6',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '8px',
          fontSize: '18px',
          fontWeight: '600',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          transition: 'all 0.2s'
        }}>
          📤 Upload Files
        </Link>
        <Link to="/files" style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '16px 32px',
          backgroundColor: 'white',
          color: '#374151',
          textDecoration: 'none',
          borderRadius: '8px',
          fontSize: '18px',
          fontWeight: '600',
          border: '2px solid #d1d5db',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          transition: 'all 0.2s'
        }}>
          📁 Browse Files
        </Link>
        <Link to="/search" style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '16px 32px',
          backgroundColor: '#10b981',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '8px',
          fontSize: '18px',
          fontWeight: '600',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          transition: 'all 0.2s'
        }}>
          🔍 Search Documents
        </Link>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
            Lightning Fast
          </h3>
          <p style={{ color: '#6b7280', lineHeight: '1.5' }}>
            Upload multiple files simultaneously with optimized processing and instant feedback.
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
            AI-Powered
          </h3>
          <p style={{ color: '#6b7280', lineHeight: '1.5' }}>
            Automatic content extraction and intelligent document analysis with semantic search.
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
            Secure Storage
          </h3>
          <p style={{ color: '#6b7280', lineHeight: '1.5' }}>
            Enterprise-grade security with encrypted file storage and privacy protection.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
