// 녹음 상태 영역: 시작·중지, 녹음 중 표시, 경과 시간, 처리 상태(녹음 중/음성 처리 중/중지/오류)

import { store, RecordingStatus, elapsedMs } from '../store.js';
import { el, formatTime } from '../util.js';
import { startRecording, stopRecording } from '../services/index.js';

const LABEL = {
  [RecordingStatus.IDLE]: '대기',
  [RecordingStatus.RECORDING]: '녹음 중',
  [RecordingStatus.PROCESSING]: '음성 처리 중',
  [RecordingStatus.STOPPED]: '중지됨',
  [RecordingStatus.ERROR]: '오류',
};

export function mountRecorderPanel(root) {
  const statusEl = el('span', { class: 'rec-status', role: 'status', 'aria-live': 'polite' },
    el('span', { class: 'rec-dot' }), el('span', { class: 'rec-label' }));
  const button = el('button', { class: 'btn primary' });
  const timer = el('span', { class: 'rec-timer' }, '00:00');
  const meta = el('div', { class: 'rec-meta' });
  const errorEl = el('div', { class: 'rec-error', hidden: true });

  root.append(el('div', { class: 'rec-row' }, button, statusEl, timer), meta, errorEl);

  button.addEventListener('click', () => {
    const { status } = store.get().recording;
    if (status === RecordingStatus.RECORDING) stopRecording();
    else startRecording();
  });

  // 경과 시간은 store를 건드리지 않고 화면에서만 갱신
  setInterval(() => { timer.textContent = formatTime(elapsedMs()); }, 250);

  store.subscribe((s) => {
    const { status, error, pendingChunks } = s.recording;
    statusEl.dataset.status = status;
    statusEl.querySelector('.rec-label').textContent = LABEL[status] ?? status;

    const recording = status === RecordingStatus.RECORDING;
    button.textContent = recording ? '■ 녹음 중지' : (status === RecordingStatus.STOPPED ? '● 이어서 녹음' : '● 녹음 시작');
    button.className = `btn ${recording ? 'danger' : 'primary'}`;
    button.disabled = status === RecordingStatus.PROCESSING;

    const parts = [`발화 ${s.utterances.length}개`, `메모 ${s.memos.length}개`];
    if (pendingChunks > 0) parts.push(`인식 대기 ${pendingChunks}건`);
    meta.textContent = parts.join(' · ');

    errorEl.hidden = !error;
    errorEl.textContent = error ? `⚠ ${error} — 지금까지의 기록은 보존됩니다.` : '';
    timer.textContent = formatTime(elapsedMs(s));
  });
}
