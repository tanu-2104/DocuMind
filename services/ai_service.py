import time
import socket
from google import genai
from google.genai import types
from config import GEMINI_API_KEY, GEMINI_MODEL

FALLBACK_MODEL = "gemini-3.1-flash-lite"
RETRY_DELAY = 2
MAX_ATTEMPTS = 2

client = genai.Client(
    api_key=GEMINI_API_KEY,
    http_options=types.HttpOptions(
        timeout=30000,
        retry_options=types.HttpRetryOptions(attempts=1)
    )
)


def is_retryable_error(error):
    error_text = str(error).upper()
    error_type = type(error).__name__.upper()

    retry_codes = [
        "429", "500", "502", "503", "504",
        "UNAVAILABLE", "RESOURCE_EXHAUSTED",
        "INTERNAL", "TIMEOUT", "TIMED OUT",
        "DEADLINE EXCEEDED"
    ]

    return (
        isinstance(error, (TimeoutError, socket.timeout))
        or any(code in error_text for code in retry_codes)
        or any(code in error_type for code in [
            "TIMEOUT", "READTIMEOUT", "CONNECTTIMEOUT"
        ])
    )


def generate_response(prompt):
    start_time = time.perf_counter()

    models = list(dict.fromkeys([
        GEMINI_MODEL,
        FALLBACK_MODEL
    ]))

    last_error = None

    for model in models:
        for attempt in range(1, MAX_ATTEMPTS + 1):
            try:
                print(
                    f"[DocuMind] Trying {model} "
                    f"(attempt {attempt}/{MAX_ATTEMPTS})",
                    flush=True
                )

                response = client.models.generate_content(
                    model=model,
                    contents=prompt
                )

                if not response.text:
                    raise ValueError("Gemini returned an empty response.")

                elapsed = time.perf_counter() - start_time

                print(
                    f"[DocuMind] Successful model: {model}",
                    flush=True
                )
                print(
                    f"[DocuMind] Response time: {elapsed:.2f} seconds",
                    flush=True
                )

                return response.text.strip()

            except Exception as error:
                last_error = error

                print(
                    f"[DocuMind] {model} failed: {error}",
                    flush=True
                )

                if not is_retryable_error(error):
                    raise RuntimeError(
                        f"AI service error: {error}"
                    ) from error

                if attempt < MAX_ATTEMPTS:
                    print(
                        f"[DocuMind] Retrying {model} "
                        f"after {RETRY_DELAY} seconds...",
                        flush=True
                    )
                    time.sleep(RETRY_DELAY)

        print(
            f"[DocuMind] Moving to next model if available.",
            flush=True
        )

    elapsed = time.perf_counter() - start_time

    print(
        f"[DocuMind] All attempts failed after {elapsed:.2f} seconds.",
        flush=True
    )

    raise RuntimeError(
        "Gemini is temporarily unavailable. "
        "Please try again shortly. Your uploaded document is safe."
    ) from last_error


def ask_question(document_text, question):
    if not document_text.strip():
        raise ValueError("Document text is empty.")

    if not question.strip():
        raise ValueError("Please enter a question.")

    prompt = f"""
You are DocuMind, a professional PDF assistant.

RULES:
- Answer using ONLY the information in the document.
- Never invent facts.
- If information is missing, say it is not mentioned.
- Use simple, clear language.
- Use valid Markdown formatting.
- When asked for tables, keep columns consistent.
- Use bullet points for lists.
- Use headings for longer answers.

DOCUMENT:
{document_text}

USER QUESTION:
{question}

ANSWER:
"""

    return generate_response(prompt)


def ask_general_question(question):
    if not question.strip():
        raise ValueError("Please enter a question.")

    prompt = f"""
You are DocuMind, a helpful and intelligent AI assistant.

Answer using your general knowledge.
Explain concepts in simple, clear language.
Use headings, bullet points, and Markdown tables when useful.
For learning roadmaps, provide practical step-by-step guidance.
For coding questions, provide beginner-friendly explanations.
Do not pretend that general knowledge comes from an uploaded PDF.
If uncertain, say so honestly.

USER QUESTION:
{question}

ANSWER:
"""

    return generate_response(prompt)
