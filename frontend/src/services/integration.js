
import { store, elapsedMs } from '../store.js';

import {
  createLecture,
  uploadMaterial,
  changePage,
  sendStt,
  sendMemo,
  saveLecture,
  getLecture,
} from './backend.js';

let activeLectureId = null;

export async function initializeBackend() {
  const id = store.get().lecture.id;
  await createLecture(id);
  activeLectureId = id;
  return id;
}

function lectureId() {
  if (!activeLectureId) {
    throw new Error('백엔드 강의가 초기화되지 않았습니다.');
  }
  return activeLectureId;
}

export async function uploadLectureFile(file) {
  return uploadMaterial(lectureId(), file);
}

export async function syncPage(page, atMs = elapsedMs()) {
  return changePage(lectureId(), page, atMs);
}

export async function syncUtterance(utterance) {
  const atMs = utterance.startMs;
  if (!Number.isFinite(atMs)) {
    throw new Error('STT 발화 시작 시각이 필요합니다.');
  }
  return sendStt(lectureId(), utterance.text, atMs);
}

export async function syncMemo(memo) {
  const atMs = memo.atMs ?? memo.startMs;
  if (!Number.isFinite(atMs)) {
    throw new Error('메모 시각이 필요합니다.');
  }
  return sendMemo(lectureId(), memo.text, atMs);
}

export async function saveCurrentLecture() {
  return saveLecture(lectureId());
}

export async function fetchCurrentLecture() {
  return getLecture(lectureId());
}
