from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Optional

from models.file import File
from services.similarity import SimilarityService
from services.embeddings import EmbeddingsService
from config import SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

router = APIRouter(prefix="/api/similarity", tags=["similarity"])

@router.get("/matrix")
def get_similarity_matrix(
    threshold: float = Query(0.5, ge=0.0, le=1.0, description="Minimum similarity threshold"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of results per file"),
    db: Session = Depends(get_db)
) -> Dict[int, List[Dict]]:
    """
    Get similarity matrix for all documents with embeddings
    
    Returns:
        Dictionary mapping file IDs to their similar documents
    """
    try:
        similarity_service = SimilarityService(db, EmbeddingsService(db))
        return similarity_service.get_all_similar_documents(threshold)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting similarity matrix: {str(e)}")

@router.post("/calculate")
def calculate_similarity_matrix(
    file_ids: Optional[List[int]] = None,
    threshold: float = 0.5,
    db: Session = Depends(get_db)
) -> Dict[int, List[Dict]]:
    """
    Calculate similarity matrix for specified files
    
    Args:
        file_ids: List of file IDs to include (all if None)
        threshold: Minimum similarity score to include
        
    Returns:
        Dictionary mapping file IDs to their similar documents
    """
    try:
        similarity_service = SimilarityService(db, EmbeddingsService(db))
        
        if not file_ids:
            # Get all files with embeddings if none specified
            file_ids = [
                f[0] for f in db.query(File.id)
                .filter(File.has_embeddings == True)
                .all()
            ]
            
        return similarity_service.calculate_similarity_matrix(file_ids, threshold)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating similarity matrix: {str(e)}")

@router.get("/files/{file_id}/similar")
def get_similar_documents(
    file_id: int,
    threshold: float = Query(0.6, ge=0.0, le=1.0, description="Minimum similarity threshold"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of results"),
    db: Session = Depends(get_db)
) -> List[Dict]:
    """
    Get similar documents for a specific file
    
    Args:
        file_id: ID of the file to find similar documents for
        threshold: Minimum similarity score to include
        limit: Maximum number of results to return
        
    Returns:
        List of similar documents with scores
    """
    try:
        similarity_service = SimilarityService(db, EmbeddingsService(db))
        return similarity_service.calculate_similarity(file_id, threshold, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error finding similar documents: {str(e)}")