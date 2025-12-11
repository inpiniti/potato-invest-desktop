# IPC 룰 문서
이 문서는 Electron Main 프로세스와 Renderer 프로세스 간의 통신(IPC) 채널을 정의합니다. `electron/main.ts`에 정의된 핸들러들을 기준으로 작성되었습니다.

## 1. open-external
- **IPC 설명**: 시스템 기본 브라우저를 사용하여 외부 URL을 엽니다.
- **Input**:
  - `url` (string): 열고자 하는 외부 링크 URL
- **Output**: `void`
- **IPC 예시**:
  ```typescript
  window.ipcRenderer.invoke('open-external', 'https://google.com')
  ```

## 2. oauth-login
- **IPC 설명**: OAuth 로그인을 위한 새 윈도우를 열고, 리다이렉트 URL에서 토큰을 추출하여 반환합니다.
- **Input**:
  - `loginUrl` (string): 소셜 로그인(카카오 등) 시작 URL
- **Output**:
  - `accessToken` (string): 액세스 토큰
  - `refreshToken` (string): 리프레시 토큰
- **IPC 예시**:
  ```typescript
  const { accessToken, refreshToken } = await window.ipcRenderer.invoke('oauth-login', 'https://api.kakao.com/oauth/...')
  ```

## 3. korea-invest-auth
- **IPC 설명**: 한국투자증권 API 사용을 위한 접근 토큰(Access Token)을 발급받습니다.
- **Input**:
  - `appkey` (string): 한투 API App Key
  - `appsecret` (string): 한투 API App Secret
- **Output**:
  - `accessToken` (string): 발급된 접근 토큰
  - `tokenType` (string): 토큰 타입 (Bearer 등)
  - `expiresIn` (number): 만료 시간 (초)
  - `tokenExpired` (string): 만료 일시
- **IPC 예시**:
  ```typescript
  const auth = await window.ipcRenderer.invoke('korea-invest-auth', { appkey: '...', appsecret: '...' })
  ```

## 4. korea-invest-approval
- **IPC 설명**: 한국투자증권 실시간 웹소켓 접속을 위한 승인 키(Approval Key)를 발급받습니다.
- **Input**:
  - `appkey` (string): 한투 API App Key
  - `appsecret` (string): 한투 API App Secret
- **Output**:
  - `approvalKey` (string): 웹소켓 접속용 승인 키
- **IPC 예시**:
  ```typescript
  const { approvalKey } = await window.ipcRenderer.invoke('korea-invest-approval', { appkey: '...', appsecret: '...' })
  ```

## 5. korea-invest-balance
- **IPC 설명**: 해외 주식 계좌의 잔고 및 보유 종목 현황을 조회합니다.
- **Input**:
  - `accessToken` (string): 접근 토큰
  - `appkey` (string): App Key
  - `appsecret` (string): App Secret
  - `cano` (string): 종합계좌번호 (8자리)
  - `acntPrdtCd` (string, optional): 계좌상품코드 (기본값: '01' 등 IPC 내부 처리)
- **Output**:
  - `holdings` (Array): 보유 종목 리스트 (output1)
  - `balance` (Object): 계좌 잔고 상세 (output3)
- **IPC 예시**:
  ```typescript
  const { holdings, balance } = await window.ipcRenderer.invoke('korea-invest-balance', { ...params })
  ```

## 6. sp500-fetch
- **IPC 설명**: Wikipedia를 크롤링하여 S&P 500 종목 리스트(티커, 회사명, 거래소)를 가져옵니다.
- **Input**: 없음
- **Output**:
  - `Array<{ ticker: string, name: string, exchange: string }>`: S&P 500 종목 배열
- **IPC 예시**:
  ```typescript
  const sp500List = await window.ipcRenderer.invoke('sp500-fetch')
  ```

## 7. korea-invest-daily
- **IPC 설명**: 한국투자증권 API를 통해 해외주식의 일별 시세를 조회합니다. (최대 300일치 데이터를 위해 내부적으로 반복 호출)
- **Input**:
  - `accessToken`, `appkey`, `appsecret`: 인증 정보
  - `ticker` (string): 종목 코드 (예: AAPL)
  - `exchange` (string): 거래소 코드 (NAS, NYS 등)
- **Output**:
  - `Array`: 일별 시세 데이터 배열 (output2)
- **IPC 예시**:
  ```typescript
  const dailyData = await window.ipcRenderer.invoke('korea-invest-daily', { ticker: 'TSLA', exchange: 'NAS', ...auth })
  ```

## 8. korea-invest-minutes
- **IPC 설명**: 한국투자증권 API를 통해 해외주식의 분봉(1분봉) 시세를 조회합니다. (최대 240개 데이터를 위해 내부적으로 반복 호출)
- **Input**:
  - `accessToken`, `appkey`, `appsecret`: 인증 정보
  - `ticker` (string): 종목 코드
  - `exchange` (string): 거래소 코드
- **Output**:
  - `Array`: 분봉 시세 데이터 배열 (output2)
- **IPC 예시**:
  ```typescript
  const minuteData = await window.ipcRenderer.invoke('korea-invest-minutes', { ticker: 'TSLA', exchange: 'NAS', ...auth })
  ```

## 9. toss-crawl
- **IPC 설명**: 토스증권 커뮤니티(WTS API)를 통해 특정 종목의 최신 댓글을 크롤링합니다.
- **Input**:
  - `ticker` (string): 종목 코드
- **Output**:
  - `productCode` (string): 토스 내부 상품 코드
  - `comments` (Array): 댓글 리스트 (작성자, 내용, 날짜 등 포함)
- **IPC 예시**:
  ```typescript
  const { comments } = await window.ipcRenderer.invoke('toss-crawl', { ticker: 'AAPL' })
  ```

## 10. tradingview-crawl
- **IPC 설명**: TradingView Scanner API를 사용하여 종목의 상세 재무, 배당, 기술적 지표 등 방대한 정보를 조회합니다.
- **Input**:
  - `ticker` (string): 종목 코드
- **Output**:
  - `Object`: 종목 상세 정보 (기본정보, 가치평가, 배당, 수익성, 대차대조표, 기술적지표 등 구조화된 객체) 또는 `null`
- **IPC 예시**:
  ```typescript
  const stockInfo = await window.ipcRenderer.invoke('tradingview-crawl', { ticker: 'NVDA' })
  ```

## 11. news-crawl
- **IPC 설명**: 토스증권 API를 통해 특정 종목과 관련된 최신 뉴스를 크롤링합니다.
- **Input**:
  - `ticker` (string): 종목 코드
- **Output**:
  - `Array<{ author, title, content, createdAt, thumbnail }>`: 뉴스 기사 리스트
- **IPC 예시**:
  ```typescript
  const news = await window.ipcRenderer.invoke('news-crawl', { ticker: 'MSFT' })
  ```

## 12. tradingview-list
- **IPC 설명**: TradingView Scanner API를 사용하여 여러 종목의 볼린저 밴드(BB) 데이터와 시가총액을 일괄 조회합니다. S&P 500 전체 조회 등에 사용됩니다.
- **Input**:
  - `tickers` (string[]): 조회할 티커 심볼 배열
- **Output**:
  - `Array<{ ticker, close, bbUpper, bbBasis, bbLower, marketCap }>`: 조회된 종목 데이터 리스트
- **IPC 예시**:
  ```typescript
  const bbDataList = await window.ipcRenderer.invoke('tradingview-list', { tickers: ['AAPL', 'TSLA', 'GOOGL'] })
  ```