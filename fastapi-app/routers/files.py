from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import uuid
from pathlib import Path
from typing import Optional, List

from models.file import File as FileModel
from schemas.file import File as FileSchema, PaginatedFiles
from utils.file_handling import validate_file_type, save_upload_file
from config import SessionLocal
from services.embeddings import EmbeddingsService


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


router = APIRouter(prefix="/files", tags=["files"])

# Configure upload settings
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_MIME_TYPES = [
    # Images
    "image/jpeg", "image/png", "image/gif", "image/svg+xml", "image/webp",
    # Documents
    "application/pdf", "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    # Archives
    "application/zip", "application/x-rar-compressed", "application/x-tar", "application/x-7z-compressed",
    # Code
    "text/x-python", "application/json", "text/xml", "text/html", "text/css", "application/javascript"
]


@router.post("/upload")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload a file with validation and metadata storage

    Args:
        file: The uploaded file
        db: Database session dependency

    Returns:
        JSONResponse with file metadata and status

    Raises:
        HTTPException: For invalid file types or sizes
    """
    try:
        # Validate file
        if file.size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Max size: {MAX_FILE_SIZE} bytes"
            )

        if not validate_file_type(file.content_type, ALLOWED_MIME_TYPES):
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported file type. Allowed: {ALLOWED_MIME_TYPES}"
            )

        # Generate unique filename and save file
        file_id = str(uuid.uuid4())
        file_ext = Path(file.filename).suffix
        saved_path = await save_upload_file(file, file_id + file_ext)

        # Create database record
        db_file = FileModel(
            name=file.filename,
            path=str(saved_path),
            size=file.size,
            type=file.content_type
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)

        return JSONResponse(
            status_code=201,
            content={
                "id": db_file.id,
                "name": db_file.name,
                "size": db_file.size,
                "type": db_file.type,
                "upload_date": db_file.upload_date.isoformat(),
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")


@router.get("", response_model=PaginatedFiles)
def list_files(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    sort_by: str = Query(
        "upload_date",
        description="Sort by field (name, size, upload_date)"
    ),
    sort_order: str = Query(
        "desc",
        description="Sort order (asc or desc)"
    ),
    file_type: Optional[str] = Query(None, description="Filter by file type"),
    db: Session = Depends(get_db),
):
    """
    List all files with pagination

    Args:
        page: Page number (1-based)
        per_page: Items per page (max 100)
        db: Database session

    Returns:
        Paginated list of files with metadata
    """
    query = db.query(FileModel)

    # Apply filters
    if file_type:
        query = query.filter(FileModel.type.like(f"%{file_type}%"))

    # Apply sorting
    sort_field = {
        "name": FileModel.name,
        "size": FileModel.size,
        "upload_date": FileModel.upload_date,
    }.get(sort_by, FileModel.upload_date)

    if sort_order.lower() == "asc":
        query = query.order_by(sort_field.asc())
    else:
        query = query.order_by(sort_field.desc())

    total = query.count()
    offset = (page - 1) * per_page
    files = query.offset(offset).limit(per_page).all()

    return {
        "items": files,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


@router.get("/search", response_model=PaginatedFiles)
def search_files(
    q: str = Query(..., description="Search query for file name or content"),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    semantic: bool = Query(False, description="Use semantic search"),
    db: Session = Depends(get_db),
):
    """
    Search files by name or content

    Args:
        q: Search query
        page: Page number (1-based)
        per_page: Items per page (max 100)
        db: Database session

    Returns:
        Paginated list of matching files with metadata
    """
    try:
        if semantic:
            embeddings_service = EmbeddingsService(db)
            semantic_results = embeddings_service.semantic_search(q, k=per_page)
            file_ids = [result["file_id"] for result in semantic_results]
            
            query = db.query(FileModel).filter(FileModel.id.in_(file_ids))
            total = len(file_ids)
        else:
            query = db.query(FileModel).filter(FileModel.name.ilike(f"%{q}%"))
            total = query.count()

        offset = (page - 1) * per_page
        files = query.offset(offset).limit(per_page).all()

        return {
            "items": files,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching files: {str(e)}")


@router.get("/{file_id}", response_model=FileSchema)
def get_file(file_id: int, db: Session = Depends(get_db)):
    """
    Get file details by ID

    Args:
        file_id: ID of the file to retrieve
        db: Database session

    Returns:
        File details if found

    Raises:
        HTTPException: 404 if file not found
    """
    file = db.query(FileModel).filter(FileModel.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail=f"File with ID {file_id} not found")
    return file


@router.post("/embeddings/generate")
def generate_embeddings(
    file_ids: List[int] = Query(None, description="List of file IDs to generate embeddings for"),
    db: Session = Depends(get_db),
):
    """
    Generate embeddings for files
    """
    try:
        embeddings_service = EmbeddingsService(db)
        
        if not file_ids:
            # Get all files without embeddings
            files = db.query(FileModel).filter(FileModel.has_embeddings == False).all()
            file_ids = [f.id for f in files]

        # In a real implementation, this would be a Celery task
        for file_id in file_ids:
            file = db.query(FileModel).filter(FileModel.id == file_id).first()
            if file and file.extracted_content:
                embeddings_service.store_embedding(
                    file_id=file.id,
                    embedding=embeddings_service.generate_embedding(file.extracted_content.content)
                )
                file.has_embeddings = True
                db.commit()

        return {"message": f"Started generating embeddings for {len(file_ids)} files"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error generating embeddings: {str(e)}")


@router.get("/semantic/similar/{file_id}")
def find_similar_files(
    file_id: int,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Find semantically similar files
    """
    try:
        embeddings_service = EmbeddingsService(db)
        similar_files = embeddings_service.semantic_search(file_id, k=limit)
        
        return {
            "file_id": file_id,
            "similar_files": similar_files,
            "count": len(similar_files)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error finding similar files: {str(e)}")


@router.delete("/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db)):
    """
    Delete a file and its metadata

    Args:
        file_id: ID of the file to delete
        db: Database session

    Returns:
        Success message if deleted

    Raises:
        HTTPException: 404 if file not found
        HTTPException: 500 if deletion fails
    """
    file = db.query(FileModel).filter(FileModel.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail=f"File with ID {file_id} not found")

    try:
        # Delete physical file
        file_path = Path(file.path)
        if file_path.exists():
            file_path.unlink()

        # Delete database record
        db.delete(file)
        db.commit()

        return {"message": f"File {file_id} deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting file {file_id}: {str(e)}"
        )
