from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Optional


class APIKeyAuthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, api_key: str):
        super().__init__(app)
        self.api_key = api_key

    async def dispatch(self, request: Request, call_next):
        # Allow access to public endpoints without API key
        public_paths = ["/health", "/docs", "/openapi.json", "/", "/favicon.ico"]

        # Allow GET requests to files endpoints for browsing
        if request.url.path in public_paths or (
            request.method == "GET" and request.url.path.startswith("/files")
        ):
            return await call_next(request)

        # Require API key for POST, PUT, DELETE operations
        api_key: Optional[str] = request.headers.get("x-api-key")
        if not api_key or api_key != self.api_key:
            raise HTTPException(status_code=401, detail="Invalid or missing API Key")
        return await call_next(request)
