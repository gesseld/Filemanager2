# Content Extraction Frontend Components

This document outlines the frontend components implemented for document content extraction and search functionality.

## Overview

The frontend has been enhanced with comprehensive content extraction and search capabilities, including real-time processing status updates, content preview, and retry mechanisms.

## Components Implemented

### 1. Updated SearchBar Component

- **File**: `src/components/SearchBar.tsx`
- **Features**:
  - Content search toggle checkbox
  - Responsive design with mobile support
  - Customizable placeholder text
  - TypeScript support

### 2. SearchResults Component

- **File**: `src/components/SearchResults.tsx`
- **Features**:
  - Content highlighting with search term
  - Relevance score display
  - Truncated content preview
  - Click-to-preview functionality
  - Loading states
  - Empty state handling

### 3. ContentPreviewModal Component

- **File**: `src/components/ContentPreviewModal.tsx`
- **Features**:
  - Full-screen modal for content preview
  - Metadata display sidebar
  - Extraction status handling (pending, processing, completed, failed)
  - Retry mechanism for failed extractions
  - Loading states
  - Error handling

### 4. Updated FileList Component

- **File**: `src/components/FileList.tsx`
- **Features**:
  - Extraction status badges
  - Real-time processing indicators
  - Retry buttons for failed extractions
  - File size formatting
  - Preview integration
  - Loading states for status updates

### 5. ProcessingDashboard Component

- **File**: `src/components/ProcessingDashboard.tsx`
- **Features**:
  - Real-time processing statistics
  - Auto-refresh functionality (5-second intervals)
  - Individual file status tracking
  - Retry mechanisms
  - Progress indicators
  - Toggle auto-refresh

### 6. SearchPage Component

- **File**: `src/pages/SearchPage.tsx`
- **Features**:
  - Integrated search functionality
  - Content search toggle
  - Results pagination support
  - Preview modal integration
  - Responsive design

### 7. Custom Hook for Real-time Updates

- **File**: `src/hooks/useProcessingStatus.ts`
- **Features**:
  - Real-time processing status updates
  - Configurable refresh intervals
  - Auto-refresh management
  - Error handling
  - Processing statistics

## TypeScript Interfaces

- **File**: `src/types/content-extraction.ts`
- Contains all TypeScript interfaces for:
  - ExtractedContent
  - SearchResult
  - SearchRequest/Response
  - ExtractionTask
  - ProcessingStatus
  - ContentPreviewData

## API Service Updates

- **File**: `src/services/api.ts`
- Added new endpoints:
  - `searchContent()` - Content search
  - `getExtractedContent()` - Get extracted content
  - `triggerContentExtraction()` - Trigger extraction
  - `getExtractionTask()` - Get task status
  - `retryExtraction()` - Retry failed extraction
  - `getProcessingStatus()` - Get all processing status
  - `getFileContent()` - Get raw file content

## Integration Points

### FilesPage Integration

- Added processing dashboard toggle
- Integrated content preview modal
- Real-time extraction status updates
- Retry mechanisms for failed extractions

### Navigation Updates

- Search page accessible via `/search`
- Processing dashboard integrated into Files page
- Navbar includes search navigation

## Usage Examples

### Basic Search

```typescript
import SearchBar from './components/SearchBar';

<SearchBar
  onSearch={(query, searchContent) => handleSearch(query, searchContent)}
  placeholder="Search files..."
  showContentToggle={true}
/>
```

### Processing Status Hook

```typescript
import { useProcessingStatus } from './hooks/useProcessingStatus';

const { processingStatus, stats, refresh } = useProcessingStatus({
  autoRefresh: true,
  refreshInterval: 5000,
});
```

### Content Preview

```typescript
import ContentPreviewModal from './components/ContentPreviewModal';

<ContentPreviewModal
  fileId={fileId}
  fileName={fileName}
  isOpen={isOpen}
  onClose={handleClose}
/>
```

## Styling

- Uses Tailwind CSS for responsive design
- Consistent color scheme with existing application
- Modern card-based layouts
- Hover effects and transitions
- Loading states and animations

## Error Handling

- Comprehensive error states for all components
- Retry mechanisms for failed operations
- User-friendly error messages
- Graceful degradation

## Responsive Design

- Mobile-first approach
- Flexible layouts for all screen sizes
- Touch-friendly interactions
- Optimized for desktop and mobile

## Future Enhancements

- WebSocket support for real-time updates
- Advanced search filters
- Bulk operations
- Export functionality
- Advanced metadata display
