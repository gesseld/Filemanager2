import os
import logging
import mimetypes
from typing import Optional, Dict, Any
import requests
from requests.exceptions import RequestException, Timeout, ConnectionError

from config import settings
from utils.error_handlers import (
    retry_with_backoff,
    handle_tika_errors,
    handle_file_errors,
    tika_circuit_breaker,
)

logger = logging.getLogger(__name__)


class TikaService:
    """Service for interacting with Apache Tika for content extraction"""

    def __init__(self, tika_url: str = None):
        self.tika_url = tika_url or settings.TIKA_SERVER_URL
        self.timeout = 300  # 5 minutes timeout

    @retry_with_backoff(max_retries=3, base_delay=2.0)
    @handle_tika_errors
    @handle_file_errors
    def extract_text(self, file_path: str) -> Optional[str]:
        """
        Extract text content from a file using Apache Tika

        Args:
            file_path: Path to the file to extract text from

        Returns:
            Extracted text content or None if extraction fails
        """

        def _extract():
            # Determine content type
            content_type, _ = mimetypes.guess_type(file_path)
            if not content_type:
                content_type = "application/octet-stream"

            with open(file_path, "rb") as file:
                response = requests.put(
                    self.tika_url,
                    data=file,
                    headers={"Accept": "text/plain", "Content-Type": content_type},
                    timeout=self.timeout,
                )

            if response.status_code == 200:
                content = response.text.strip()
                logger.info(f"Successfully extracted {len(content)} characters from {file_path}")
                return content
            else:
                logger.error(f"Tika extraction failed: {response.status_code} - {response.text}")
                return None

        return tika_circuit_breaker.call(_extract)

    def extract_metadata(self, file_path: str) -> Optional[Dict[str, Any]]:
        """
        Extract metadata from a file using Apache Tika

        Args:
            file_path: Path to the file to extract metadata from

        Returns:
            Dictionary containing file metadata or None if extraction fails
        """
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            return None

        try:
            # Use Tika metadata endpoint
            metadata_url = self.tika_url.replace("/tika", "/meta")

            content_type, _ = mimetypes.guess_type(file_path)
            if not content_type:
                content_type = "application/octet-stream"

            with open(file_path, "rb") as file:
                response = requests.put(
                    metadata_url,
                    data=file,
                    headers={"Accept": "application/json", "Content-Type": content_type},
                    timeout=self.timeout,
                )

            if response.status_code == 200:
                metadata = response.json()
                logger.info(f"Successfully extracted metadata from {file_path}")
                return metadata
            else:
                logger.error(
                    f"Tika metadata extraction failed: {response.status_code} - {response.text}"
                )
                return None

        except Timeout:
            logger.error(f"Timeout while extracting metadata from {file_path}")
            return None
        except ConnectionError:
            logger.error(f"Connection error to Tika server at {metadata_url}")
            return None
        except RequestException as e:
            logger.error(f"Request error during metadata extraction: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during metadata extraction: {str(e)}")
            return None

    def extract_text_and_metadata(self, file_path: str) -> Optional[Dict[str, Any]]:
        """
        Extract both text content and metadata from a file

        Args:
            file_path: Path to the file to extract from

        Returns:
            Dictionary containing both text content and metadata
        """
        text = self.extract_text(file_path)
        metadata = self.extract_metadata(file_path)

        return {"text": text, "metadata": metadata}

    def is_tika_available(self) -> bool:
        """Check if Tika server is available"""
        try:
            response = requests.get(self.tika_url.replace("/tika", "/version"), timeout=10)
            return response.status_code == 200
        except Exception:
            return False

    def get_supported_types(self) -> Optional[list]:
        """Get list of supported MIME types from Tika"""
        try:
            response = requests.get(self.tika_url.replace("/tika", "/mime-types"), timeout=10)
            if response.status_code == 200:
                return response.json()
            return None
        except Exception:
            return None


# Global instance
tika_service = TikaService()
