
from pptx import Presentation

def parse_ppt(file_path):
    pages = []

    prs = Presentation(file_path)

    for page_num, slide in enumerate(prs.slides, start=1):
        texts = []

        for shape in slide.shapes:
            if shape.has_text_frame:
                texts.append(shape.text.strip())

            if shape.has_table:
                for row in shape.table.rows:
                    for cell in row.cells:
                        texts.append(cell.text.strip())

        pages.append({
            "page": page_num,
            "text": "\n".join(t for t in texts if t)
        })

    return pages
