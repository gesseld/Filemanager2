import React from 'react';
import { Link } from 'react-router-dom';

const FilesPage: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        padding: '32px'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#111827', 
            marginBottom: '8px' 
          }}>
            📁 Your Files
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Manage and view your uploaded documents
          </p>
        </div>

        <div style={{
          border: '2px dashed #d1d5db',
          borderRadius: '8px',
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📄</div>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#374151', 
            marginBottom: '8px' 
          }}>
            No files uploaded yet
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            Upload your first document to get started with AI-powered processing
          </p>
          <Link to="/upload" style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            📤 Upload Files
          </Link>
        </div>

        <div style={{ marginTop: '32px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#111827', 
            marginBottom: '16px' 
          }}>
            Supported File Types
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '12px' 
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px'
            }}>
              <span style={{ fontSize: '20px' }}>📄</span>
              <span style={{ fontWeight: '500' }}>PDF Documents</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px'
            }}>
              <span style={{ fontSize: '20px' }}>📝</span>
              <span style={{ fontWeight: '500' }}>Word Documents</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px'
            }}>
              <span style={{ fontSize: '20px' }}>📃</span>
              <span style={{ fontWeight: '500' }}>Text Files</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilesPage;
