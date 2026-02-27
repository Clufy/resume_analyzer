# db.py
from supabase import create_client

from app.core.config import settings

# ------------------------
# Supabase setup
# ------------------------
supabase = create_client(settings.supabase_url, settings.supabase_key.get_secret_value())


# ------------------------
# FastAPI dependency
# ------------------------
async def get_db():
    yield supabase
