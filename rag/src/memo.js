import { classify, keywords, overlap, sentences } from './text.js';

export function utteranceSource(utterance) {
  return {
    type: 'utterance', utteranceId: utterance.id, page: utterance.page,
    startMs: utterance.startMs, endMs: utterance.endMs,
  };
}

// 원문 문장을 선택하는 추출식 메모. 새 사실 생성이나 STT 원문 교정은 하지 않는다.
export function generateMemo(utterance, pages) {
  const page = pages.find((item) => item.page === utterance.page);
  const pageTerms = keywords(page?.text ?? '');
  const candidates = sentences(utterance.text).map((text, index) => ({
    text, index,
    score: overlap(pageTerms, text) + (classify(text) === 'explain' ? 0 : 1),
  }));
  const selected = candidates
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 2)
    .sort((a, b) => a.index - b.index);

  const reasons = [];
  if (utterance.confidence === null) reasons.push('음성 인식 신뢰도 미제공');
  else if (utterance.confidence < 0.7) reasons.push('낮은 음성 인식 신뢰도');
  if (utterance.page === null) reasons.push('연결 페이지 미확인');
  if (/\?{2,}|인식\s*불가|불명확/u.test(utterance.text)) reasons.push('불확실한 원문 표현');

  return {
    id: `memo:${encodeURIComponent(utterance.lectureId)}:${encodeURIComponent(utterance.id)}`,
    lectureId: utterance.lectureId,
    kind: classify(selected[0].text),
    text: selected.map((item) => item.text).join(' '),
    page: utterance.page, startMs: utterance.startMs, endMs: utterance.endMs,
    utteranceIds: [utterance.id], sources: [utteranceSource(utterance)],
    uncertain: reasons.length > 0, uncertaintyReasons: reasons,
    method: 'extractive',
  };
}
