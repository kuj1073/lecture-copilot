
import json
from pathlib import Path


class LectureStorage:
    def __init__(self, folder="lecture_records"):
        self.folder = Path(folder)
        self.folder.mkdir(parents=True, exist_ok=True)

    def save(self, lecture_id, records):
        path = self.folder / f"{lecture_id}.json"

        with open(path, "w", encoding="utf-8") as f:
            json.dump(records, f, ensure_ascii=False, indent=2)

        return str(path)

    def load(self, lecture_id):
        path = self.folder / f"{lecture_id}.json"

        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
