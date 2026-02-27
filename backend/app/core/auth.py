import hmac
from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader
from app.core.config import settings

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def get_api_key(api_key: str | None = Security(api_key_header)):
    """Validate X-API-Key using constant-time comparison to prevent timing attacks."""
    if api_key and hmac.compare_digest(api_key, settings.api_key.get_secret_value()):
        return api_key
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing API key",
        headers={"WWW-Authenticate": "ApiKey"},
    )
