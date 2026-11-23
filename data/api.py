
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Literal

from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel

from data.lecture_manager import LectureManager

app = FastAPI(title="Lecture Copilot API")

managers = {}


class PageRequest(BaseModel):
    page: int
    timestamp: float


class RecordRequest(BaseModel):
    text: str
    timestamp: float


def get_manager(lecture_id):
    if lecture_id not in managers:
        raise HTTPException(
            status_code=404,
            detail="Lecture not found"
        )
    return managers[lecture_id]


@app.post("/lectures/{lecture_id}")
def create_lecture(lecture_id: str):
    if lecture_id in managers:
        raise HTTPException(409, "Lecture already exists")

    managers[lecture_id] = LectureManager(lecture_id)
    return {"lecture_id": lecture_id, "status": "created"}


@app.post("/lectures/{lecture_id}/material")
async def upload_material(
    lecture_id: str,
    file: UploadFile = File(...)
):
    manager = get_manager(lecture_id)

    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in (".pdf", ".pptx"):
        raise HTTPException(400, "Only PDF and PPTX supported")

    with TemporaryDirectory() as folder:
        path = Path(folder) / f"material{suffix}"
        path.write_bytes(await file.read())

        try:
            pages = manager.load_material(str(path))
        except Exception as exc:
            raise HTTPException(400, "Invalid material") from exc

    return {"pages": pages}


@app.post("/lectures/{lecture_id}/page")
def change_page(lecture_id: str, request: PageRequest):
    manager = get_manager(lecture_id)

    try:
        manager.set_page(request.page, request.timestamp)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc

    return {"status": "ok", "page": request.page}


@app.post("/lectures/{lecture_id}/stt")
def add_stt(lecture_id: str, request: RecordRequest):
    manager = get_manager(lecture_id)
    return manager.add_stt(request.text, request.timestamp)


@app.post("/lectures/{lecture_id}/memo")
def add_memo(lecture_id: str, request: RecordRequest):
    manager = get_manager(lecture_id)
    return manager.add_memo(request.text, request.timestamp)


@app.post("/lectures/{lecture_id}/save")
def save_lecture(lecture_id: str):
    manager = get_manager(lecture_id)
    return {"path": manager.save()}


@app.get("/lectures/{lecture_id}")
def read_lecture(lecture_id: str):
    manager = get_manager(lecture_id)
    return {
        "lecture_id": lecture_id,
        "pages": manager.pages,
        "page_history": manager.linker.page_history,
        "records": manager.linker.records
    }


@app.post("/lectures/{lecture_id}/load")
def load_saved_lecture(lecture_id: str):
    manager = LectureManager(lecture_id)

    try:
        data = manager.load()
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Saved lecture not found"
        )

    managers[lecture_id] = manager
    return data

