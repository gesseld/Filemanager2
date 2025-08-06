# Content Extraction and Search Backend

This document describes the complete backend infrastructure for document content extraction and search functionality.

## Architecture Overview

The system uses a microservices architecture with the following components:

- **Apache Tika**: Content extraction service
- **Redis**: Message broker for Celery
- **Celery**: Background task processing
- **PostgreSQL**: Full-text search with GIN indexes
- **FastAPI**: REST API endpoints

## Services

### 1. Apache Tika Service
- **Container**: `apache/tika:2.9.0.0`
- **Port**: 9998
- **Purpose**: Extracts text content from various document formats

### 2. Redis Service
- **Container**: `redis:7-alpine`
- **Port**: 6379
- **Purpose**: Message broker for Celery tasks

### 3. Celery Workers
- **Container**: Uses backend Dockerfile
- **Purpose**: Background processing of content extraction
- **Workers**: 2 services (worker + beat scheduler)

## API Endpoints

### Content Extraction
- `POST /api/content/extract` - Trigger content extraction
- `GET /api/content/extract/{file_id}` - Get extracted content
- `DELETE /api/content/extract/{file_id}` - Delete extracted content

### Search
- `POST /api/content/search` - Search content
- `GET /api/content/search` - Search content (GET variant)

### Task Management
- `GET /api/content/tasks/{task_id}` - Get task status
- `GET /api/content/tasks` - List tasks with filtering

### Monitoring
- `GET /api/content/monitoring/stats` - Task statistics
- `GET /api/content/monitoring/health` - System health
- `GET /api/content/monitoring/failed-tasks` - Failed tasks
- `GET /api/content/monitoring/pending-tasks` - Pending tasks
- `GET /api/content/monitoring/processing-tasks` - Processing tasks
- `POST /api/content/monitoring/cleanup` - Clean up old tasks

## Database Models

### ExtractedContent
- Stores extracted text content
- Tracks extraction status (pending, processing, completed, failed)
- Stores error messages for failed extractions

### SearchIndex
- PostgreSQL full-text search index
- Uses GIN indexes for fast searching
- Stores search vectors for content

### ExtractionTask
- Tracks background task execution
- Stores retry information
- Provides task monitoring capabilities

## Configuration

### Environment Variables
```bash
# Redis
REDIS_URL=redis://redis:6379/0

# Tika
TIKA_SERVER_URL=http://tika:9998/tika

# Database (PostgreSQL)
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=your_db
```

## Usage Examples

### 1. Upload and Extract Content
```bash
# Upload file first
curl -X POST http://localhost:8000/api/files/upload \
  -F "file=@document.pdf"

# Extract content
curl -X POST http://localhost:8000/api/content/extract \
  -H "Content-Type: application/json" \
  -d '{"file_id": 1}'
```

### 2. Search Content
```bash
# Search for content
curl -X POST http://localhost:8000/api/content/search \
  -H "Content-Type: application/json" \
  -d '{"query": "search term", "limit": 10}'
```

### 3. Monitor Tasks
```bash
# Get task statistics
curl http://localhost:8000/api/content/monitoring/stats

# Get failed tasks
curl http://localhost:8000/api/content/monitoring/failed-tasks
```

## Background Processing

### Automatic Content Extraction
Files are automatically queued for content extraction after upload.

### Retry Mechanism
- Failed extractions are retried up to 3 times
- Exponential backoff between retries
- Circuit breaker for Tika service failures

### Task Monitoring
- Real-time task status tracking
- Comprehensive error logging
- Health checks for all services

## Full-Text Search Features

### PostgreSQL Integration
- Uses PostgreSQL's built-in full-text search
- GIN indexes for optimal performance
- Ranked search results
- Highlighted search snippets

### Search Capabilities
- Content search across all extracted text
- File type filtering
- Search suggestions
- Pagination support

## Error Handling

### Retry Strategies
- Exponential backoff for Tika connection issues
- Circuit breaker for service failures
- Configurable retry limits

### Error Types
- TikaConnectionError: Tika service unavailable
- FileProcessingError: File processing failures
- DatabaseError: Database operation failures
- RetryableError: Errors that can be retried

## Monitoring and Alerting

### Health Checks
- Tika service availability
- Redis connection status
- Database connectivity
- Task queue status

### Metrics
- Task success/failure rates
- Processing times
- Queue lengths
- Error rates

## Development Setup

### Docker Compose
```bash
# Start all services
docker-compose up --build

# View logs
docker-compose logs -f celery
docker-compose logs -f tika
```

### Manual Setup
```bash
# Install dependencies
pip install -r fastapi-app/requirements.txt

# Start Celery worker
celery -A fastapi-app.celery_app worker --loglevel=info

# Start Celery beat
celery -A fastapi-app.celery_app beat --loglevel=info
```

## Testing

### Unit Tests
```bash
pytest fastapi-app/tests/ -v
```

### Integration Tests
```bash
# Test Tika service
curl http://localhost:9998/version

# Test Redis
redis-cli ping
```

## Troubleshooting

### Common Issues

1. **Tika Service Unavailable**
   - Check Tika container logs
   - Verify Tika URL configuration
   - Check network connectivity

2. **Celery Tasks Not Processing**
   - Verify Redis connection
   - Check Celery worker logs
   - Ensure database connectivity

3. **Search Not Working**
   - Verify PostgreSQL extensions
   - Check search index creation
   - Validate content extraction

### Debug Commands
```bash
# Check service health
docker-compose ps

# View logs
docker-compose logs tika
docker-compose logs celery
docker-compose logs redis

# Check task status
curl http://localhost:8000/api/content/monitoring/health
```

## Performance Optimization

### Database Indexes
- GIN indexes on search vectors
- B-tree indexes on file_id and status
- Composite indexes for common queries

### Caching
- Redis for task results
- Connection pooling
- Query result caching

### Scaling
- Multiple Celery workers
- Horizontal scaling of Tika instances
- Database read replicas