from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class SearchService:
    """Service for full-text search functionality"""

    def __init__(self, db: Session):
        self.db = db

    def create_search_index(self, file_id: int, content: str) -> bool:
        """Create or update search index for a file"""
        try:
            # Use PostgreSQL full-text search
            sql = text(
                """
                INSERT INTO search_index (file_id, content, search_vector)
                VALUES (:file_id, :content, to_tsvector('english', :content))
                ON CONFLICT (file_id) DO UPDATE SET
                    content = EXCLUDED.content,
                    search_vector = to_tsvector('english', EXCLUDED.content),
                    indexed_at = CURRENT_TIMESTAMP
            """
            )

            self.db.execute(sql, {"file_id": file_id, "content": content})
            self.db.commit()
            return True

        except Exception as e:
            logger.error(f"Error creating search index: {str(e)}")
            self.db.rollback()
            return False

    def search_content(self, query: str, limit: int = 10, offset: int = 0) -> Dict[str, Any]:
        """Search content using PostgreSQL full-text search"""
        try:
            # Main search query
            search_sql = text(
                """
                SELECT 
                    si.file_id,
                    f.name as file_name,
                    f.type as file_type,
                    f.size as file_size,
                    f.upload_date,
                    left(si.content, 300) as content_snippet,
                    ts_rank(si.search_vector, plainto_tsquery('english', :query)) as rank,
                    ts_headline('english', si.content, plainto_tsquery('english', :query), 
                        'MaxWords=35, MinWords=15, ShortWord=3, HighlightAll=true') as highlighted_content
                FROM search_index si
                JOIN files f ON si.file_id = f.id
                WHERE si.search_vector @@ plainto_tsquery('english', :query)
                ORDER BY rank DESC
                LIMIT :limit OFFSET :offset
            """
            )

            # Count query
            count_sql = text(
                """
                SELECT COUNT(*)
                FROM search_index si
                WHERE si.search_vector @@ plainto_tsquery('english', :query)
            """
            )

            results = self.db.execute(
                search_sql, {"query": query, "limit": limit, "offset": offset}
            ).fetchall()

            total = self.db.execute(count_sql, {"query": query}).scalar()

            # Format results
            formatted_results = []
            for row in results:
                formatted_results.append(
                    {
                        "file_id": row.file_id,
                        "file_name": row.file_name,
                        "file_type": row.file_type,
                        "file_size": row.file_size,
                        "upload_date": row.upload_date,
                        "content_snippet": row.content_snippet,
                        "highlighted_content": row.highlighted_content,
                        "score": float(row.rank),
                    }
                )

            return {
                "results": formatted_results,
                "total": total,
                "query": query,
                "limit": limit,
                "offset": offset,
            }

        except Exception as e:
            logger.error(f"Error searching content: {str(e)}")
            return {"results": [], "total": 0, "query": query, "limit": limit, "offset": offset}

    def search_by_file_type(
        self, query: str, file_type: str, limit: int = 10, offset: int = 0
    ) -> Dict[str, Any]:
        """Search content filtered by file type"""
        try:
            search_sql = text(
                """
                SELECT 
                    si.file_id,
                    f.name as file_name,
                    f.type as file_type,
                    f.size as file_size,
                    f.upload_date,
                    left(si.content, 300) as content_snippet,
                    ts_rank(si.search_vector, plainto_tsquery('english', :query)) as rank,
                    ts_headline('english', si.content, plainto_tsquery('english', :query)) as highlighted_content
                FROM search_index si
                JOIN files f ON si.file_id = f.id
                WHERE si.search_vector @@ plainto_tsquery('english', :query)
                    AND f.type = :file_type
                ORDER BY rank DESC
                LIMIT :limit OFFSET :offset
            """
            )

            count_sql = text(
                """
                SELECT COUNT(*)
                FROM search_index si
                JOIN files f ON si.file_id = f.id
                WHERE si.search_vector @@ plainto_tsquery('english', :query)
                    AND f.type = :file_type
            """
            )

            results = self.db.execute(
                search_sql,
                {"query": query, "file_type": file_type, "limit": limit, "offset": offset},
            ).fetchall()

            total = self.db.execute(count_sql, {"query": query, "file_type": file_type}).scalar()

            formatted_results = []
            for row in results:
                formatted_results.append(
                    {
                        "file_id": row.file_id,
                        "file_name": row.file_name,
                        "file_type": row.file_type,
                        "file_size": row.file_size,
                        "upload_date": row.upload_date,
                        "content_snippet": row.content_snippet,
                        "highlighted_content": row.highlighted_content,
                        "score": float(row.rank),
                    }
                )

            return {
                "results": formatted_results,
                "total": total,
                "query": query,
                "file_type": file_type,
                "limit": limit,
                "offset": offset,
            }

        except Exception as e:
            logger.error(f"Error searching by file type: {str(e)}")
            return {
                "results": [],
                "total": 0,
                "query": query,
                "file_type": file_type,
                "limit": limit,
                "offset": offset,
            }

    def get_search_suggestions(self, query: str, limit: int = 5) -> List[str]:
        """Get search suggestions based on partial query"""
        try:
            sql = text(
                """
                SELECT DISTINCT word
                FROM (
                    SELECT unnest(string_to_array(lower(content), ' ')) as word
                    FROM search_index
                ) words
                WHERE word LIKE :query || '%'
                AND length(word) > 3
                ORDER BY word
                LIMIT :limit
            """
            )

            results = self.db.execute(sql, {"query": query.lower(), "limit": limit}).fetchall()

            return [row.word for row in results]

        except Exception as e:
            logger.error(f"Error getting search suggestions: {str(e)}")
            return []
