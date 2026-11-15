import { store } from './store.js';
import { MODE } from './services/index.js';
import { mountViewer } from './components/viewer.js';
import { mountRecorderPanel } from './components/recorder-panel.js';
import { mountNotesPanel } from './components/notes-panel.js';
import { mountQaPanel } from './components/qa-panel.js';

mountViewer(document.getElementById('viewer'));
mountRecorderPanel(document.getElementById('recorder'));
mountNotesPanel(document.getElementById('notes'));
mountQaPanel(document.getElementById('qa'));

document.getElementById('mode-badge').hidden = MODE !== 'mock';
store.subscribe((s) => {
  document.getElementById('lecture-title').textContent = s.doc.name || s.lecture.title;
});

// 개발 중 콘솔에서 상태 확인용: window.__store.get()
window.__store = store;
