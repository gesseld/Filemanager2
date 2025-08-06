from typing import List, Dict, Optional
import httpx
from fastapi import HTTPException
from tenacity import retry, stop_after_attempt, wait_exponential
from circuitbreaker import circuit
from config import settings

class AutoTaggingClient:
    def __init__(self):
        self.base_url = settings.AUTO_TAGGING_URL
        self.client = httpx.AsyncClient(
            timeout=settings.AUTO_TAGGING_TIMEOUT,
            headers={"Authorization": f"Bearer {settings.AUTO_TAGGING_API_KEY}"}
                   if settings.AUTO_TAGGING_API_KEY else None
        )

    @circuit(
        failure_threshold=settings.CIRCUIT_BREAKER_FAILURE_THRESHOLD,
        recovery_timeout=settings.CIRCUIT_BREAKER_RECOVERY_TIMEOUT
    )
    @retry(
        stop=stop_after_attempt(settings.AUTO_TAGGING_MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def generate_tags(self, text: str, candidate_labels: List[str]) -> Dict[str, float]:
        try:
            response = await self.client.post(
                f"{self.base_url}/generate-tags",
                json={"text": text, "candidate_labels": candidate_labels}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Tagging service error: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Tag generation failed: {str(e)}"
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