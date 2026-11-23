import { LectureRag } from './index.js';

const lecture = new LectureRag({
  lectureId: 'os-05',
  pages: [
    { page: 1, text: 'CPU 스케줄링: CPU를 실행할 프로세스에 배정한다.' },
    { page: 2, text: 'FCFS: 도착한 순서대로 실행한다. 긴 작업 뒤에 짧은 작업이 기다리는 호위 효과가 있다.' },
  ],
});

const first = lecture.addUtterance({
  id: 'utt-1', lectureId: 'os-05', page: 2,
  text: 'FCFS란 먼저 도착한 작업부터 실행하는 방식입니다. 긴 작업이 앞에 있으면 짧은 작업도 기다립니다.',
  startMs: 1000, endMs: 4000, confidence: 0.94,
}, { receivedAtMs: 4500 });

const second = lecture.addUtterance({
  id: 'utt-2', lectureId: 'os-05', page: 2,
  text: '예를 들어 은행 창구에 먼저 줄을 선 사람부터 처리하는 것과 같습니다.',
  startMs: 5000, endMs: 7500, confidence: 0.91,
}, { receivedAtMs: 8000 });

console.log('생성된 메모:', JSON.stringify([first, second], null, 2));
console.log('질문 근거:', JSON.stringify(lecture.search('FCFS가 뭐야?', {
  askedAtMs: 8500, currentPage: 2,
}), null, 2));
console.log('최근 설명:', JSON.stringify(lecture.search('방금 예시 다시 설명해줘', {
  askedAtMs: 8500, limit: 1,
}), null, 2));
console.log('근거 없는 질문:', JSON.stringify(lecture.search('양자역학을 알려줘', {
  askedAtMs: 8500,
}), null, 2));
