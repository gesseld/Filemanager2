from typing import Optional
import httpx
from fastapi import HTTPException
from datetime import datetime
from tenacity import retry, stop_after_attempt, wait_exponential
from circuitbreaker import circuit
from config import settings

class AISummarizationClient:
    def __init__(self):
        self.base_url = settings.AI_SUMMARIZATION_URL
        self.client = httpx.AsyncClient(
            timeout=settings.AI_SUMMARIZATION_TIMEOUT,
            headers={"Authorization": f"Bearer {settings.AI_SUMMARIZATION_API_KEY}"}
                   if settings.AI_SUMMARIZATION_API_KEY else None
        )

    @circuit(
        failure_threshold=settings.CIRCUIT_BREAKER_FAILURE_THRESHOLD,
        recovery_timeout=settings.CIRCUIT_BREAKER_RECOVERY_TIMEOUT
    )
    @retry(
        stop=stop_after_attempt(settings.AI_SUMMARIZATION_MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def summarize_text(self, text: str, max_length: Optional[int] = 150):
        try:
            response = await self.client.post(
                f"{self.base_url}/summarize",
                json={"text": text, "max_length": max_length}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Summarization service error: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Summarization failed: {str(e)}"
            )

    async def health_check(self):
        try:
            response = await self.client.get(f"{self.base_url}/health")
            response.raise_for_status()
            return response.json()
        except Exception:
            return {"status": "unhealthy"}

    async def close(self):
        await self.client.aclose()