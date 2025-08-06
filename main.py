from fastapi import FastAPI, Request, status, Depends
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
import logging
from contextlib import asynccontextmanager
from config import settings, Base, SQLALCHEMY_DATABASE_URL
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import os

# Configure logger
logger = logging.getLogger(__name__)

# Database setup
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting application")
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown
    logger.info("Shutting down application")
    engine.dispose()

app = FastAPI(
    title="File Manager API",
    description="A FastAPI application for file management",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Custom error handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder({"detail": exc.errors(), "body": exc.body}),
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal Server Error"},
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "File Manager API is running"}

# Basic API endpoints
@app.get("/")
async def root():
    return {"message": "Welcome to File Manager API"}

@app.get("/api/files")
async def list_files(db: Session = Depends(get_db)):
    # Placeholder for file listing
    return {"files": []}