import logging
import functools
import time
from typing import Any, Callable, Optional, Type
from sqlalchemy.exc import SQLAlchemyError
from requests.exceptions import RequestException, ConnectionError, Timeout
from celery.exceptions import MaxRetriesExceededError, Retry

logger = logging.getLogger(__name__)


class ExtractionError(Exception):
    """Base exception for content extraction errors"""

    pass


class TikaConnectionError(ExtractionError):
    """Error connecting to Tika server"""

    pass


class FileProcessingError(ExtractionError):
    """Error processing file content"""

    pass


class DatabaseError(ExtractionError):
    """Database operation error"""

    pass


class RetryableError(ExtractionError):
    """Error that can be retried"""

    pass


class NonRetryableError(ExtractionError):
    """Error that should not be retried"""

    pass


def retry_with_backoff(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    jitter: bool = True,
) -> Callable:
    """
    Decorator for retrying functions with exponential backoff

    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Base delay in seconds
        max_delay: Maximum delay in seconds
        exponential_base: Base for exponential calculation
        jitter: Add random jitter to delay
    """

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None

            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except (TikaConnectionError, RequestException, ConnectionError, Timeout) as e:
                    last_exception = e

                    if attempt == max_retries:
                        logger.error(f"Max retries ({max_retries}) exceeded for {func.__name__}")
                        raise RetryableError(f"Failed after {max_retries} attempts: {str(e)}")

                    # Calculate delay with exponential backoff
                    delay = min(base_delay * (exponential_base**attempt), max_delay)

                    if jitter:
                        import random

                        delay = delay * (0.5 + random.random() * 0.5)

                    logger.warning(
                        f"Retry attempt {attempt + 1}/{max_retries} for {func.__name__} "
                        f"after {delay:.2f}s delay: {str(e)}"
                    )

                    time.sleep(delay)

                except (NonRetryableError, ValueError, TypeError) as e:
                    # Don't retry non-retryable errors
                    logger.error(f"Non-retryable error in {func.__name__}: {str(e)}")
                    raise NonRetryableError(str(e))

                except Exception as e:
                    # Log unexpected errors
                    logger.error(f"Unexpected error in {func.__name__}: {str(e)}")
                    raise ExtractionError(str(e))

            raise last_exception

        return wrapper

    return decorator


def handle_database_errors(func: Callable) -> Callable:
    """Decorator for handling database errors"""

    @functools.wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        try:
            return func(*args, **kwargs)
        except SQLAlchemyError as e:
            logger.error(f"Database error in {func.__name__}: {str(e)}")
            raise DatabaseError(f"Database operation failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in {func.__name__}: {str(e)}")
            raise DatabaseError(str(e))

    return wrapper


def handle_tika_errors(func: Callable) -> Callable:
    """Decorator for handling Tika-related errors"""

    @functools.wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        try:
            return func(*args, **kwargs)
        except ConnectionError as e:
            logger.error(f"Tika connection error in {func.__name__}: {str(e)}")
            raise TikaConnectionError(f"Failed to connect to Tika server: {str(e)}")
        except Timeout as e:
            logger.error(f"Tika timeout error in {func.__name__}: {str(e)}")
            raise TikaConnectionError(f"Tika server timeout: {str(e)}")
        except RequestException as e:
            logger.error(f"Tika request error in {func.__name__}: {str(e)}")
            raise TikaConnectionError(f"Tika request failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected Tika error in {func.__name__}: {str(e)}")
            raise ExtractionError(str(e))

    return wrapper


def handle_file_errors(func: Callable) -> Callable:
    """Decorator for handling file processing errors"""

    @functools.wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        try:
            return func(*args, **kwargs)
        except FileNotFoundError as e:
            logger.error(f"File not found in {func.__name__}: {str(e)}")
            raise NonRetryableError(f"File not found: {str(e)}")
        except PermissionError as e:
            logger.error(f"Permission error in {func.__name__}: {str(e)}")
            raise NonRetryableError(f"Permission denied: {str(e)}")
        except OSError as e:
            logger.error(f"OS error in {func.__name__}: {str(e)}")
            raise FileProcessingError(f"File processing failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected file error in {func.__name__}: {str(e)}")
            raise FileProcessingError(str(e))

    return wrapper


class ErrorHandler:
    """Centralized error handling for the application"""

    @staticmethod
    def log_error(error: Exception, context: Optional[Dict[str, Any]] = None):
        """Log error with context"""
        error_info = {
            "error_type": type(error).__name__,
            "error_message": str(error),
            "context": context or {},
        }
        logger.error(f"Application error: {error_info}")

    @staticmethod
    def is_retryable(error: Exception) -> bool:
        """Determine if an error is retryable"""
        retryable_types = (
            TikaConnectionError,
            ConnectionError,
            Timeout,
            RequestException,
            RetryableError,
        )
        return isinstance(error, retryable_types)

    @staticmethod
    def get_error_response(error: Exception) -> Dict[str, Any]:
        """Get standardized error response"""
        error_type = type(error).__name__

        if isinstance(error, TikaConnectionError):
            return {
                "error": "TikaConnectionError",
                "message": "Content extraction service unavailable",
                "details": str(error),
                "retryable": True,
            }
        elif isinstance(error, FileProcessingError):
            return {
                "error": "FileProcessingError",
                "message": "Failed to process file",
                "details": str(error),
                "retryable": False,
            }
        elif isinstance(error, DatabaseError):
            return {
                "error": "DatabaseError",
                "message": "Database operation failed",
                "details": str(error),
                "retryable": True,
            }
        else:
            return {
                "error": error_type,
                "message": "An unexpected error occurred",
                "details": str(error),
                "retryable": ErrorHandler.is_retryable(error),
            }


class CircuitBreaker:
    """Circuit breaker pattern for handling external service failures"""

    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half-open

    def call(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection"""
        if self.state == "open":
            if self._should_attempt_reset():
                self.state = "half-open"
            else:
                raise TikaConnectionError("Circuit breaker is open")

        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise

    def _should_attempt_reset(self) -> bool:
        """Check if we should attempt to reset the circuit"""
        if self.last_failure_time is None:
            return True

        import time

        return (time.time() - self.last_failure_time) >= self.recovery_timeout

    def _on_success(self):
        """Handle successful call"""
        self.failure_count = 0
        self.state = "closed"

    def _on_failure(self):
        """Handle failed call"""
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.failure_count >= self.failure_threshold:
            self.state = "open"
            logger.error(f"Circuit breaker opened after {self.failure_count} failures")


# Global circuit breaker for Tika service
tika_circuit_breaker = CircuitBreaker(failure_threshold=3, recovery_timeout=30)
