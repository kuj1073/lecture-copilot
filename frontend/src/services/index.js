// 화면과 다른 모듈(stt / rag / data) 사이의 연결 지점.
// 컴포넌트는 이 파일의 함수만 부른다. 지금은 mock 구현이고,
// 각 모듈이 준비되면 아래 create*/ask 부분만 실제 구현으로 바꾸면 된다.

import {
  store, RecordingStatus, elapsedMs, pageAt,
  setRecording, addUtterance, addMemo, upsertQa,
} from '../store.js';
import { uid } from '../util.js';
import { createMockStt, createMockMemoGenerator, mockAsk } from './mock.js';
import {
  syncUtterance,
  syncMemo
} from './integration.js';

export const MODE = 'mock';

const memoGen = createMockMemoGenerator({
  onMemo: (m) => {
    const memo = {
      id: uid('memo'),
      createdAt: Date.now(),
      ...m
    };

    addMemo(memo);

    syncMemo({
      text: memo.text,
      atMs: memo.startMs ?? elapsedMs()
    }).catch((err) => {
      console.error('메모 백엔드 저장 실패:', err);
    });
  },
});

const stt = createMockStt({
  getElapsed: () => elapsedMs(),
  getPageAt: (atMs) => pageAt(atMs),
  onPending: (n) => setRecording({ pendingChunks: n }),
  onStatus: (status) => {
    if (store.get().recording.status !== status) setRecording({ status });
  },
onUtterance: (u) => {
  const utterance = {
    id: uid('utt'),
    lectureId: store.get().lecture.id,
    ...u
  };

  addUtterance(utterance);

  syncUtterance(utterance).catch((err) => {
    console.error('STT 백엔드 저장 실패:', err);
  });

  memoGen.feed(utterance);
},
});

export async function startRecording() {
  const { status } = store.get().recording;
  if (status === RecordingStatus.RECORDING || status === RecordingStatus.PROCESSING) return;
  setRecording({ error: null, startedAt: Date.now() });
  try {
    await stt.start();
  } catch (err) {
    setRecording({ status: RecordingStatus.ERROR, error: err.message, startedAt: null, pausedElapsedMs: elapsedMs() });
  }
}

export async function stopRecording() {
  // 경과 시간을 먼저 고정하고, 남은 음성 처리가 끝날 때까지 기다린다
  setRecording({ pausedElapsedMs: elapsedMs(), startedAt: null });
  try {
    await stt.stop();
  } catch (err) {
    setRecording({ status: RecordingStatus.ERROR, error: err.message });
  }
}

/** 질문 보내기. 답변을 기다리는 동안에도 녹음·메모는 계속된다 */
export async function ask(question) {
  const s = store.get();
  const id = uid('qa');
  const askedAtMs = elapsedMs(s);
  // 질문 시점까지 처리된 발화만 근거로 쓴다
  const utterances = s.utterances.filter((u) => u.startMs <= askedAtMs);
  upsertQa({
    id, question, askedAtMs, page: s.doc.currentPage,
    status: 'pending', answer: null, sources: [],
    pendingChunksAtAsk: s.recording.pendingChunks,
  });
  try {
    const res = await mockAsk({ question, utterances, currentPage: s.doc.currentPage, history: s.qa });
    upsertQa({ id, status: 'done', answer: res.text, sources: res.sources, insufficient: !!res.insufficient });
  } catch (err) {
    upsertQa({ id, status: 'error', answer: `답변을 받지 못했습니다: ${err.message}` });
  }
}
