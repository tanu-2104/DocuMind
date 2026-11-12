from services.pdf_service import extract_text
from services.ai_service import ask_question


def chat_with_pdf(document_text, question):
    return ask_question(document_text, question)
