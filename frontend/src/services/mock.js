// stt / rag / data 연동 전까지 화면을 개발·시연하기 위한 가짜 서비스.
// 실제 모듈이 준비되면 같은 인터페이스(services/index.js)를 구현한 어댑터로 교체한다.

import { RecordingStatus } from '../store.js';

export const DEMO_SLIDES = [
  { title: '5주차: 프로세스 스케줄링', bullets: ['CPU 스케줄링의 목적', '선점형 vs 비선점형', '평가 기준: 처리량, 대기 시간, 응답 시간'] },
  { title: 'FCFS (First-Come, First-Served)', bullets: ['도착 순서대로 처리', '구현이 단순함', '호위 효과(Convoy effect) 발생 가능'] },
  { title: 'SJF (Shortest Job First)', bullets: ['실행 시간이 짧은 작업 우선', '평균 대기 시간 최소', '실행 시간 예측이 어려움 → 지수 평균'] },
  { title: 'Round Robin', bullets: ['타임 퀀텀 단위로 순환', '시분할 시스템에 적합', '퀀텀이 너무 크면 FCFS, 너무 작으면 문맥 교환 비용↑'] },
  { title: '정리', bullets: ['상황에 맞는 스케줄링 선택', '다단계 큐, 다단계 피드백 큐는 다음 시간에'] },
];

// 페이지별로 교수자가 할 법한 말 (가짜 발화)
const SCRIPT = {
  1: ['오늘은 CPU 스케줄링을 다룹니다.', '스케줄링의 목적은 CPU를 최대한 놀지 않게 하는 거예요.', '선점형은 실행 중인 프로세스를 중간에 빼앗을 수 있다는 뜻입니다.'],
  2: ['FCFS는 말 그대로 먼저 온 순서대로 처리합니다.', '은행 창구에 줄 서는 걸 생각하면 돼요.', '긴 작업이 앞에 있으면 뒤에 짧은 작업들이 다 기다리는데 이게 호위 효과입니다.'],
  3: ['SJF는 짧은 작업부터 처리합니다.', '평균 대기 시간이 이론적으로 최소가 돼요.', '문제는 실행 시간을 미리 알 수 없다는 거죠, 그래서 지수 평균으로 예측합니다.'],
  4: ['라운드 로빈은 타임 퀀텀만큼 돌아가면서 실행합니다.', '퀀텀을 크게 잡으면 사실상 FCFS랑 같아져요.', '반대로 너무 작으면 문맥 교환 비용이 커집니다.'],
  5: ['오늘 내용 정리하면 상황에 따라 스케줄링 방식을 골라야 한다는 겁니다.', '다단계 큐는 다음 시간에 보겠습니다.'],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 가짜 STT: start() 후 일정 간격으로 발화를 만들어 onUtterance로 보낸다.
 * getPageAt(atMs)로 "발화 당시" 페이지를 받아 기록한다 (인식 지연과 무관하게).
 */
export function createMockStt({ onStatus, onUtterance, onPending, getPageAt, getElapsed }) {
  let timer = null;
  let counters = {};
  let pending = 0;

  function tick() {
    const startMs = Math.max(0, getElapsed() - 2500);
    const page = getPageAt(startMs);
    const lines = SCRIPT[page] ?? ['(자료와 관련 없는 발화)'];
    counters[page] = (counters[page] ?? 0) % lines.length;
    const text = lines[counters[page]];
    counters[page] += 1;

    // 인식에 1~2초 걸린다고 가정
    pending += 1;
    onPending(pending);
    onStatus(RecordingStatus.RECORDING);
    setTimeout(() => {
      pending -= 1;
      onPending(pending);
      onUtterance({ text, startMs, endMs: startMs + 2400, page, confidence: Math.random() < 0.15 ? 0.55 : 0.92 });
    }, 1000 + Math.random() * 1000);
  }

  return {
    async start() {
      counters = {};
      await sleep(200); // 마이크 권한 요청 흉내
      onStatus(RecordingStatus.RECORDING);
      timer = setInterval(tick, 3500);
    },
    async stop() {
      clearInterval(timer);
      timer = null;
      // 남은 음성 처리 후 중지
      if (pending > 0) {
        onStatus(RecordingStatus.PROCESSING);
        while (pending > 0) await sleep(100);
      }
      onStatus(RecordingStatus.STOPPED);
    },
  };
}

/** 가짜 메모 생성: 발화 2개가 모이면 메모 1개 */
export function createMockMemoGenerator({ onMemo }) {
  let buffer = [];
  const kinds = ['concept', 'explain', 'example'];
  let k = 0;
  return {
    feed(utterance) {
      buffer.push(utterance);
      const samePage = buffer.filter((u) => u.page === utterance.page);
      if (samePage.length < 2) return;
      buffer = buffer.filter((u) => u.page !== utterance.page);
      const uncertain = samePage.some((u) => u.confidence < 0.7);
      onMemo({
        kind: kinds[k++ % kinds.length],
        text: `[가짜 메모] ${samePage.map((u) => u.text).join(' ')}`,
        page: utterance.page,
        startMs: samePage[0].startMs,
        endMs: samePage[samePage.length - 1].endMs,
        utteranceIds: samePage.map((u) => u.id),
        uncertain,
      });
    },
  };
}

/** 가짜 질의응답: 질문 시점까지의 발화 중 최근 것을 근거로 답한다 */
export async function mockAsk({ question, utterances, currentPage }) {
  await sleep(1500 + Math.random() * 1500);
  const recent = utterances.slice(-3);
  if (!recent.length) {
    return { text: '아직 기록된 발화가 없어 답변할 근거가 부족합니다.', sources: [], insufficient: true };
  }
  return {
    text: `[가짜 답변] "${question}"에 대해, ${currentPage}페이지 자료와 직전 발화를 참고하면 다음과 같습니다.\n${recent.map((u) => `· ${u.text}`).join('\n')}`,
    sources: [
      { type: 'page', page: currentPage },
      ...recent.map((u) => ({ type: 'utterance', utteranceId: u.id, page: u.page, startMs: u.startMs, endMs: u.endMs })),
    ],
  };
}
