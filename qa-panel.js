// 질문·답변 영역: 질문 입력, 답변 표시, 근거 표시, 이전 질문과 답변.
// 답변을 기다리는 동안에도 녹음·메모 누적은 계속된다(입력창도 막지 않음).

import { store, setPage } from '../store.js';
import { el, formatTime, isNearBottom } from '../util.js';
import { ask } from '../services/index.js';

export function mountQaPanel(root) {
  const list = el('div', { class: 'qa-list' });
  const body = el('div', { class: 'pane-body' }, list);
  const input = el('textarea', { placeholder: '수업 중 궁금한 점을 질문하세요 (Enter 전송, Shift+Enter 줄바꿈)', 'aria-label': '질문 입력' });
  const send = el('button', { class: 'btn primary', type: 'submit' }, '질문');
  const form = el('form', { class: 'qa-form' }, input, send);

  root.append(el('div', { class: 'pane-head' }, '질문 · 답변'), body, form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    ask(q);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  function sourceChip(src) {
    if (src.type === 'page') {
      return el('button', { class: 'chip', onClick: () => setPage(src.page) }, `자료 p.${src.page}`);
    }
    return el('button', { class: 'chip', title: '발화 구간', onClick: () => setPage(src.page) },
      `발화 ${formatTime(src.startMs)} (p.${src.page})`);
  }

  function answerNode(item) {
    if (item.status === 'pending') {
      return el('div', { class: 'bubble a pending' }, 'AI 답변 생성 중… (녹음과 메모는 계속됩니다)');
    }
    return el('div', { class: `bubble a${item.status === 'error' ? ' error' : ''}` },
      el('span', { class: 'label' }, 'AI 답변'),
      item.answer,
      item.sources?.length > 0 && el('div', { class: 'memo-foot' }, el('span', { class: 'chip' }, '근거'), item.sources.map(sourceChip)),
      item.insufficient && el('span', { class: 'scope' }, '근거가 부족해 확실한 답을 드리기 어렵습니다.'),
      el('span', { class: 'scope' },
        `${formatTime(item.askedAtMs)} 시점까지의 발화 기준` + (item.pendingChunksAtAsk ? ` · 질문 당시 인식 대기 ${item.pendingChunksAtAsk}건 미반영` : '')));
  }

  let lastSig = '';
  store.subscribe((s) => {
    const sig = s.qa.map((x) => `${x.id}:${x.status}`).join('|');
    if (sig === lastSig) return;
    lastSig = sig;
    const follow = isNearBottom(body) || s.qa.at(-1)?.status === 'pending';
    if (!s.qa.length) {
      list.replaceChildren(el('div', { class: 'empty' }, '예: "방금 말한 개념이 뭐야?", "앞 페이지와 어떻게 달라?"'));
      return;
    }
    list.replaceChildren(...s.qa.flatMap((item) => [
      el('div', { class: 'bubble q' }, item.question),
      answerNode(item),
    ]));
    if (follow) body.scrollTop = body.scrollHeight;
  });
}
