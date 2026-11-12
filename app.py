import uuid
import traceback

from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename

from config import SECRET_KEY, UPLOAD_FOLDER, MAX_CONTENT_LENGTH
from database.db import init_db, get_connection
from services.pdf_service import extract_text
from services.chat_service import chat_with_pdf
from services.ai_service import ask_general_question


app = Flask(__name__)
app.secret_key = SECRET_KEY
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

ALLOWED_EXTENSIONS = {"pdf"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload_pdf():
    if "file" not in request.files:
        return jsonify({"error": "No file selected."}), 400

    file = request.files["file"]

    if not file.filename:
        return jsonify({"error": "Please select a PDF."}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Only PDF files are allowed."}), 400

    original_filename = secure_filename(file.filename)
    stored_filename = f"{uuid.uuid4().hex}.pdf"
    file_path = UPLOAD_FOLDER / stored_filename

    try:
        file.save(file_path)
        document_text = extract_text(str(file_path))

        with get_connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO documents
                (filename, stored_filename, extracted_text)
                VALUES (?, ?, ?)
                """,
                (original_filename, stored_filename, document_text)
            )
            document_id = cursor.lastrowid

        return jsonify({
            "message": "PDF uploaded successfully!",
            "document_id": document_id,
            "filename": original_filename
        })

    except Exception as error:
        traceback.print_exc()
        file_path.unlink(missing_ok=True)
        return jsonify({"error": str(error)}), 500


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}

    document_id = data.get("document_id")
    question = data.get("question", "").strip()

    if not document_id or not question:
        return jsonify({
            "error": "Document and question are required."
        }), 400

    try:
        with get_connection() as conn:
            document = conn.execute(
                "SELECT * FROM documents WHERE id = ?",
                (document_id,)
            ).fetchone()

        if not document:
            return jsonify({"error": "Document not found."}), 404

        document_text = document["extracted_text"]

        if not document_text:
            pdf_path = UPLOAD_FOLDER / document["stored_filename"]

            if not pdf_path.is_file():
                return jsonify({"error": "Uploaded PDF file not found."}), 404

            document_text = extract_text(str(pdf_path))

            with get_connection() as conn:
                conn.execute(
                    "UPDATE documents SET extracted_text = ? WHERE id = ?",
                    (document_text, document_id)
                )

        answer = chat_with_pdf(document_text, question)

        with get_connection() as conn:
            conn.execute(
                """
                INSERT INTO chat_history (document_id, question, answer)
                VALUES (?, ?, ?)
                """,
                (document_id, question, answer)
            )

        return jsonify({"answer": answer})

    except Exception as error:
        traceback.print_exc()
        return jsonify({"error": str(error)}), 500


@app.route("/general-chat", methods=["POST"])
def general_chat():
    data = request.get_json(silent=True) or {}
    question = data.get("question", "").strip()

    if not question:
        return jsonify({"error": "Please enter a question."}), 400

    try:
        answer = ask_general_question(question)
        return jsonify({"answer": answer})

    except RuntimeError as error:
        traceback.print_exc()

        message = str(error)

        if "temporarily busy" in message.lower():
            return jsonify({
                "error": "Gemini is temporarily busy. Please wait a moment and try your question again.",
                "retryable": True
            }), 503

        return jsonify({"error": message}), 500

    except Exception as error:
        traceback.print_exc()
        return jsonify({"error": str(error)}), 500


@app.errorhandler(413)
def file_too_large(error):
    return jsonify({
        "error": "PDF is too large. Maximum size is 20 MB."
    }), 413


if __name__ == "__main__":
    init_db()
    app.run(debug=True)

