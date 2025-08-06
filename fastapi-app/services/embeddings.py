from typing import List, Optional, Dict
import logging
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss
from sqlalchemy.orm import Session
from sqlalchemy import text
from models.file import File
from config import settings
import pickle
import os

logger = logging.getLogger(__name__)

class EmbeddingsService:
    """Service for generating and managing document embeddings"""

    def __init__(self, db: Session):
        self.db = db
        self.model = None
        self.index = None
        self.load_model()
        self.load_index()

    def load_model(self):
        """Load the sentence transformer model"""
        try:
            model_name = settings.EMBEDDINGS_MODEL or "all-MiniLM-L6-v2"
            self.model = SentenceTransformer(model_name)
            logger.info(f"Loaded embeddings model: {model_name}")
        except Exception as e:
            logger.error(f"Error loading embeddings model: {str(e)}")
            raise

    def load_index(self):
        """Load or create FAISS index"""
        index_path = settings.EMBEDDINGS_INDEX_PATH or "embeddings.index"
        
        if os.path.exists(index_path):
            try:
                self.index = faiss.read_index(index_path)
                logger.info(f"Loaded existing FAISS index from {index_path}")
            except Exception as e:
                logger.error(f"Error loading FAISS index: {str(e)}")
                self.create_new_index()
        else:
            self.create_new_index()

    def create_new_index(self):
        """Create a new empty FAISS index"""
        try:
            dimension = self.model.get_sentence_embedding_dimension()
            self.index = faiss.IndexFlatL2(dimension)
            logger.info(f"Created new FAISS index with dimension {dimension}")
        except Exception as e:
            logger.error(f"Error creating FAISS index: {str(e)}")
            raise

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for a single text document"""
        try:
            embedding = self.model.encode(text)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            raise

    def store_embedding(self, file_id: int, embedding: List[float]) -> bool:
        """Store embedding in database and FAISS index"""
        try:
            # Store in database
            sql = text("""
                INSERT INTO file_embeddings (file_id, embedding)
                VALUES (:file_id, :embedding)
                ON CONFLICT (file_id) DO UPDATE SET
                    embedding = EXCLUDED.embedding,
                    updated_at = CURRENT_TIMESTAMP
            """)
            self.db.execute(sql, {"file_id": file_id, "embedding": pickle.dumps(embedding)})
            self.db.commit()

            # Add to FAISS index
            embedding_array = np.array([embedding], dtype='float32')
            self.index.add(embedding_array)
            
            # Save index
            index_path = settings.EMBEDDINGS_INDEX_PATH or "embeddings.index"
            faiss.write_index(self.index, index_path)

            return True
        except Exception as e:
            logger.error(f"Error storing embedding: {str(e)}")
            self.db.rollback()
            return False

    def semantic_search(self, query: str, k: int = 10) -> List[Dict]:
        """Perform semantic search using embeddings"""
        try:
            # Generate query embedding
            query_embedding = self.model.encode(query)
            query_embedding = np.array([query_embedding], dtype='float32')

            # Search FAISS index
            distances, indices = self.index.search(query_embedding, k)

            # Get file details for results
            results = []
            for idx, distance in zip(indices[0], distances[0]):
                if idx == -1:  # No more results
                    continue

                file = self.db.query(File).filter(File.id == idx).first()
                if file:
                    results.append({
                        "file_id": file.id,
                        "file_name": file.name,
                        "file_type": file.type,
                        "similarity_score": float(1 / (1 + distance)),
                        "distance": float(distance)
                    })

            return results

        except Exception as e:
            logger.error(f"Error performing semantic search: {str(e)}")
            return []

    def batch_generate_embeddings(self, file_ids: List[int], texts: List[str]) -> bool:
        """Generate and store embeddings for multiple documents"""
        try:
            if len(file_ids) != len(texts):
                raise ValueError("file_ids and texts must have same length")

            # Generate embeddings
            embeddings = self.model.encode(texts)

            # Store in database and index
            for file_id, embedding in zip(file_ids, embeddings):
                self.store_embedding(file_id, embedding.tolist())

            return True
        except Exception as e:
            logger.error(f"Error in batch embedding generation: {str(e)}")
            return False