import uuid
import traceback

from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename

from config import (
    SECRET_KEY,
    UPLOAD_FOLDER,
    MAX_CONTENT_LENGTH,
    STORAGE_MODE,
    CLOUD_MODE
)

from database.db import init_db, get_connection
from database.cloud_db import (
    add_document,
    get_document,
    update_extracted_text,
    add_chat_message
)

from services.storage_service import (
    create_signed_upload_url,
    download_pdf,
    delete_pdf
)

from services.pdf_service import extract_text, extract_text_from_bytes
from services.chat_service import chat_with_pdf
from services.ai_service import ask_general_question


app = Flask(__name__)
app.secret_key = SECRET_KEY
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

ALLOWED_EXTENSIONS = {"pdf"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def valid_cloud_filename(stored_filename):
    if not isinstance(stored_filename, str) or not stored_filename.endswith(".pdf"):
        return False

    try:
        filename_id = stored_filename[:-4]
        return uuid.UUID(hex=filename_id).hex == filename_id
    except (ValueError, AttributeError):
        return False


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/upload-mode", methods=["GET"])
def upload_mode():
    return jsonify({"mode": STORAGE_MODE})


@app.route("/create-upload", methods=["POST"])
def create_upload():
    if not CLOUD_MODE:
        return jsonify({"error": "Cloud uploads are not enabled."}), 400

    data = request.get_json(silent=True) or {}
    original_filename = secure_filename(data.get("filename", "").strip())

    if not original_filename:
        return jsonify({"error": "Please provide a valid filename."}), 400

    if not allowed_file(original_filename):
        return jsonify({"error": "Only PDF files are allowed."}), 400

    stored_filename = f"{uuid.uuid4().hex}.pdf"

    try:
        upload_data = create_signed_upload_url(stored_filename)

        if not upload_data.get("signed_url"):
            raise RuntimeError("Could not create a signed upload URL.")

        return jsonify({
            "signed_url": upload_data["signed_url"],
            "stored_filename": stored_filename,
            "filename": original_filename
        })

    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Could not prepare the cloud upload."}), 500


@app.route("/complete-upload", methods=["POST"])
def complete_upload():
    if not CLOUD_MODE:
        return jsonify({"error": "Cloud uploads are not enabled."}), 400

    data = request.get_json(silent=True) or {}

    original_filename = secure_filename(data.get("filename", "").strip())
    stored_filename = data.get("stored_filename", "")

    if not original_filename or not allowed_file(original_filename):
        return jsonify({"error": "Invalid PDF filename."}), 400

    if not valid_cloud_filename(stored_filename):
        return jsonify({"error": "Invalid upload reference."}), 400

    try:
        pdf_bytes = download_pdf(stored_filename)

        if not pdf_bytes:
            return jsonify({"error": "Uploaded PDF could not be found."}), 404

        if len(pdf_bytes) > MAX_CONTENT_LENGTH:
            delete_pdf(stored_filename)
            return jsonify({"error": "PDF is too large. Maximum size is 20 MB."}), 413

        if b"%PDF-" not in pdf_bytes[:1024]:
            delete_pdf(stored_filename)
            return jsonify({"error": "The uploaded file is not a valid PDF."}), 400

        document_text = extract_text_from_bytes(pdf_bytes)

        document_id = add_document(
            original_filename,
            stored_filename,
            document_text
        )

        return jsonify({
            "message": "PDF uploaded successfully!",
            "document_id": document_id,
            "filename": original_filename
        })

    except ValueError as error:
        traceback.print_exc()
        try:
            delete_pdf(stored_filename)
        except Exception:
            pass
        return jsonify({"error": str(error)}), 400

    except Exception:
        traceback.print_exc()
        return jsonify({"error": "PDF processing failed. Please try again."}), 500


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
        if CLOUD_MODE:
            document = get_document(document_id)

            if not document:
                return jsonify({"error": "Document not found."}), 404

            document_text = document.get("extracted_text")

            if not document_text:
                pdf_bytes = download_pdf(document["stored_filename"])
                document_text = extract_text_from_bytes(pdf_bytes)
                update_extracted_text(document_id, document_text)

        else:
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

        if CLOUD_MODE:
            add_chat_message(document_id, question, answer)
        else:
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
    if not CLOUD_MODE:
        init_db()

    app.run(debug=True)
