from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import uuid
from pathlib import Path
from typing import Optional

from models.file import File as FileModel
from schemas.file import File as FileSchema, PaginatedFiles
from utils.file_handling import validate_file_type, save_upload_file
from config import SessionLocal


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


router = APIRouter(prefix="/files", tags=["files"])

# Configure upload settings
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf", "text/plain"]


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
