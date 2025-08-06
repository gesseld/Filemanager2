from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from contextlib import asynccontextmanager
import logging
import os

from config import engine, SessionLocal
from models.file import File
from models.content_extraction import (
    ExtractedContent,
    SearchIndex,
    ExtractionTask
)
from routers.files import router as files_router
from routers.content_extraction import router as content_extraction_router
from routers.similarity import router as similarity_router
from security.middleware import APIKeyAuthMiddleware

# Configure logger
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting application")
    File.metadata.create_all(bind=engine)
    ExtractedContent.metadata.create_all(bind=engine)
    SearchIndex.metadata.create_all(bind=engine)
    ExtractionTask.metadata.create_all(bind=engine)
    yield
    # Shutdown
    logger.info("Shutting down application")
    engine.dispose()


app = FastAPI(
    title="File Manager API",
    description="A FastAPI application for file management with "
               "logging, validation, and error handling",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware - must be added before other middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Add security middleware
app.add_middleware(APIKeyAuthMiddleware, api_key=os.getenv("API_KEY", "dev-key"))


# Custom error handlers for enhanced error handling
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error on {request.url}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder({
            "detail": exc.errors(),
            "body": exc.body
        }),
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected error on {request.url}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal Server Error"},
    )


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Include routers
app.include_router(files_router)
app.include_router(content_extraction_router)
app.include_router(similarity_router)


@app.get("/health")
def health_check():
    logger.info("Health check requested")
    return {"status": "healthy", "message": "File Manager API is running"}


@app.get("/")
def read_root():
    logger.info("Root endpoint accessed")
    return {"message": "Welcome to FastAPI File Manager", "version": "1.0.0"}
