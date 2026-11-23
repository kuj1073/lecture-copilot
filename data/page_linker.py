
from datetime import datetime, timezone


class PageLinker:
    def __init__(self):
        self.page_history = []
        self.records = []

    def set_page(self, page, timestamp=None):
        if timestamp is None:
            timestamp = datetime.now(timezone.utc).timestamp()

        if page < 1:
            raise ValueError("Page must be at least 1")

        self.page_history.append({
            "page": page,
            "timestamp": timestamp
        })
        self.page_history.sort(key=lambda x: x["timestamp"])

    def get_page_at(self, timestamp):
        page = None

        for entry in self.page_history:
            if entry["timestamp"] <= timestamp:
                page = entry["page"]
            else:
                break

        return page

    def add_record(self, kind, text, timestamp=None):
        if timestamp is None:
            timestamp = datetime.now(timezone.utc).timestamp()

        record = {
            "type": kind,
            "text": text,
            "timestamp": timestamp,
            "page": self.get_page_at(timestamp)
        }

        self.records.append(record)
        return record
