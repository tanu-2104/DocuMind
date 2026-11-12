import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY", "").strip()

supabase = None

if SUPABASE_URL and SUPABASE_SECRET_KEY:
    supabase = create_client(
        SUPABASE_URL,
        SUPABASE_SECRET_KEY
    )


def get_supabase():
    if supabase is None:
        raise RuntimeError(
            "Supabase credentials are missing. Check environment variables."
        )

    return supabase
