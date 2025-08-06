from pathlib import Path
import magic
from fastapi import UploadFile


def validate_file_type(content_type: str, allowed_types: list[str]) -> bool:
    """Validate file MIME type against allowed types.

    Args:
        content_type: The file's MIME type
        allowed_types: List of allowed MIME types

    Returns:
        True if valid, False otherwise
    """
    return content_type in allowed_types


async def save_upload_file(upload_file: UploadFile, filename: str) -> Path:
    """Securely save an uploaded file to the uploads directory.

    Args:
        upload_file: The uploaded file
        filename: Target filename (should be generated UUID)

    Returns:
        Path to saved file

    Raises:
        IOError: If file cannot be saved
    """
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)

    file_path = upload_dir / filename

    # Securely write file
    try:
        with open(file_path, "wb") as f:
            while contents := await upload_file.read(1024 * 1024):  # 1MB chunks
                f.write(contents)
    except Exception as e:
        if file_path.exists():
            file_path.unlink()  # Clean up partial file
        raise IOError(f"Failed to save file: {str(e)}")

    return file_path


def extract_metadata(file_path: Path) -> dict:
    """Extract metadata from file.

    Args:
        file_path: Path to the file

    Returns:
        Dictionary with file metadata (mime_type and size)
    """
    mime = magic.Magic(mime=True)
    return {"mime_type": mime.from_file(str(file_path)), "size": file_path.stat().st_size}
