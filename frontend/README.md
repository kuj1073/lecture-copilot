# frontend

담당: 홍성조

웹 프론트엔드(브라우저) 화면 구성과 사용자 입력을 담당한다. 구체적인 프레임워크·라이브러리 선택은 담당자 재량.

## 범위

- **강의자료 뷰어**: PDF·PPT 강의자료를 불러와 페이지 단위로 표시, 이전/다음 페이지 이동, 현재 열어둔 페이지 파악
- **녹음 상태 영역**: 녹음 시작·중지, 녹음 중 표시, 경과 시간, 처리 상태(녹음 중/음성 처리 중/중지/오류) 표시
- **메모 영역**: 계속 쌓이는 강의 메모 표시, 메모와 연결된 페이지·시간 확인
- **질문·답변 영역**: 질문 입력, 답변 표시, 답변 근거(자료 페이지·발화 구간) 표시, 이전 질문과 답변 확인

## 연결

- 녹음 상태·발화 기록은 [`stt/`](../stt/)에서 받는다
- 메모·질문답변 결과는 [`rag/`](../rag/)에서 받는다
- 전체 기록 보관·다시 보기는 [`data/`](../data/)에서 받는다

---

## 실행 방법

빌드 도구 없이 순수 HTML/CSS/JS(ES 모듈)로 작성했다. `stt/src/status.js`를 가져다 쓰므로 **저장소 최상위에서** 서버를 띄운다.

```bash
# lecture-copilot/ 에서
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000/frontend/ 접속
```

- "데모 자료로 시작"을 누르면 PDF 없이도 화면을 확인할 수 있다
- PDF 렌더링은 pdf.js를 CDN(jsdelivr)에서 불러온다 → 인터넷 연결 필요
- 현재는 **MOCK 모드**: stt·rag·data 연동 전이라 가짜 발화·메모·답변이 나온다 (우측 상단 배지)
- 개발 중 콘솔에서 `window.__store.get()`으로 전체 상태 확인 가능

## 파일 구조

```
frontend/
├── index.html                  # 왼쪽 강의자료 / 오른쪽 녹음·메모·질문답변 배치
├── css/style.css
└── src/
    ├── main.js                 # 각 영역 마운트
    ├── store.js                # 공유 상태 + 갱신 함수 (pageAt: 발화 시점의 페이지 찾기)
    ├── util.js                 # 시간 포맷, DOM 도우미(textContent만 사용 → 자료·발화 내용이 HTML로 실행되지 않음)
    ├── services/
    │   ├── index.js            # ★ 다른 모듈과의 연결 지점 (startRecording / stopRecording / ask)
    │   └── mock.js             # 가짜 STT·메모·답변 + 데모 슬라이드
    └── components/
        ├── viewer.js           # 강의자료 뷰어
        ├── recorder-panel.js   # 녹음 상태
        ├── notes-panel.js      # 강의 메모 / 발화 기록 탭
        └── qa-panel.js         # 질문·답변
```

## 데이터 형식 (팀원과 맞출 것)

frontend가 기대하는 모양. 이름이 다르면 `services/index.js`에서 변환하면 된다.

```js
// 발화 (stt → data → frontend)
{ id, lectureId, text, startMs, endMs, page, confidence }   // startMs: 녹음 시작 기준 ms, page: 발화 당시 열어둔 페이지

// 메모 (rag → frontend)
{ id, kind: 'concept' | 'explain' | 'example', text, page, startMs, endMs, utteranceIds: [], uncertain: boolean }

// 답변 (rag → frontend)
{ text, insufficient?: boolean,
  sources: [ { type: 'page', page } | { type: 'utterance', utteranceId, page, startMs, endMs } ] }

// 페이지 이동 이력 (frontend → data)
[{ page, atMs }]
```

녹음 상태 값은 `stt/src/status.js`의 `RecordingStatus`(idle / recording / processing / stopped / error)를 그대로 쓴다.

## 진행 현황 (약 40%)

### 완료
- [x] 전체 레이아웃 (왼쪽 자료 / 오른쪽 녹음·메모·QA, 좁은 화면에서 세로 배치)
- [x] 공유 상태 저장소, 페이지 이동 이력 기록, 발화 시점 기준 페이지 찾기(`pageAt`)
- [x] 강의자료 뷰어: PDF 열기(버튼·드래그 앤 드롭), 페이지 렌더링, 이전/다음·번호 입력·←→ 키 이동, "연결 기준: 내가 열어둔 페이지" 표시
- [x] 녹음 상태: 시작·중지·이어서 녹음, 상태 5종 표시, 경과 시간, 인식 대기 건수, 오류 메시지(기록 보존 안내)
- [x] 메모 영역: 메모/발화 기록 탭 구분, 페이지 칩 클릭 시 페이지 이동, 시간 칩 클릭 시 근거 발화 강조, "확인 필요" 표시, 현재 페이지만 보기
- [x] 질문·답변 기본형: 입력(Enter 전송), 답변 대기 중에도 녹음 유지, 근거 칩, 질문 시점 기준 표시
- [x] mock 서비스로 전체 흐름 시연 가능

### 남은 작업
- [ ] stt 실제 연동 (`Recorder` + Vosk 인식 결과를 `services/index.js`에 연결, 마이크 권한 거부 처리)
- [ ] rag 실제 연동 (메모 생성 / 질의응답 API, 후속 질문 대화 맥락 전달)
- [ ] data 연동: 강의별 저장·불러오기, 강의 목록 / 새 강의 시작, 수업 후 다시 보기 화면
- [ ] PPT 지원 (data 파서 결과 또는 PDF 변환본 표시)
- [ ] 답변 근거 상세: 발화 근거 클릭 시 해당 발화로 이동, 자료와 발화가 다를 때 차이 표시
- [ ] 메모 갱신(같은 메모 수정) 시 이전 버전 보기, 발화 원문 비교
- [ ] 새 자료를 열면 이전 강의 기록과 분리 (지금은 같은 강의로 이어짐)
- [ ] 뷰어 확대/축소, 썸네일 목록
- [ ] 접근성·키보드 조작 점검, 오류 상황(모델 호출 실패 등) UI 다듬기
- [ ] 테스트 코드
