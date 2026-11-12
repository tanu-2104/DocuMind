import time
from google import genai
from google.genai import types
from config import GEMINI_API_KEY, GEMINI_MODEL

# Disable automatic SDK retries and set a 30-second timeout.
client = genai.Client(
    api_key=GEMINI_API_KEY,
    http_options=types.HttpOptions(
        timeout=30000,
        retry_options=types.HttpRetryOptions(attempts=1)
    )
)


def generate_response(prompt):
    start_time = time.perf_counter()

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt
        )

        if not response.text:
            raise ValueError("Gemini returned an empty response.")

        elapsed = time.perf_counter() - start_time
        print(
            f"[DocuMind] Gemini response time: {elapsed:.2f} seconds",
            flush=True
        )

        return response.text.strip()

    except Exception as error:
        elapsed = time.perf_counter() - start_time
        print(f"[DocuMind] Original Gemini error: {error}", flush=True)
        error_text = str(error).upper()

        print(
            f"[DocuMind] Request failed after {elapsed:.2f} seconds.",
            flush=True
        )

        retryable = any(code in error_text for code in [
            "429", "500", "502", "503", "504",
            "UNAVAILABLE", "RESOURCE_EXHAUSTED", "INTERNAL"
        ])

        if retryable:
            raise RuntimeError(
                "Gemini is temporarily busy. Please try again shortly. "
                "Your uploaded document is safe."
            ) from error

        raise RuntimeError(
            f"AI service error: {error}"
        ) from error


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

