

\# Lecture Copilot 백엔드 API 사용 설명서



\## 1. 실행 환경



\- Python 3.9 이상

\- FastAPI

\- Uvicorn

\- PyMuPDF

\- python-pptx

\- python-multipart



\## 2. 설치 방법



프로젝트 최상위 폴더에서 실행:



```bash

python -m pip install -r requirements.txt

```



\## 3. 서버 실행



```bash

python -m uvicorn data.api:app --reload

```



API 테스트 페이지:

http://127.0.0.1:8000/docs



\## 4. API 목록



| Method | URL | 기능 |

|---|---|---|

| POST | /lectures/{lecture\_id} | 강의 생성 |

| POST | /lectures/{lecture\_id}/material | PDF/PPTX 업로드 |

| POST | /lectures/{lecture\_id}/page | 현재 페이지 변경 |

| POST | /lectures/{lecture\_id}/stt | 음성 인식 결과 추가 |

| POST | /lectures/{lecture\_id}/memo | 메모 추가 |

| POST | /lectures/{lecture\_id}/save | 강의 기록 저장 |

| POST | /lectures/{lecture\_id}/load | 저장된 강의 불러오기 |

| GET | /lectures/{lecture\_id} | 강의 기록 조회 |



\## 5. 사용 순서



1\. 강의 생성

2\. PDF 또는 PPTX 업로드

3\. 현재 페이지 기록

4\. STT 결과 및 메모 추가

5\. 강의 기록 저장

6\. 필요할 때 기록 불러오기



\## 6. 요청 예시



페이지 변경:



```json

{

&#x20; "page": 1,

&#x20; "timestamp": 100

}

```



STT 결과 추가:



```json

{

&#x20; "text": "교수님 설명",

&#x20; "timestamp": 110

}

```



메모 추가:



```json

{

&#x20; "text": "시험 중요",

&#x20; "timestamp": 120

}

```



\## 7. 팀원 연동 시 주의사항



\- STT 담당자는 실제 발화 시작 시각을 전달해야 한다.

\- 페이지 변경 시각과 발화 시각은 같은 시간 기준을 사용해야 한다.

\- 프론트엔드는 페이지 변경 시 /page API를 호출한다.

\- STT 담당자는 /stt API를 호출한다.

\- 메모 저장 시 /memo API를 호출한다.

\- 서버 재시작 후 저장된 기록은 /load API로 복원한다.

\- 현재 API는 로컬 개발용이며 인증과 동시 사용자 처리는 별도 구현이 필요하다.



