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
