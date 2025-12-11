# types 룰 및 문서화

## 1. account.ts

### Account
- **설명**: 계좌 정보를 정의하는 인터페이스입니다.
- **Properties**:
  - `cano` (string): 종합계좌번호
  - `appkey` (string): 앱키
  - `appsecret` (string): 앱시크릿키
  - `alias` (string, optional): 계좌 별명

---

## 2. balance.ts

### Holding
- **설명**: 보유 종목에 대한 상세 정보를 정의하는 인터페이스입니다. (한국투자증권 API 응답 구조)
- **Properties**:
  - `prdt_name` (string): 상품명
  - `cblc_qty13` (string): 잔고수량
  - `thdt_buy_ccld_qty1` (string): 당일매수체결수량
  - `thdt_sll_ccld_qty1` (string): 당일매도체결수량
  - `evlu_pfls_rt1` (string): 평가손익율
  - `pdno` (string): 상품번호 (종목코드)
  - `ovrs_now_pric1` (string): 해외현재가격
  - `avg_unpr3` (string): 평균단가
  - ... (기타 상세 필드 포함)

### Balance
- **설명**: 계좌의 전반적인 잔고 및 평가 금액 정보를 정의하는 인터페이스입니다.
- **Properties**:
  - `pchs_amt_smtl` (string): 매입금액합계
  - `evlu_amt_smtl` (string): 평가금액합계
  - `dncl_amt` (string): 예수금액
  - `frcr_evlu_tota` (string): 외화평가총액
  - `evlu_erng_rt1` (string): 평가수익율
  - ... (기타 자산 관련 필드)

---

## 3. daily.ts

### Daily
- **설명**: 해외 주식의 일별 시세 데이터를 정의합니다. (300일치 조회 시 사용)
- **Properties**:
  - `xymd` (string): 일자(YYYYMMDD)
  - `clos` (string): 종가
  - `sign` (string): 대비기호
  - `diff` (string): 대비
  - `rate` (string): 등락율
  - `open` (string): 시가
  - `high` (string): 고가
  - `low` (string): 저가
  - `tvol` (string): 거래량

---

## 4. electron.d.ts

### Window
- **설명**: Electron의 IPC 통신을 위해 `window` 객체에 확장된 `ipcRenderer` 인터페이스를 정의합니다.
- **Methods**:
  - `koreaInvestAuth`: 한국투자증권 접근 토큰 발급
  - `koreaInvestBalance`: 계좌 잔고 및 보유 종목 조회
  - `koreaInvestDaily`: 일별 시세 조회
  - `koreaInvestMinutes`: 분봉 시세 조회
  - `sp500Fetch`: S&P 500 종목 리스트 크롤링
  - `tradingViewCrawl`: TradingView 종목 상세 정보 크롤링
  - `tradingViewList`: TradingView 볼린저 밴드 및 시가총액 일괄 조회
  - ... (기타 IPC 메서드)

---

## 5. issue.ts

### Issue
- **설명**: 이슈(버그 제보/기능 제안) 게시글 타입입니다. (CamelCase 변환 후)
- **Properties**:
  - `id` (string): 이슈 ID
  - `title` (string): 제목
  - `content` (string): 내용
  - `type` ('bug' | 'feature'): 이슈 타입
  - `status` ('open' | 'closed'): 진행 상태

### IssueRecord
- **설명**: Supabase `issues` 테이블의 레코드 타입입니다. (Snake_case)

### IssueComment
- **설명**: 이슈에 달린 댓글 타입입니다.

---

## 6. minute.ts

### Minute
- **설명**: 해외 주식의 분봉 시세 데이터를 정의합니다.
- **Properties**:
  - `tymd` (string): 현지영업일자
  - `khms` (string): 한국기준시간
  - `last` (string): 종가 (현재가)
  - `evol` (string): 체결량

---

## 7. realtime.ts

### RealtimePrice
- **설명**: 웹소켓을 통해 들어오는 실시간 주식 호가 및 체결 데이터입니다.
- **Properties (Keys explained)**:
  - `rsym` (string): 실시간종목코드
  - `last` (string): 현재가
  - `rate` (string): 등락율
  - `pbid` (string): 매수호가
  - `pask` (string): 매도호가
  - `vbid` (string): 매수잔량
  - `vask` (string): 매도잔량
  - `strn` (string): 체결강도

### SubscriptionInfo
- **설명**: 웹소켓 구독 요청에 필요한 종목 정보입니다.

---

## 8. sp500.ts

### SP500Stock
- **설명**: 크롤링된 S&P 500 종목 기본 정보입니다.
- **Properties**:
  - `ticker`: 티커 심볼
  - `name`: 회사명
  - `exchange`: 거래소

---

## 9. stock.ts

### StockInfo
- **설명**: TradingView에서 크롤링한 종목의 상세 재무 및 기술적 지표 정보입니다.
- **Properties**:
  - `valuation`: PER, PBR 등 가치 평가 지표
  - `financials`: 매출, 이익 등 재무 지표
  - `technical`: RSI, MACD, 이동평균선 등 기술적 지표

### Board
- **설명**: 뉴스 또는 커뮤니티(토스/네이버) 게시글 정보입니다.

---

## 10. trading.ts

### TradingListItem
- **설명**: 사용자가 트레이딩 목록(관심 종목 등)에 추가한 아이템입니다.
- **Properties**:
  - `uid`: 사용자 ID
  - `ticker`: 종목 코드
  - `exchange`: 거래소

### TradingHistory
- **설명**: 사용자의 실제 매매(매수/매도) 기록입니다.
- **Properties**:
  - `buyPrice`, `buyQuantity`, `buyTime`: 매수 정보
  - `sellPrice`, `sellQuantity`, `sellTime`: 매도 정보 (미체결 시 null)

---

## 11. tradingview.ts

### TradingViewBBData
- **설명**: TradingView 스크리너를 통해 조회한 볼린저 밴드 및 시가총액 데이터입니다.
- **Properties**:
  - `bbUpper`, `bbLower`, `bbBasis`: 볼린저 밴드 상/하단/중간값
  - `marketCap`: 시가총액

### BBSignal
- **설명**: 볼린저 밴드 위치에 따른 매매 신호 (`강력매수` ~ `강력매도`)

---

## 12. trend.ts

### TrendMetric
- **설명**: 이동평균선의 현재 상태를 점수화한 지표입니다.
- **Properties**:
  - `slope` (number): 기울기 점수 (상승세 강도)
  - `accel` (number): 가속도 점수 (추세 변화 속도)
  - `description` (string): 상태 설명

### Trend
- **설명**: 특정 종목의 모든 이동평균선(20, 50, 100, 200일) 추세 분석 결과입니다.