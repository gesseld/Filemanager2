import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { FileProvider } from './contexts/FileContext';
import HomePage from './pages/HomePage';
import FilesPage from './pages/FilesPage';
import UploadPage from './pages/UploadPage';
import SearchPage from './pages/SearchPage';

function App() {
  return (
    <FileProvider>
      <Router>
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'Inter, system-ui, sans-serif' }}>
          {/* Simple Navbar */}
          <nav style={{ 
            backgroundColor: 'white', 
            borderBottom: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 50
          }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                height: '64px' 
              }}>
                <Link to="/" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  textDecoration: 'none'
                }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    backgroundColor: '#3b82f6', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg style={{ width: '20px', height: '20px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                    EntrepEAI File Manager
                  </h1>
                </Link>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Link to="/" style={{ 
                    color: '#6b7280', 
                    textDecoration: 'none', 
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}>
                    🏠 Home
                  </Link>
                  <Link to="/files" style={{ 
                    color: '#6b7280', 
                    textDecoration: 'none', 
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}>
                    📁 Files
                  </Link>
                  <Link to="/upload" style={{ 
                    color: '#6b7280', 
                    textDecoration: 'none', 
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}>
                    📤 Upload
                  </Link>
                  <Link to="/search" style={{ 
                    color: '#6b7280', 
                    textDecoration: 'none', 
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}>
                    🔍 Search
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/files" element={<FilesPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/search" element={<SearchPage />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer style={{ 
            backgroundColor: 'white', 
            borderTop: '1px solid #e5e7eb',
            marginTop: '40px',
            padding: '32px 20px'
          }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                textAlign: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '24px', 
                    height: '24px', 
                    backgroundColor: '#3b82f6', 
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg style={{ width: '16px', height: '16px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>
                      EntrepEAI File Manager
                    </p>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                      Intelligent document processing
                    </p>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '24px', 
                  fontSize: '14px', 
                  color: '#6b7280' 
                }}>
                  <a href="#" style={{ color: '#6b7280', textDecoration: 'none' }}>Privacy Policy</a>
                  <a href="#" style={{ color: '#6b7280', textDecoration: 'none' }}>Terms of Service</a>
                  <a href="#" style={{ color: '#6b7280', textDecoration: 'none' }}>Support</a>
                </div>
                
                <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                  © {new Date().getFullYear()} EntrepEAI. All rights reserved.
                </div>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </FileProvider>
  );
}

export default App;
