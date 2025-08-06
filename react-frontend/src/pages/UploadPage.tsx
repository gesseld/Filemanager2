import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const UploadPage: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Handle file upload here
      console.log('Files dropped:', e.dataTransfer.files);
    }
  };

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
            📤 Upload Documents
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Upload your documents for AI-powered content extraction and processing
          </p>
        </div>

        {/* Upload Area */}
        <div
          style={{
            border: dragActive ? '2px solid #3b82f6' : '2px dashed #d1d5db',
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center',
            backgroundColor: dragActive ? '#eff6ff' : '#f9fafb',
            transition: 'all 0.2s',
            cursor: 'pointer'
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = '.pdf,.docx,.txt,.doc';
            input.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (files) {
                console.log('Files selected:', files);
              }
            };
            input.click();
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>
            {dragActive ? '📥' : '📤'}
          </div>
          <h3 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            color: '#374151', 
            marginBottom: '8px' 
          }}>
            {dragActive ? 'Drop files here' : 'Drag & drop files here'}
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '16px', fontSize: '16px' }}>
            or click to select files from your computer
          </p>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
            Supports PDF, Word documents, and text files
          </p>
        </div>

        {/* Upload Guidelines */}
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#111827', 
            marginBottom: '16px' 
          }}>
            Upload Guidelines
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '24px' 
          }}>
            <div>
              <h4 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#059669', 
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ✅ Best Practices
              </h4>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                margin: 0,
                color: '#6b7280'
              }}>
                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'start', gap: '8px' }}>
                  <span style={{ color: '#059669' }}>•</span>
                  <span>Use clear, descriptive file names</span>
                </li>
                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'start', gap: '8px' }}>
                  <span style={{ color: '#059669' }}>•</span>
                  <span>Ensure documents are text-readable</span>
                </li>
                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'start', gap: '8px' }}>
                  <span style={{ color: '#059669' }}>•</span>
                  <span>Keep file sizes under 50MB</span>
                </li>
                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'start', gap: '8px' }}>
                  <span style={{ color: '#059669' }}>•</span>
                  <span>Upload multiple files for batch processing</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#dc2626', 
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ❌ Avoid
              </h4>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                margin: 0,
                color: '#6b7280'
              }}>
                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'start', gap: '8px' }}>
                  <span style={{ color: '#dc2626' }}>•</span>
                  <span>Password-protected files</span>
                </li>
                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'start', gap: '8px' }}>
                  <span style={{ color: '#dc2626' }}>•</span>
                  <span>Corrupted or damaged documents</span>
                </li>
                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'start', gap: '8px' }}>
                  <span style={{ color: '#dc2626' }}>•</span>
                  <span>Files with sensitive information</span>
                </li>
                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'start', gap: '8px' }}>
                  <span style={{ color: '#dc2626' }}>•</span>
                  <span>Extremely large files (over 100MB)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div style={{
          marginTop: '32px',
          padding: '16px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'start',
          gap: '12px'
        }}>
          <span style={{ fontSize: '20px' }}>🔒</span>
          <div>
            <h4 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#1e40af', 
              marginBottom: '4px' 
            }}>
              Privacy & Security
            </h4>
            <p style={{ color: '#1e40af', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
              Your uploaded files are processed securely and stored with enterprise-grade encryption. 
              We respect your privacy and never share your documents with third parties.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          marginTop: '32px', 
          display: 'flex', 
          gap: '16px', 
          justifyContent: 'center' 
        }}>
          <Link to="/files" style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '12px 24px',
            backgroundColor: '#6b7280',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            📁 View Files
          </Link>
          <Link to="/search" style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '12px 24px',
            backgroundColor: '#10b981',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            🔍 Search Documents
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
