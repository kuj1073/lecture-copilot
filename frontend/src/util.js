/** ms → "mm:ss" (1시간 넘으면 "h:mm:ss") */
export function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** 간단한 DOM 생성 도우미. 텍스트는 textContent로만 넣어 자료·발화 내용이 HTML로 실행되지 않게 한다 */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

let seq = 0;
export function uid(prefix = 'id') {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

/** 스크롤이 거의 맨 아래에 있을 때만 새 항목으로 따라 내려간다 */
export function isNearBottom(node, threshold = 40) {
  return node.scrollHeight - node.scrollTop - node.clientHeight < threshold;
}
