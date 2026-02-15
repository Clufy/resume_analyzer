# db.py
from supabase import create_client

from app.core.config import settings

# ------------------------
# Supabase setup
# ------------------------
supabase = create_client(settings.supabase_url, settings.supabase_key)


# ------------------------
# FastAPI dependency
# ------------------------
async def get_db():
    """
    FastAPI dependency that yields the Supabase client.
    Works like an async session for your routes.
    """
    try:
        yield supabase
    finally:
        # Supabase client doesn't need explicit closing
        pass
