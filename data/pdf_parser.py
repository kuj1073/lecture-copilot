import fitz

def parse_pdf(file_path):
    pages = []

    with fitz.open(file_path) as pdf:
        for page_num, page in enumerate(pdf, start=1):
            text = page.get_text("text")

            pages.append({
                "page": page_num,
                "text": text.strip()
            })

    return pages
