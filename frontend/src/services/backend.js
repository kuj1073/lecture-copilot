
const API_URL = 'http://127.0.0.1:8000';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API ${response.status}: ${error}`);
  }

  return response.json();
}

const lecturePath = (id) =>
  `/lectures/${encodeURIComponent(id)}`;

export function createLecture(id) {
  return request(lecturePath(id), {
    method: 'POST',
  });
}

export function uploadMaterial(id, file) {
  const form = new FormData();
  form.append('file', file);

  return request(`${lecturePath(id)}/material`, {
    method: 'POST',
    body: form,
  });
}

export function changePage(id, page, timestamp) {
  return request(`${lecturePath(id)}/page`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page, timestamp }),
  });
}

export function sendStt(id, text, timestamp) {
  return request(`${lecturePath(id)}/stt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, timestamp }),
  });
}

export function sendMemo(id, text, timestamp) {
  return request(`${lecturePath(id)}/memo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, timestamp }),
  });
}

export function saveLecture(id) {
  return request(`${lecturePath(id)}/save`, {
    method: 'POST',
  });
}

export function loadLecture(id) {
  return request(`${lecturePath(id)}/load`, {
    method: 'POST',
  });
}

export function getLecture(id) {
  return request(lecturePath(id));
}
