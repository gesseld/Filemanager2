from typing import List, Dict, Optional
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging
from models.file import File
from services.embeddings import EmbeddingsService
import pickle

logger = logging.getLogger(__name__)

class SimilarityService:
    """Service for calculating and managing document similarity relationships"""
    
    def __init__(self, db: Session, embeddings_service: EmbeddingsService):
        self.db = db
        self.embeddings_service = embeddings_service

    def calculate_similarity(self, file_id: int, threshold: float = 0.7, limit: int = 10) -> List[Dict]:
        """Calculate similar documents for a given file"""
        try:
            # Get the target file's embedding
            file = self.db.query(File).filter(File.id == file_id).first()
            if not file or not file.has_embeddings:
                return []

            target_embedding = file.get_embedding()
            if target_embedding is None:
                return []

            # Convert to numpy array for FAISS
            target_embedding = np.array([target_embedding], dtype='float32')

            # Search for similar documents
            distances, indices = self.embeddings_service.index.search(target_embedding, limit + 1)  # +1 to exclude self
            
            # Process results
            results = []
            for idx, distance in zip(indices[0], distances[0]):
                if idx == -1 or idx == file_id:  # Skip invalid indices and self
                    continue
                    
                similarity = 1 / (1 + distance)
                if similarity >= threshold:
                    similar_file = self.db.query(File).filter(File.id == idx).first()
                    if similar_file:
                        results.append({
                            "file_id": similar_file.id,
                            "file_name": similar_file.name,
                            "similarity_score": float(similarity),
                            "distance": float(distance)
                        })

            return sorted(results, key=lambda x: x["similarity_score"], reverse=True)[:limit]

        except Exception as e:
            logger.error(f"Error calculating similarity for file {file_id}: {str(e)}")
            return []

    def calculate_similarity_matrix(self, file_ids: List[int], threshold: float = 0.5) -> Dict[int, List[Dict]]:
        """Calculate similarity matrix for multiple files"""
        try:
            matrix = {}
            for file_id in file_ids:
                similar_docs = self.calculate_similarity(file_id, threshold)
                matrix[file_id] = similar_docs
            return matrix
        except Exception as e:
            logger.error(f"Error calculating similarity matrix: {str(e)}")
            return {}

    def get_all_similar_documents(self, threshold: float = 0.6) -> Dict[int, List[Dict]]:
        """Get similarity relationships for all documents with embeddings"""
        try:
            file_ids = [
                f[0] for f in self.db.query(File.id)
                .filter(File.has_embeddings == True)
                .all()
            ]
            return self.calculate_similarity_matrix(file_ids, threshold)
        except Exception as e:
            logger.error(f"Error getting all similar documents: {str(e)}")
            return {}