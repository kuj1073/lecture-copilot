
from pathlib import Path

from data.pdf_parser import parse_pdf
from data.ppt_parser import parse_ppt
from data.page_linker import PageLinker
from data.lecture_storage import LectureStorage


class LectureManager:
    def __init__(self, lecture_id, storage_folder="lecture_records"):
        self.lecture_id = lecture_id
        self.pages = []
        self.linker = PageLinker()
        self.storage = LectureStorage(storage_folder)

    def load_material(self, file_path):
        extension = Path(file_path).suffix.lower()

        if extension == ".pdf":
            self.pages = parse_pdf(file_path)
        elif extension == ".pptx":
            self.pages = parse_ppt(file_path)
        else:
            raise ValueError("Only PDF and PPTX are supported")

        return self.pages

    def set_page(self, page, timestamp=None):
        if self.pages and not (1 <= page <= len(self.pages)):
            raise ValueError("Invalid page number")

        self.linker.set_page(page, timestamp)

    def add_stt(self, text, timestamp=None):
        return self.linker.add_record("stt", text, timestamp)

    def add_memo(self, text, timestamp=None):
        return self.linker.add_record("memo", text, timestamp)

    def save(self):
        data = {
            "lecture_id": self.lecture_id,
            "pages": self.pages,
            "page_history": self.linker.page_history,
            "records": self.linker.records
        }
        return self.storage.save(self.lecture_id, data)

    def load(self):
        data = self.storage.load(self.lecture_id)
        self.pages = data["pages"]
        self.linker.page_history = data["page_history"]
        self.linker.records = data["records"]
        return data
