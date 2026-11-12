import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip()
SECRET_KEY = os.getenv("SECRET_KEY", "").strip()

UPLOAD_FOLDER = BASE_DIR / "uploads"
DATABASE_PATH = BASE_DIR / "database" / "documind.db"

MAX_CONTENT_LENGTH = 20 * 1024 * 1024

if not GEMINI_API_KEY:
    raise RuntimeError("Gemini API key is missing. Check your .env file.")

if not SECRET_KEY:
    raise RuntimeError("Flask SECRET_KEY is missing. Check your .env file.")

UPLOAD_FOLDER.mkdir(exist_ok=True)
DATABASE_PATH.parent.mkdir(exist_ok=True)
