from database.supabase_client import get_supabase

BUCKET_NAME = "documind-pdfs"


def upload_pdf(stored_filename, file_bytes):
    client = get_supabase()
    client.storage.from_(BUCKET_NAME).upload(
        path=stored_filename,
        file=file_bytes,
        file_options={
            "content-type": "application/pdf",
            "upsert": "false"
        }
    )
    return stored_filename


def download_pdf(stored_filename):
    client = get_supabase()
    return client.storage.from_(BUCKET_NAME).download(stored_filename)


def delete_pdf(stored_filename):
    client = get_supabase()
    return client.storage.from_(BUCKET_NAME).remove([stored_filename])


def create_signed_upload_url(stored_filename):
    client = get_supabase()
    response = client.storage.from_(BUCKET_NAME).create_signed_upload_url(
        stored_filename
    )

    return {
        "signed_url": response.get("signedURL") or response.get("signed_url"),
        "token": response.get("token"),
        "path": response.get("path") or stored_filename
    }
