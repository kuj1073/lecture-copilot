import { generateMemo } from './src/memo.js';
import { retrieveEvidence } from './src/retrieval.js';
import { nonempty, milliseconds, pageNumber, normalizePages, normalizeUtterance } from './src/validation.js';

/** 강의별로 하나 생성한다. 입출력은 JSON 데이터이며 UI/네트워크/파일 저장을 담당하지 않는다. */
export class LectureRag {
  #lectureId;
  #pages;
  #utterances = new Map();
  #memos = [];

  constructor({ lectureId, pages = [] }) {
    this.#lectureId = nonempty(lectureId, 'lectureId', 200);
    this.#pages = normalizePages(pages, lectureId);
  }

  /** 인식 완료된 발화 하나를 받아 메모를 누적한다. 동일 발화 재전송은 null을 반환한다. */
  addUtterance(input, { receivedAtMs } = {}) {
    const utterance = normalizeUtterance(input, this.#lectureId, receivedAtMs);
    const previous = this.#utterances.get(utterance.id);
    if (previous) {
      const { receivedAtMs: ignored, ...original } = previous;
      if (JSON.stringify(original) !== JSON.stringify(utterance)) {
        throw new Error('이미 기록한 발화 ID의 내용은 덮어쓸 수 없습니다.');
      }
      return null;
    }
    const memo = generateMemo(utterance, this.#pages);
    this.#utterances.set(utterance.id, { ...utterance, receivedAtMs });
    this.#memos.push(memo);
    return structuredClone(memo);
  }

  /** 질문 시점까지 인식 완료된 발화와 이 강의의 자료에서 근거를 찾는다. */
  search(question, { askedAtMs, currentPage = null, limit = 5 } = {}) {
    nonempty(question, 'question', 2000);
    milliseconds(askedAtMs, 'askedAtMs');
    pageNumber(currentPage);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 20) {
      throw new TypeError('limit는 1~20 사이 정수여야 합니다.');
    }
    return {
      lectureId: this.#lectureId, askedAtMs,
      ...retrieveEvidence({
        question, askedAtMs, currentPage, limit,
        pages: this.#pages, utterances: [...this.#utterances.values()],
      }),
    };
  }

  getMemos() {
    return structuredClone(this.#memos);
  }

  getUtterances() {
    return structuredClone([...this.#utterances.values()]);
  }
}
