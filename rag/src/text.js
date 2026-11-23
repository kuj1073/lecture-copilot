// 형태소 분석기 대신 사용하는 1차 키워드 처리. 동의어/의미 검색은 후속 작업이다.
const STOP_WORDS = new Set([
  '뭐', '뭐야', '무엇', '무엇인가요', '무슨', '어떤', '어떻게', '왜', '좀',
  '알려줘', '알려주세요', '설명해줘', '설명해주세요', '설명', '해줘', '해주세요',
  '대해', '대한', '관련', '내용', '다시', '방금', '직전', '최근', '말한',
  '교수님', '교수님이', '개념', '예시', '예', '이것', '그것', '이거', '그거',
  'the', 'a', 'an', 'is', 'are', 'what', 'how', 'why', 'please', 'explain',
]);
const PARTICLES = /(?:으로는|에서는|에게는|에서도|이란|으로|에서|에게|란|은|는|이|가|을|를|와|과|의|도|에)$/u;

export function cleanText(text) {
  return text.replace(/\s+/gu, ' ').trim();
}

export function keywords(text) {
  const words = text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const result = new Set();
  for (const word of words) {
    if (STOP_WORDS.has(word)) continue;
    const base = /[가-힣]/u.test(word) ? word.replace(PARTICLES, '') : word;
    const term = base.length >= 2 ? base : word;
    if (term.length >= 2 && !STOP_WORDS.has(term)) result.add(term);
  }
  return result;
}

export function overlap(queryTerms, text) {
  const terms = keywords(text);
  return [...queryTerms].filter((term) => terms.has(term)).length;
}

export function sentences(text) {
  return text.split(/(?<=[.!?。！？])\s+|\n+/u).map(cleanText).filter(Boolean);
}

export function classify(text) {
  if (/(예를\s*들|예시|가령|예컨대|for example)/iu.test(text)) return 'example';
  if (/(이란|란\s|정의|의미|라고\s*(하|합)|뜻)/u.test(text)) return 'concept';
  return 'explain';
}
