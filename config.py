import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip()
SECRET_KEY = os.getenv("SECRET_KEY", "").strip()

# Storage configuration
STORAGE_MODE = os.getenv("STORAGE_MODE", "local").strip().lower()

if STORAGE_MODE not in {"local", "cloud"}:
    raise RuntimeError("STORAGE_MODE must be either 'local' or 'cloud'.")

CLOUD_MODE = STORAGE_MODE == "cloud"

# Local storage uses project folders.
# Cloud mode uses Vercel's writable temporary directory.
if CLOUD_MODE:
    RUNTIME_DIR = Path("/tmp/documind")
else:
    RUNTIME_DIR = BASE_DIR

UPLOAD_FOLDER = RUNTIME_DIR / "uploads"
DATABASE_PATH = RUNTIME_DIR / "database" / "documind.db"

MAX_CONTENT_LENGTH = 20 * 1024 * 1024

if not GEMINI_API_KEY:
    raise RuntimeError("Gemini API key is missing. Check your environment variables.")

if not SECRET_KEY:
    raise RuntimeError("Flask SECRET_KEY is missing. Check your environment variables.")

# Create directories only in the writable runtime location.
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
