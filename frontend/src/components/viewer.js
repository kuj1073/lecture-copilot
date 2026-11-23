// 강의자료 뷰어: PDF 불러오기, 페이지 단위 표시, 이전/다음 이동, 현재 페이지 파악.
// PPT는 data/ 의 파서(또는 PDF 변환)가 준비되면 연결한다. 지금은 안내만 표시.

import { store, setPage, elapsedMs } from '../store.js';
import {
  initializeBackend,
  uploadLectureFile,
  syncPage
} from '../services/integration.js';
import { el } from '../util.js';
import { DEMO_SLIDES } from '../services/mock.js';

const PDFJS_VERSION = '4.10.38';
const PDFJS_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.mjs`;
const PDFJS_WORKER_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

let pdfjsPromise = null;
function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import(/* @vite-ignore */ PDFJS_URL).then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      return lib;
    });
  }
  return pdfjsPromise;
}

export function mountViewer(root) {
  let pdfDoc = null;
  let renderTask = null;
  let renderedKey = '';

  const fileInput = el('input', { type: 'file', accept: '.pdf,.ppt,.pptx', hidden: true });
  const fileName = el('span', { class: 'file-name' });
  const prevBtn = el('button', { class: 'btn', title: '이전 페이지 (←)' }, '◀');
  const nextBtn = el('button', { class: 'btn', title: '다음 페이지 (→)' }, '▶');
  const pageInput = el('input', { class: 'page-input', type: 'number', min: 1, 'aria-label': '페이지 번호' });
  const pageTotal = el('span', { class: 'page-indicator' });
  const openBtn = el('button', { class: 'btn' }, '자료 열기');
  const stage = el('div', { class: 'viewer-stage' });

  const toolbar = el('div', { class: 'viewer-toolbar' },
    el('strong', {}, '강의자료'), fileName,
    el('span', { class: 'spacer' }),
    el('span', { class: 'link-basis', title: '메모·발화는 사용자가 열어둔 페이지에 연결됩니다. 교수자가 실제 설명한 페이지와 다를 수 있어요.' },
      '연결 기준: 내가 열어둔 페이지'),
    prevBtn, pageInput, pageTotal, nextBtn, openBtn, fileInput);

  root.append(toolbar, stage);

  // ---- 이벤트 ----
  openBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) openFile(fileInput.files[0]);
    fileInput.value = '';
  });
  prevBtn.addEventListener('click', () => setPage(store.get().doc.currentPage - 1));
  nextBtn.addEventListener('click', () => setPage(store.get().doc.currentPage + 1));
  pageInput.addEventListener('change', () => setPage(Number(pageInput.value) || 1));

  document.addEventListener('keydown', (e) => {
    if (!store.get().doc.kind) return;
    if (e.target.closest('input, textarea, [contenteditable]')) return;
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { setPage(store.get().doc.currentPage - 1); e.preventDefault(); }
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { setPage(store.get().doc.currentPage + 1); e.preventDefault(); }
  });

  stage.addEventListener('dragover', (e) => { e.preventDefault(); stage.querySelector('.drop-zone')?.classList.add('dragover'); });
  stage.addEventListener('dragleave', () => stage.querySelector('.drop-zone')?.classList.remove('dragover'));
  stage.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) openFile(file);
  });

  // 창 크기가 바뀌면 PDF 페이지를 다시 그린다
  let resizeTimer;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { renderedKey = ''; render(store.get()); }, 150);
  }).observe(stage);

  // ---- 파일 열기 ----
   async function openFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'ppt' || ext === 'pptx') {
      showMessage('PPT 파일은 아직 지원하지 않습니다. (data/ 파서 연동 예정)\nPDF로 내보낸 뒤 열어 주세요.', true);
      return;
    }
    if (ext !== 'pdf') {
      showMessage('PDF 파일만 열 수 있습니다.', true);
      return;
    }
    showMessage('자료를 불러오는 중…');
    try {
      const pdfjs = await loadPdfjs();
      const data = new Uint8Array(await file.arrayBuffer());
      pdfDoc = await pdfjs.getDocument({ data }).promise;
      renderedKey = '';
      await initializeBackend();
await uploadLectureFile(file);

store.update({
  doc: {
    kind: 'pdf',
    name: file.name,
    pageCount: pdfDoc.numPages,
    currentPage: 1
  },
  pageHistory: []
});

setPage(1);


console.log('PDF 업로드 및 첫 페이지 동기화 성공');

    } catch (err) {
      console.error(err);
      pdfDoc = null;
      showMessage(`자료를 열지 못했습니다: ${err.message}`, true);
    }
  }

 
  function openDemo() {
    pdfDoc = null;
    renderedKey = '';
    store.update({ doc: { kind: 'demo', name: '데모 강의자료 (운영체제 5주차)', pageCount: DEMO_SLIDES.length, currentPage: 1 }, pageHistory: [] });
    setPage(1);
  }

  function showMessage(text, isError = false) {
    renderedKey = '';
    stage.replaceChildren(el('div', { class: isError ? 'viewer-error' : 'empty' }, text));
    if (isError && !store.get().doc.kind) stage.append(dropZone());
  }

  function dropZone() {
    return el('div', { class: 'drop-zone' },
      el('div', {}, 'PDF 강의자료를 끌어다 놓거나 열어 주세요.'),
      el('div', { class: 'actions' },
        el('button', { class: 'btn primary', onClick: () => fileInput.click() }, '자료 열기'),
        el('button', { class: 'btn', onClick: openDemo }, '데모 자료로 시작')));
  }

  // ---- 그리기 ----
  async function render(state) {
    const { doc } = state;
    fileName.textContent = doc.name;
    pageTotal.textContent = doc.pageCount ? `/ ${doc.pageCount}` : '';
    pageInput.value = doc.pageCount ? doc.currentPage : '';
    pageInput.max = doc.pageCount || 1;
    pageInput.disabled = !doc.pageCount;
    prevBtn.disabled = !doc.pageCount || doc.currentPage <= 1;
    nextBtn.disabled = !doc.pageCount || doc.currentPage >= doc.pageCount;

    const key = `${doc.kind}:${doc.name}:${doc.currentPage}`;
    if (key === renderedKey) return;
    renderedKey = key;

    if (!doc.kind) {
      stage.replaceChildren(dropZone());
      return;
    }
    if (doc.kind === 'demo') {
      const slide = DEMO_SLIDES[doc.currentPage - 1];
      stage.replaceChildren(el('article', { class: 'demo-slide' },
        el('h2', {}, slide.title),
        el('ul', {}, slide.bullets.map((b) => el('li', {}, b))),
        el('span', { class: 'slide-no' }, `${doc.currentPage}`)));
      return;
    }
    if (doc.kind === 'pdf' && pdfDoc) {
      renderTask?.cancel();
      const page = await pdfDoc.getPage(doc.currentPage);
      if (renderedKey !== key) return; // 그 사이 다른 페이지로 이동함
      const base = page.getViewport({ scale: 1 });
      const fit = Math.max(0.5, (stage.clientWidth - 32) / base.width);
      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: fit * dpr });
      const canvas = el('canvas', { 'aria-label': `${doc.currentPage}페이지` });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / dpr}px`;
      renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport });
      try {
        await renderTask.promise;
        if (renderedKey === key) stage.replaceChildren(canvas);
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') console.error(err);
      }
    }
  }

   store.subscribe(render);

  let lastSyncedPage = null;

  store.subscribe((state) => {
    if (state.doc.kind !== 'pdf') {
      lastSyncedPage = null;
      return;
    }

    const page = state.doc.currentPage;

    if (page === lastSyncedPage) return;

    lastSyncedPage = page;

    syncPage(page, elapsedMs()).catch((err) => {
      console.error('페이지 동기화 실패:', err);
      lastSyncedPage = null;
    });
  });
}