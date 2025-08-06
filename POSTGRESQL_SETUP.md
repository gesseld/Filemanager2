# PostgreSQL Setup Guide for File Manager Application

This guide provides comprehensive instructions for setting up PostgreSQL as the primary database for the File Manager application.

## Overview

The application has been successfully migrated from SQLite to PostgreSQL with the following enhancements:

- **PostgreSQL 15** as the primary database
- **Full-text search** capabilities using PostgreSQL's built-in features
- **JSONB** data type for efficient metadata storage
- **TSVECTOR** for optimized full-text search
- **GIN indexes** for fast search performance
- **Connection pooling** for better performance

## Database Schema

### Tables
1. **files** - Stores file metadata
2. **extracted_content** - Stores extracted text content and metadata
3. **search_index** - Stores full-text search data
4. **extraction_tasks** - Stores Celery task information

### PostgreSQL-Specific Features
- **JSONB** columns for flexible metadata storage
- **TSVECTOR** columns for full-text search
- **GIN indexes** for fast full-text search queries
- **Proper foreign key constraints** with CASCADE deletes
- **Optimized indexes** for common queries

## Setup Instructions

### 1. Environment Variables

The following environment variables are configured:

```bash
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=filemanager
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
SQLALCHEMY_DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
```

### 2. Docker Setup

PostgreSQL is included in both `docker-compose.yml` and `docker-compose.prod.yml`:

```yaml
postgres:
  image: postgres:15-alpine
  environment:
    POSTGRES_USER: ${POSTGRES_USER}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    POSTGRES_DB: ${POSTGRES_DB}
  volumes:
    - postgres-data:/var/lib/postgresql/data
  ports:
    - "5432:5432"
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
    interval: 5s
    timeout: 5s
    retries: 5
```

### 3. Running the Application

#### Development Environment
```bash
# Start all services
docker-compose up --build

# Or run setup script
python setup_postgresql.py
```

#### Production Environment
```bash
# Start production services
docker-compose -f docker-compose.prod.yml up --build
```

### 4. Manual PostgreSQL Setup (Optional)

If running PostgreSQL locally without Docker:

```bash
# Install PostgreSQL
# Ubuntu/Debian:
sudo apt-get install postgresql postgresql-contrib

# macOS:
brew install postgresql

# Start PostgreSQL service
sudo systemctl start postgresql  # Linux
brew services start postgresql   # macOS

# Create database
createdb filemanager

# Create user (optional)
createuser -P filemanager_user
```

### 5. Migration Commands

```bash
# Generate new migration
cd fastapi-app
alembic revision --autogenerate -m "Description"

# Run migrations
alembic upgrade head

# Downgrade migrations
alembic downgrade -1
```

### 6. Testing PostgreSQL Connection

Run the provided setup script:

```bash
python setup_postgresql.py
```

This script will:
- Create the database if it doesn't exist
- Test the connection
- Set up PostgreSQL extensions
- Test full-text search functionality
- Run migrations

## Full-Text Search Features

### Search Capabilities
- **Full-text search** across extracted content
- **File type filtering** in search results
- **Relevance ranking** using PostgreSQL's ts_rank
- **Highlighted search results** with context
- **Search suggestions** based on content

### Search Examples

#### Basic Search
```sql
SELECT 
    f.name,
    ts_rank(si.search_vector, plainto_tsquery('english', 'search term')) as rank,
    ts_headline('english', si.content, plainto_tsquery('english', 'search term')) as highlighted
FROM search_index si
JOIN files f ON si.file_id = f.id
WHERE si.search_vector @@ plainto_tsquery('english', 'search term')
ORDER BY rank DESC;
```

#### Advanced Search with Filters
```sql
SELECT 
    f.name,
    f.type,
    ts_rank(si.search_vector, plainto_tsquery('english', 'search term')) as rank
FROM search_index si
JOIN files f ON si.file_id = f.id
WHERE si.search_vector @@ plainto_tsquery('english', 'search term')
    AND f.type = 'application/pdf'
ORDER BY rank DESC;
```

## Performance Optimization

### Indexes Created
- **GIN indexes** on TSVECTOR columns for full-text search
- **B-tree indexes** on foreign keys and common query columns
- **Composite indexes** for complex queries
- **Partial indexes** for status-based queries

### Connection Pooling
- **Pool size**: 20 connections
- **Max overflow**: 10 additional connections
- **Connection timeout**: 10 seconds
- **Pool pre-ping**: Enabled for connection validation

## Troubleshooting

### Common Issues

1. **Connection refused**
   - Check if PostgreSQL is running
   - Verify host and port configuration
   - Check firewall settings

2. **Authentication failed**
   - Verify username and password
   - Check PostgreSQL pg_hba.conf configuration

3. **Database doesn't exist**
   - Run the setup script: `python setup_postgresql.py`
   - Or create manually: `createdb filemanager`

4. **Migration errors**
   - Ensure PostgreSQL extensions are installed
   - Check database permissions
   - Verify connection string format

### Debug Commands

```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432 -U postgres

# Connect to database
psql -h localhost -U postgres -d filemanager

# List databases
psql -h localhost -U postgres -l

# Check table structure
\d files
\d search_index
```

## Backup and Restore

### Backup
```bash
pg_dump -h localhost -U postgres filemanager > backup.sql
```

### Restore
```bash
psql -h localhost -U postgres -d filemanager < backup.sql
```

## Security Considerations

- **Strong passwords** for database users
- **SSL connections** in production
- **Connection encryption** enabled
- **Regular backups** scheduled
- **Access control** via PostgreSQL roles

## Monitoring

### Database Metrics
- Connection pool usage
- Query performance
- Index usage statistics
- Full-text search performance

### Health Checks
- PostgreSQL service health
- Connection availability
- Migration status
- Search functionality

## Next Steps

1. **Test the application** with sample files
2. **Monitor performance** with production data
3. **Set up automated backups**
4. **Configure monitoring alerts**
5. **Optimize queries** based on usage patterns