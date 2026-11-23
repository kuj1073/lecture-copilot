import { keywords, overlap } from './text.js';
import { utteranceSource } from './memo.js';

// 생성 답변이 아니라, 후속 답변 생성기에 전달할 근거 목록만 반환한다.
export function retrieveEvidence({ question, pages, utterances, askedAtMs, currentPage, limit }) {
  const terms = keywords(question);
  const recentOnly = terms.size === 0 && /(방금|직전|최근)/u.test(question);
  const eligible = utterances.filter((u) => u.endMs <= askedAtMs && u.receivedAtMs <= askedAtMs);
  let matches;

  if (recentOnly) {
    matches = eligible.slice().sort((a, b) => b.endMs - a.endMs).map((u) => ({
      text: u.text, source: utteranceSource(u), score: 1, match: 'recent',
      uncertain: u.confidence === null || u.confidence < 0.7,
    }));
  } else {
    const candidates = [
      ...pages.map((p) => ({ text: p.text, source: { type: 'page', page: p.page }, uncertain: false })),
      ...eligible.map((u) => ({
        text: u.text, source: utteranceSource(u),
        uncertain: u.confidence === null || u.confidence < 0.7,
      })),
    ];
    matches = candidates.map((candidate) => ({
      ...candidate, score: overlap(terms, candidate.text), match: 'keyword',
    })).filter((candidate) => candidate.score > 0);
    matches.sort((a, b) =>
      b.score - a.score ||
      Number(b.source.page === currentPage) - Number(a.source.page === currentPage) ||
      (b.source.endMs ?? -1) - (a.source.endMs ?? -1));
  }

  matches = matches.slice(0, limit);
  return {
    insufficient: matches.length === 0,
    matches,
    sources: matches.map((item) => ({ ...item.source })),
  };
}
