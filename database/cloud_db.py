from database.supabase_client import get_supabase


def add_document(filename, stored_filename, extracted_text):
    client = get_supabase()

    result = client.table("documents").insert({
        "filename": filename,
        "stored_filename": stored_filename,
        "extracted_text": extracted_text
    }).execute()

    return result.data[0]["id"]


def get_document(document_id):
    client = get_supabase()

    result = (
        client.table("documents")
        .select("*")
        .eq("id", document_id)
        .limit(1)
        .execute()
    )

    return result.data[0] if result.data else None


def update_extracted_text(document_id, extracted_text):
    client = get_supabase()

    client.table("documents").update({
        "extracted_text": extracted_text
    }).eq("id", document_id).execute()


def add_chat_message(document_id, question, answer):
    client = get_supabase()

    client.table("chat_history").insert({
        "document_id": document_id,
        "question": question,
        "answer": answer
    }).execute()
