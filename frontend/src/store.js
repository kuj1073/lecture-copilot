// 화면 전체가 공유하는 상태 저장소.
// 컴포넌트는 store.subscribe()로 변경을 받고, store.update()로만 상태를 바꾼다.
// 다른 모듈(stt/rag/data)과 주고받는 데이터 모양은 frontend/README.md의 "데이터 형식" 참고.

import { RecordingStatus } from '../../stt/src/status.js';

export { RecordingStatus };

function initialState() {
  return {
    lecture: { id: `lecture-${Date.now()}`, title: '새 강의' },

    // 강의자료 뷰어
    doc: {
      kind: null,        // 'pdf' | 'demo' | null
      name: '',
      pageCount: 0,
      currentPage: 1,
    },
    // 페이지 이동 이력: 발화 당시 페이지를 찾는 기준 (data/로 넘김)
    pageHistory: [],     // [{ page, atMs }]  atMs = 녹음 시작 기준 경과 ms

    // 녹음 상태 (stt/src/status.js 의 RecordingStatus 값 사용)
    recording: {
      status: RecordingStatus.IDLE,
      startedAt: null,   // Date.now() 기준 시작 시각
      pausedElapsedMs: 0,
      error: null,
      pendingChunks: 0,  // 아직 인식 중인 음성 조각 수
    },

    utterances: [],      // 발화 기록
    memos: [],           // 자동 메모
    qa: [],              // 질문·답변
  };
}

class Store {
  constructor() {
    this.state = initialState();
    this.listeners = new Set();
  }

  get() {
    return this.state;
  }

  /** patch: 부분 객체 또는 (state) => 부분 객체 */
  update(patch) {
    const next = typeof patch === 'function' ? patch(this.state) : patch;
    this.state = { ...this.state, ...next };
    this.listeners.forEach((fn) => fn(this.state));
  }

  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  reset() {
    this.state = initialState();
    this.listeners.forEach((fn) => fn(this.state));
  }
}

export const store = new Store();

/** 녹음 시작 기준 현재 경과 시간(ms). 녹음 전이면 0 */
export function elapsedMs(state = store.get()) {
  const { startedAt, pausedElapsedMs } = state.recording;
  if (!startedAt) return pausedElapsedMs;
  return pausedElapsedMs + (Date.now() - startedAt);
}

/** 주어진 시점(ms)에 사용자가 열어두고 있던 페이지. 늦게 도착한 인식 결과의 페이지 연결에 쓴다 */
export function pageAt(atMs, state = store.get()) {
  let page = state.doc.currentPage;
  for (let i = state.pageHistory.length - 1; i >= 0; i -= 1) {
    if (state.pageHistory[i].atMs <= atMs) {
      page = state.pageHistory[i].page;
      break;
    }
  }
  return page;
}

// ---- 자주 쓰는 갱신 함수 ----

export function setPage(page) {
  const s = store.get();
  const clamped = Math.min(Math.max(1, page), Math.max(1, s.doc.pageCount));
  if (clamped === s.doc.currentPage && s.pageHistory.length) return;
  store.update({
    doc: { ...s.doc, currentPage: clamped },
    pageHistory: [...s.pageHistory, { page: clamped, atMs: elapsedMs(s) }],
  });
}

export function setRecording(patch) {
  store.update((s) => ({ recording: { ...s.recording, ...patch } }));
}

export function addUtterance(u) {
  store.update((s) => ({ utterances: [...s.utterances, u] }));
}

export function addMemo(m) {
  // 누적만 한다. 같은 id가 다시 오면(갱신) 교체하되 이전 메모는 지우지 않는다.
  store.update((s) => {
    const idx = s.memos.findIndex((x) => x.id === m.id);
    if (idx === -1) return { memos: [...s.memos, m] };
    const memos = s.memos.slice();
    memos[idx] = { ...memos[idx], ...m };
    return { memos };
  });
}

export function upsertQa(item) {
  store.update((s) => {
    const idx = s.qa.findIndex((x) => x.id === item.id);
    if (idx === -1) return { qa: [...s.qa, item] };
    const qa = s.qa.slice();
    qa[idx] = { ...qa[idx], ...item };
    return { qa };
  });
}
