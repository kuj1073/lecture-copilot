from data.pdf_parser import parse_pdf

pages = parse_pdf("data/sample.pdf")

for page in pages:
    print("페이지:", page["page"])
    print("내용:", page["text"])
    print("----------------")
