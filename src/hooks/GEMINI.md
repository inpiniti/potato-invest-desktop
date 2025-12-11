# 훅 (Custom Hooks) 룰 및 문서화

## 1. useAppInit (`useAppInit.ts`)

- **훅 설명**: 애플리케이션 초기화 로직을 담당하는 훅입니다. `App.tsx`에서 분리되어 다크모드 설정, Supabase 세션 관리, 트레이딩 데이터 로드, 계좌/웹소켓 초기화, S&P 500 및 TradingView 데이터 로드, 딥링크 처리 등을 순차적으로 수행합니다.
- **Input (Arguments)**: 없음
- **Output (Return Value)**: 없음 (내부 사이드 이펙트만 수행)

- **Effects (useEffect)**
  - `darkMode`: 다크모드 초기화
  - `auth`: Supabase 세션 리스너 등록
  - `trading`: 로그인 시 트레이딩 데이터 및 히스토리 로드
  - `account`: 계좌 잔고 조회 및 웹소켓 토큰 발급
  - `sp500`: S&P 500 데이터 크롤링 및 이후 TradingView 데이터 연쇄 로드
  - `deepLink`: OAuth 로그인 후 리다이렉트 처리

---

## 2. useIsMobile (`use-mobile.ts`)

- **훅 설명**: 현재 뷰포트 너비가 모바일 브레이크포인트(768px 미만)인지 감지하는 훅입니다.
- **Input (Arguments)**: 없음
- **Output (Return Value)**: 
  - `boolean`: 모바일 여부 (`true`: 모바일, `false`: 데스크탑)

- **State (Internal)**
  - `isMobile`: 화면 너비가 768px 미만인지 여부를 저장하는 상태

- **Effects (useEffect)**
  - 윈도우 리사이즈 이벤트를 감지하여 `isMobile` 상태를 업데이트합니다.

---

## 3. useIssueHook (`useIssueHook.ts`)

- **훅 설명**: Supabase를 사용하여 이슈(버그/기능 제보) 게시판의 CRUD 및 댓글 기능을 관리하는 훅입니다.
- **Input (Arguments)**: 없음
- **Output (Return Value)**: `UseIssueHookReturn` 객체
  - **State**:
    - `issues`: 이슈 목록 (`Issue[]`)
    - `selectedIssue`: 현재 선택된 이슈 (`Issue | null`)
    - `comments`: 선택된 이슈의 댓글 목록 (`IssueComment[]`)
    - `loading`: 로딩 중 여부 (`boolean`)
    - `error`: 에러 메시지 (`string | null`)
  - **Functions**:
    - `fetchIssues(type: IssueType)`: 이슈 목록 조회 (최신순)
    - `selectIssue(issue: Issue | null)`: 이슈 선택 및 댓글 조회
    - `createIssue(input: CreateIssueInput)`: 새 이슈 생성
    - `updateIssue(id: string, input: UpdateIssueInput)`: 이슈 수정
    - `deleteIssue(id: string)`: 이슈 삭제
    - `fetchComments(issueId: string)`: 댓글 목록 조회
    - `createComment(input: CreateCommentInput)`: 댓글 생성
    - `deleteComment(commentId: string)`: 댓글 삭제
    - `clearSelection()`: 선택된 이슈 및 댓글 초기화

- **State (Internal)**
  - 위 Output의 State 항목과 동일

- **Effects (useEffect)**
  - 없음 (모든 동작은 함수 호출에 의해 트리거됨)

---

## 4. useKoreainvestmentHook (`useKoreainvestmentHook.ts`)

- **훅 설명**: 한국투자증권 API(IPC 통신)를 통해 웹소켓 토큰 발급 및 해외주식 시세(일별/분봉)를 조회하는 훅입니다.
- **Input (Arguments)**: 없음
- **Output (Return Value)**:
  - `getWebSocketToken()`: 웹소켓 접근 토큰(approval_key) 발급 및 스토어 저장
  - `getDaily(params: GetDailyParams)`: 해외주식 일별 시세 조회 (`Daily[]`)
  - `getMinutes(params: GetMinutesParams)`: 해외주식 분봉 시세 조회 (`Minute[]`)
  - `loading`: API 호출 로딩 상태 (`boolean`)
  - `error`: 에러 메시지 (`string | null`)

- **State (Internal)**
  - `loading`: 로딩 상태
  - `error`: 에러 상태

- **Effects (useEffect)**
  - 없음

---

## 5. useRealtimePrice (`useRealtimePrice.ts`)

- **훅 설명**: 한국투자증권 웹소켓에 연결하여 실시간 주식 시세를 수신하는 훅입니다. 싱글톤 패턴(`WebSocketManager`)을 사용하여 중복 연결을 방지합니다.
- **Input (Arguments)**:
  - `symbols`: 구독할 종목 리스트 (`SymbolInfo[]`)
- **Output (Return Value)**:
  - `data`: 실시간 시세 데이터 맵 (`PriceDataMap`)

- **State (Internal)**
  - `data`: 수신된 실시간 데이터 (`{[symbol]: ParsedPriceData}`)

- **Effects (useEffect)**
  - **초기화 및 구독**: 컴포넌트 마운트 시 리스너 등록 및 초기 구독 요청
  - **심볼 변경 감지**: `symbols` 배열 변경 시 재구독 요청 수행

- **WebSocketManager (Internal Class)**
  - 전역 유일 인스턴스로 웹소켓 연결 관리, 자동 재연결, 리스너 관리 수행

---

## 6. useStockHook (`useStockHook.ts`)

- **훅 설명**: 주식 종목의 상세 정보 조회, 뉴스 크롤링, 커뮤니티(토스) 정보를 조회하는 훅입니다.
- **Input (Arguments)**: 없음
- **Output (Return Value)**:
  - `getInfo(ticker: string)`: 종목 기본 정보 조회 (TradingView 크롤링)
  - `getNews(ticker: string)`: 뉴스 정보 조회 (구현 예정/IPC 호출)
  - `getToss(ticker: string)`: 토스 커뮤니티 댓글 조회
  - `loading`: 로딩 상태 (`boolean`)
  - `error`: 에러 메시지 (`string | null`)

- **State (Internal)**
  - `loading`, `error`

- **Effects (useEffect)**
  - 없음

---

## 7. useTradingHook (`useTradingHook.ts`)

- **훅 설명**: 트레이딩 목록 및 히스토리를 관리하는 핵심 훅입니다. Supabase DB와 연동하여 데이터를 CRUD하고 Zustand Store에 동기화합니다.
- **Input (Arguments)**: 없음
- **Output (Return Value)**:
  - **트레이딩 목록**:
    - `fetchTradingList()`: 트레이딩 목록 조회
    - `addTradingItem(ticker, name, exchange)`: 트레이딩 목록에 종목 추가
    - `removeTradingItem(ticker)`: 트레이딩 목록에서 제거
  - **트레이딩 히스토리**:
    - `fetchHistories()`: 전체 트레이딩 기록 조회
    - `addHistory(history)`: 수동 기록 추가
    - `updateHistory(id, updates)`: 기록 수정 (매도 처리 등)
    - `buyStock(ticker, price)`: 매수 실행 (LIFO 스택 추가, 수량 자동 계산)
    - `sellStock(ticker, price)`: 매도 실행 (LIFO 스택 최신 항목 매도 처리)
  - `cleanupDuplicates()`: 트레이딩 목록 중복 데이터 정리
  - `loading`, `error`

- **State (Internal)**
  - `loading`, `error`

- **Effects (useEffect)**
  - 없음

---

## 8. useTradingViewHook (`useTradingViewHook.ts`)

- **훅 설명**: TradingView 데이터를 사용하여 여러 종목의 볼린저 밴드 및 시가총액 데이터를 일괄 조회하는 훅입니다.
- **Input (Arguments)**: 없음
- **Output (Return Value)**:
  - `fetchBBData(tickers: string[])`: 종목 코드 배열을 받아 볼린저 밴드 데이터 조회

- **State (Internal)**
  - 없음 (Zustand `useTradingViewStore` 사용)

- **Effects (useEffect)**
  - 없음

---

## 9. useTrendHook (`useTrendHook.ts`)

- **훅 설명**: 한국투자증권 API 데이터를 기반으로 이동평균선(MA) 추세를 분석하는 훅입니다. 일별 및 분봉 추세를 계산합니다.
- **Input (Arguments)**: 없음
- **Output (Return Value)**:
  - `getTrendDaily(params)`: 일별 데이터 기반 추세 분석 (MA 20, 50, 100, 200)
  - `getTrendMinutes(params)`: 분봉 데이터 기반 추세 분석 (MA 20, 50, 100, 200)
  - `getTrends(sp500List, onProgress)`: 여러 종목의 일별 추세를 병렬(Worker)로 일괄 분석
  - `loading`, `error`

- **Internal Logic**
  - `calculateMADaily`, `calculateMAMinute`: 이동평균 계산
  - `calculateTrendMetrics`: 기울기 및 가속도를 백분율(%)로 변환 후 합산하여 추세 강도 및 방향 계산

- **Effects (useEffect)**
  - 없음

---

## 10. useTrendQueue (`useTrendQueue.ts`)

- **훅 설명**: `useTrendHook`을 사용하여 추세 조회를 순차적으로 처리하는 큐(Queue) 시스템 훅입니다. API 과부하 방지를 위한 쓰로틀링(1분)과 딜레이가 적용되어 있습니다.
- **Input (Arguments)**: 없음
- **Output (Return Value)**:
  - `requestTrend(ticker, exchange)`: 추세 조회 요청을 큐에 추가하고 결과를 Promise로 반환
  - `isLoading(ticker, exchange)`: 특정 종목이 조회 중인지 확인
  - `getCachedTrend(ticker, exchange)`: 캐시된 추세 데이터 반환

- **State (Internal)**
  - `queueRef`: 요청 대기열
  - `isProcessingRef`: 현재 처리 중 여부
  - `lastFetchTimeRef`: 마지막 조회 시간 (쓰로틀링용)
  - `trendCacheRef`: 조회 결과 캐시

- **Effects (useEffect)**
  - 없음 (`processQueue` 함수 내에서 비동기 루프 처리)