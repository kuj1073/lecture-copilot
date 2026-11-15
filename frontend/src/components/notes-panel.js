// 메모 영역: 자동 메모와 발화 기록을 탭으로 구분해 보여준다.
// 각 항목의 페이지·시간 칩을 누르면 해당 페이지로 이동 / 관련 발화를 강조한다.

import { store, setPage } from '../store.js';
import { el, formatTime, isNearBottom } from '../util.js';

const KIND_LABEL = { concept: '개념', explain: '설명', example: '예시' };

export function mountNotesPanel(root) {
  let tab = 'memo';
  let onlyCurrentPage = false;
  let lastSig = '';

  const memoTab = el('button', { class: 'tab', role: 'tab' }, '강의 메모 ', el('span', { class: 'count' }));
  const uttTab = el('button', { class: 'tab', role: 'tab' }, '발화 기록 ', el('span', { class: 'count' }));
  const filter = el('input', { type: 'checkbox' });
  const body = el('div', { class: 'pane-body', role: 'tabpanel' });

  root.append(
    el('div', { class: 'pane-head' },
      el('div', { class: 'tabs', role: 'tablist' }, memoTab, uttTab),
      el('span', { class: 'spacer' }),
      el('label', { class: 'filter' }, filter, '현재 페이지만')),
    body);

  memoTab.addEventListener('click', () => { tab = 'memo'; lastSig = ''; render(store.get(), true); });
  uttTab.addEventListener('click', () => { tab = 'utt'; lastSig = ''; render(store.get(), true); });
  filter.addEventListener('change', () => { onlyCurrentPage = filter.checked; lastSig = ''; render(store.get(), true); });

  function pageChip(page) {
    return el('button', { class: 'chip', title: `${page}페이지로 이동`, onClick: () => setPage(page) }, `p.${page}`);
  }

  function showUtterances(ids) {
    tab = 'utt';
    lastSig = '';
    render(store.get(), true);
    ids.forEach((id, i) => {
      const node = body.querySelector(`[data-id="${id}"]`);
      if (!node) return;
      if (i === 0) node.scrollIntoView({ block: 'center' });
      node.classList.add('flash');
      setTimeout(() => node.classList.remove('flash'), 1200);
    });
  }

  function memoNode(m) {
    return el('div', { class: `memo${m.uncertain ? ' uncertain' : ''}`, dataset: { id: m.id } },
      el('span', { class: `memo-kind ${m.kind}` }, KIND_LABEL[m.kind] ?? m.kind),
      m.text,
      el('div', { class: 'memo-foot' },
        pageChip(m.page),
        el('button', { class: 'chip', title: '근거가 된 발화 보기', onClick: () => showUtterances(m.utteranceIds ?? []) },
          `${formatTime(m.startMs)}–${formatTime(m.endMs)}`),
        m.uncertain && el('span', { class: 'chip warn', title: '인식이 불확실한 발화가 포함되어 있습니다. 원래 발화를 확인하세요.' }, '확인 필요')));
  }

  function uttNode(u) {
    return el('div', { class: 'utt', dataset: { id: u.id } },
      el('time', {}, formatTime(u.startMs)),
      pageChip(u.page),
      el('span', {}, u.text),
      u.confidence < 0.7 && el('span', { class: 'chip warn' }, '불확실'));
  }

  function render(s, force = false) {
    memoTab.setAttribute('aria-selected', tab === 'memo');
    uttTab.setAttribute('aria-selected', tab === 'utt');
    memoTab.querySelector('.count').textContent = s.memos.length;
    uttTab.querySelector('.count').textContent = s.utterances.length;

    const items = tab === 'memo' ? s.memos : s.utterances;
    const visible = onlyCurrentPage ? items.filter((x) => x.page === s.doc.currentPage) : items;
    // 내용이 바뀌었을 때만 다시 그린다
    const sig = `${tab}:${onlyCurrentPage ? s.doc.currentPage : '*'}:${visible.length}:${visible.at(-1)?.id ?? ''}`;
    if (!force && sig === lastSig) return;
    lastSig = sig;

    const follow = isNearBottom(body);
    if (!visible.length) {
      body.replaceChildren(el('div', { class: 'empty' },
        tab === 'memo' ? '녹음을 시작하면 강의 메모가 여기에 쌓입니다.' : '인식된 발화가 여기에 순서대로 기록됩니다.'));
      return;
    }
    body.replaceChildren(...visible.map(tab === 'memo' ? memoNode : uttNode));
    if (follow) body.scrollTop = body.scrollHeight;
  }

  store.subscribe((s) => render(s));
}
