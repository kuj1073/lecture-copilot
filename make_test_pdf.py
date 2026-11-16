import fitz

pdf = fitz.open()

for i in range(1, 4):
    page = pdf.new_page()
    page.insert_text(
        (50, 50),
        f"Lecture page {i}"
    )

pdf.save("data/sample.pdf")
pdf.close()

print("PDF 생성 완료")
