# stores (Zustand Store) 룰 및 문서화

## 1. useAccountStore (`useAccountStore.ts`)

- **저장소 설명**: 한국투자증권 계좌 정보, 접근 토큰, 웹소켓 키 등을 관리하는 저장소입니다. `localStorage`에 상태가 지속(persist)됩니다.

### State (Variables)
- `accessToken`: 한국투자증권 API 접근 토큰 (OAuth)
- `approvalKey`: 실시간 웹소켓(WebSocket) 접속용 승인 키
- `selectedAccount`: 현재 선택된 활성 계좌 정보
- `accounts`: 등록된 모든 계좌 목록 (`Account[]`)

### Actions (Functions)
- `setAccessToken(token)`: 트레이딩에 필요한 접근 토큰을 저장합니다.
- `setApprovalKey(approvalKey)`: 웹소켓 연결에 필요한 승인 키를 저장합니다.
- `addAccount(account)`: 새로운 계좌를 목록에 추가합니다. 중복된 계좌번호는 추가되지 않습니다.
- `removeAccount(cano)`: 계좌번호(`cano`)를 받아 해당 계좌를 삭제합니다. 선택된 계좌가 삭제되면 다른 계좌가 자동으로 선택되거나 선택 해제됩니다.
- `selectAccount(cano)`: 계좌번호를 통해 활성 계좌를 선택합니다.
- `reset()`: 로그아웃 등을 위해 모든 계좌 및 토큰 정보를 초기화합니다.

---

## 2. useAuthStore (`useAuthStore.ts`)

- **저장소 설명**: 사용자 인증 정보(Supabase User ID, 카카오 토큰 등)를 관리합니다. `localStorage`에 지속됩니다.

### State (Variables)
- `userId`: Supabase 사용자 고유 ID (UUID)
- `kakaoToken`: 카카오 로그인 토큰 (JWT, 세션 유지용)
- `email`: 사용자 이메일
- `thumbnailUrl`: 사용자 프로필 이미지 URL
- `name`: 사용자 이름

### Actions (Functions)
- `isLoggedIn()`: 현재 로그인 상태인지 확인합니다. (userId와 email 존재 여부)
- `login(data)`: 로그인 성공 시 사용자 정보를 저장합니다.
  - Input: `{ userId, kakaoToken, email, thumbnailUrl, name? }`
- `logout()`: 사용자 정보를 모두 초기화하여 로그아웃 처리합니다.

---

## 3. useBalanceStore (`useBalanceStore.ts`)

- **저장소 설명**: 계좌의 잔고 및 보유 종목 현황을 관리합니다.

### State (Variables)
- `holdings`: 현재 보유 중인 종목 리스트 (`Holding[]`)
- `balance`: 계좌의 예수금 및 평가 금액 정보 (`Balance`)
- `isLoading`: 데이터 로딩 중 여부
- `error`: 에러 메시지

### Actions (Functions)
- `setHoldings(holdings)`: 보유 종목 리스트를 업데이트합니다.
- `setBalance(balance)`: 계좌 잔고 정보를 업데이트합니다.
- `setLoading(loading)`: 로딩 상태를 변경합니다.
- `setError(error)`: 에러 상태를 변경하고 로딩을 해제합니다.
- `reset()`: 잔고 및 보유 종목 정보를 초기화합니다.

---

## 4. useRealtimePriceStore (`useRealtimePriceStore.ts`)

- **저장소 설명**: 웹소켓을 통해 수신되는 실시간 주식 가격 데이터를 관리합니다.

### State (Variables)
- `priceData`: 종목 코드를 키로 하는 실시간 가격 데이터 맵 (`Map<string, RealtimePrice>`)
- `isConnected`: 웹소켓 연결 상태

### Actions (Functions)
- `updatePrice(data)`: 수신된 실시간 데이터를 맵에 업데이트합니다.
- `setConnected(connected)`: 웹소켓 연결 상태를 설정합니다.
- `getPrice(ticker)`: 특정 종목(`ticker`)의 최신 실시간 가격 데이터를 반환합니다.
- `clearAll()`: 모든 실시간 데이터와 연결 상태를 초기화합니다.

---

## 5. useSP500Store (`useSP500Store.ts`)

- **저장소 설명**: S&P 500 종목 리스트를 관리합니다.

### State (Variables)
- `sp500`: S&P 500 종목 리스트 (`SP500Stock[]`)
- `isLoading`: 데이터 로딩 상태
- `error`: 에러 메시지

### Actions (Functions)
- `setSP500(stocks)`: S&P 500 종목 리스트를 설정합니다.
- `setLoading(loading)`: 로딩 상태를 설정합니다.
- `setError(error)`: 에러 메시지를 설정합니다.
- `reset()`: 데이터를 초기화합니다.

---

## 6. useSettingStore (`useSettingStore.ts`)

- **저장소 설명**: 애플리케이션 전역 설정(예: 다크모드)을 관리합니다. `localStorage`에 지속됩니다.

### State (Variables)
- `darkMode`: 다크모드 활성화 여부 (`boolean`)

### Actions (Functions)
- `toggleDarkMode()`: 다크모드 상태를 토글(ON/OFF)하고 HTML 클래스(`dark`)를 제어합니다.
- `setDarkMode(enabled)`: 다크모드 상태를 직접 설정(지정)합니다.

---

## 7. useStockStore (`useStockStore.ts`)

- **저장소 설명**: 현재 선택된 종목의 상세 정보, 뉴스, 커뮤니티 글 등을 관리합니다. `sessionStorage`에 지속됩니다.

### State (Variables)
- `ticker`: 현재 선택된 종목 코드
- `info`: 종목 상세 정보 (`StockInfo`)
- `news`: 관련 뉴스 리스트 (`Board[]`)
- `naver`: 네이버 증권 커뮤니티 글 리스트
- `toss`: 토스 증권 커뮤니티 글 리스트

### Actions (Functions)
- `setTicker(ticker)`: 현재 보고 있는 종목을 설정합니다.
- `setInfo(info)`: 종목 정보를 저장합니다.
- `setNews(news)`: 뉴스 데이터를 저장합니다.
- `setNaver(naver)`: 네이버 커뮤니티 글을 저장합니다.
- `setToss(toss)`: 토스 커뮤니티 글을 저장합니다.
- `clearStock()`: 선택된 종목과 관련된 모든 데이터를 초기화합니다.

---

## 8. useTradingStore (`useTradingStore.ts`)

- **저장소 설명**: 사용자의 트레이딩 목록(관심 종목 등)과 매매 히스토리를 관리합니다. DB 중심 아키텍처를 따르며, Hooks가 데이터를 Fetch한 후 이곳에 저장합니다. `localStorage`에 지속됩니다.

### State (Variables)
- `tradings`: 트레이딩 목록 리스트 (`TradingListItem[]`)
- `histories`: 매수/매도 이력 리스트 (`TradingHistory[]`)

### Actions (Functions)
- `setTradings(tradings)`: 트레이딩 목록을 전체 업데이트합니다.
- `isInTrading(ticker)`: 특정 종목이 트레이딩 목록에 있는지 확인합니다.
  - Output: `boolean`
- `setHistories(histories)`: 매매 이력을 전체 업데이트합니다.
- `getHistoriesByTicker(ticker)`: 특정 종목의 매매 이력만 필터링하여 반환합니다.

---

## 9. useTradingViewStore (`useTradingViewStore.ts`)

- **저장소 설명**: TradingView에서 크롤링/조회한 볼린저 밴드(BB) 및 시가총액 데이터를 관리합니다. 앱 종료 시 초기화됩니다.

### State (Variables)
- `bbDataMap`: 종목별 볼린저 밴드 데이터 맵 (`Map<string, TradingViewBBData>`)
- `isLoading`: 로딩 상태
- `error`: 에러 메시지
- `isFetched`: 데이터 조회 완료 여부 플래그

### Actions (Functions)
- `setBBData(dataList)`: 여러 종목의 BB 데이터를 한 번에 맵으로 변환하여 저장합니다.
- `getBBData(ticker)`: 특정 종목의 BB 데이터를 반환합니다.
- `setLoading(loading)`: 로딩 상태를 설정합니다.
- `setError(error)`: 에러 메시지를 설정합니다.
- `reset()`: 모든 데이터를 초기화합니다.

---

## 10. useTrendStore (`useTrendStore.ts`)

- **저장소 설명**: 분석된 이동평균 추세(Trend) 데이터를 관리합니다. `sessionStorage`에 지속됩니다.

### State (Variables)
- `trends`: 분석된 추세 데이터 리스트 (`Trend[]`)

### Actions (Functions)
- `setTrends(trends)`: 추세 데이터 리스트를 전체 교체합니다.
- `addTrend(trend)`: 새로운 추세 데이터를 리스트에 추가합니다.
- `clearTrends()`: 모든 추세 데이터를 삭제합니다.
- `getTrendByTicker(ticker)`: 특정 종목의 추세 데이터를 찾아 반환합니다.