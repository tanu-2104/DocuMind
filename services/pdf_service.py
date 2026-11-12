import pymupdf


def extract_text(pdf_path):
    try:
        document = pymupdf.open(pdf_path)
        pages_text = []

        for page_number, page in enumerate(document, start=1):
            text = page.get_text().strip()

            if text:
                pages_text.append(
                    f"Page {page_number}:\n{text}"
                )

        document.close()

        if not pages_text:
            raise ValueError(
                "No readable text found in this PDF."
            )

        return "\n\n".join(pages_text)

    except Exception as error:
        raise ValueError(
            f"Could not process PDF: {error}"
        )

def extract_text_from_bytes(pdf_bytes):
    """Extract text directly from PDF bytes."""
    import pymupdf

    document = pymupdf.open(stream=pdf_bytes, filetype="pdf")

    try:
        text = "\n".join(page.get_text() for page in document)

        if not text.strip():
            raise ValueError("This PDF contains no extractable text.")

        return text
    finally:
        document.close()

