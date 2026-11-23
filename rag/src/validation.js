export function nonempty(value, name, maxLength = 12000) {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new TypeError(`${name}: 비어 있지 않은 문자열(최대 ${maxLength}자)이 필요합니다.`);
  }
  return value;
}

export function milliseconds(value, name) {
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(`${name}: 녹음 시작 기준의 0 이상 밀리초 값이 필요합니다.`);
  }
  return value;
}

export function pageNumber(value) {
  if (value === null || value === undefined) return null;
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new TypeError('page: 1 이상의 페이지 번호 또는 null이 필요합니다.');
  }
  return value;
}

function sameLecture(record, lectureId) {
  if (record.lectureId !== undefined && record.lectureId !== lectureId) {
    throw new Error('다른 강의의 자료 또는 발화는 사용할 수 없습니다.');
  }
}

export function normalizePages(pages, lectureId) {
  if (!Array.isArray(pages)) throw new TypeError('pages는 배열이어야 합니다.');
  const seen = new Set();
  return pages.map((item) => {
    sameLecture(item, lectureId);
    const page = pageNumber(item.page);
    if (page === null || seen.has(page)) throw new Error('자료 페이지 번호가 없거나 중복되었습니다.');
    if (typeof item.text !== 'string') throw new TypeError('자료의 text는 문자열이어야 합니다.');
    seen.add(page);
    return { lectureId, page, text: item.text };
  });
}

export function normalizeUtterance(input, lectureId, receivedAtMs) {
  // 발화에는 강의 ID를 반드시 요구해서 다른 강의의 입력을 묵시적으로 붙이지 않는다.
  if (input.lectureId !== lectureId) throw new Error('발화의 lectureId가 현재 강의와 다릅니다.');
  const startMs = milliseconds(input.startMs, 'startMs');
  const endMs = milliseconds(input.endMs, 'endMs');
  milliseconds(receivedAtMs, 'receivedAtMs');
  if (endMs < startMs || receivedAtMs < endMs) {
    throw new Error('startMs <= endMs <= receivedAtMs 순서여야 합니다.');
  }
  const confidence = input.confidence ?? null;
  if (confidence !== null && (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)) {
    throw new TypeError('confidence는 0~1 사이 값 또는 생략이어야 합니다.');
  }
  return {
    id: nonempty(input.id, 'id', 200), lectureId,
    text: nonempty(input.text, 'text'), startMs, endMs,
    page: pageNumber(input.page), confidence,
  };
}
