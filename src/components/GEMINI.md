# 컴포넌트 룰 및 문서화

## 기본 규칙
- `/src/components` 내의 파일은 모두 컴포넌트입니다.
- `ui` 폴더 하위의 컴포넌트는 외부 라이브러리(shadcn/ui)이므로 문서화 대상에서 제외합니다.

---

## 컴포넌트 목록

### 1. TradingViewWidgetChart (`TradingViewWidgetChart.tsx`)
- **Input (Props)**
  - `symbol` (string, optional): 종목 코드 (기본값: "AAPL")
  - `market` (string, optional): 거래소 코드 (기본값: "NASDAQ")
- **Output (Events)**
  - 없음
- **설명**
  - TradingView의 Advanced Chart 위젯을 렌더링합니다.
  - 심볼과 마켓에 따라 동적으로 차트를 로드합니다.
- **예제**
  ```tsx
  <TradingViewWidgetChart symbol="TSLA" market="NASDAQ" />
  ```

### 2. AboutDialog (`about-dialog.tsx`)
- **Input (Props)**
  - `open` (boolean): 다이얼로그 표시 여부
  - `onOpenChange` ((open: boolean) => void): 다이얼로그 상태 변경 핸들러
- **Output (Events)**
  - `onOpenChange`: 다이얼로그 닫기 시 발생
- **설명**
  - 애플리케이션 정보(버전, 기술 스택, 제작자 등)를 보여주는 다이얼로그입니다.
- **예제**
  ```tsx
  <AboutDialog open={isOpen} onOpenChange={setIsOpen} />
  ```

### 3. AccountSettingsDialog (`account-settings-dialog.tsx`)
- **Input (Props)**
  - `open` (boolean): 다이얼로그 표시 여부
  - `onOpenChange` ((open: boolean) => void): 다이얼로그 상태 변경 핸들러
- **Output (Events)**
  - `onOpenChange`: 다이얼로그 닫기 시 발생
- **설명**
  - 한국투자증권 계좌 관리(추가, 삭제) 및 인증/잔고 조회를 수행하는 다이얼로그입니다.
- **예제**
  ```tsx
  <AccountSettingsDialog open={isOpen} onOpenChange={setIsOpen} />
  ```

### 4. AppSidebar (`app-sidebar.tsx`)
- **Input (Props)**
  - `React.ComponentProps<typeof Sidebar>`: shadcn sidebar props
- **Output (Events)**
  - 없음 (내부적으로 전역 스토어 사용)
- **설명**
  - 애플리케이션의 메인 사이드바입니다.
  - 메뉴 이동, 보유 종목 및 S&P 500 리스트 표시, 각종 다이얼로그 트리거 기능을 포함합니다.
- **예제**
  ```tsx
  <AppSidebar />
  ```

### 5. ErrorBoundary (`error-boundary.tsx`)
- **Input (Props)**
  - `children` (ReactNode): 자식 컴포넌트
- **Output (Events)**
  - 없음
- **설명**
  - 자식 컴포넌트 트리에서 발생하는 JavaScript 에러를 포착하고 폴백 UI를 보여주는 래퍼 컴포넌트입니다.
  - 흰 화면(White Screen) 방지 및 복구(새로고침) 기능을 제공합니다.
- **예제**
  ```tsx
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
  ```

### 6. IssueDialog (`issue-dialog.tsx`)
- **Input (Props)**
  - `open` (boolean): 다이얼로그 표시 여부
  - `onOpenChange` ((open: boolean) => void): 다이얼로그 상태 변경 핸들러
  - `type` ("bug" | "feature"): 이슈 타입 (버그 제보 또는 기능 제안)
- **Output (Events)**
  - `onOpenChange`: 다이얼로그 닫기 시 발생
- **설명**
  - 버그 제보 및 기능 제안을 위한 게시판형 다이얼로그입니다.
  - 이슈 등록, 수정, 삭제 및 댓글 기능을 제공합니다.
- **예제**
  ```tsx
  <IssueDialog open={isOpen} onOpenChange={setIsOpen} type="bug" />
  ```

### 7. MainContent (`main-content.tsx`)
- **Input (Props)**
  - 없음
- **Output (Events)**
  - 없음
- **설명**
  - 앱의 메인 컨텐츠 영역입니다.
  - 종목 상세 정보, 차트, 트레이딩 카드 리스트 및 자동 매매 로직을 포함합니다.
- **예제**
  ```tsx
  <MainContent />
  ```

### 8. NavUser (`nav-user.tsx`)
- **Input (Props)**
  - 없음
- **Output (Events)**
  - 없음
- **설명**
  - 사이드바 하단의 사용자 프로필 영역입니다.
  - 로그인/로그아웃, 다크모드 토글, 계정 설정 접근 기능을 제공합니다.
- **예제**
  ```tsx
  <NavUser />
  ```

### 9. PatchNotesDialog (`patch-notes-dialog.tsx`)
- **Input (Props)**
  - `open` (boolean): 다이얼로그 표시 여부
  - `onOpenChange` ((open: boolean) => void): 다이얼로그 상태 변경 핸들러
- **Output (Events)**
  - `onOpenChange`: 다이얼로그 닫기 시 발생
- **설명**
  - 버전별 패치 노트를 보여주는 다이얼로그입니다.
- **예제**
  ```tsx
  <PatchNotesDialog open={isOpen} onOpenChange={setIsOpen} />
  ```

### 10. RightPanel (`right-panel.tsx`)
- **Input (Props)**
  - 없음
- **Output (Events)**
  - 없음
- **설명**
  - 화면 우측의 정보 패널입니다.
  - 선택된 종목의 뉴스 및 커뮤니티(토스 증권 댓글) 정보를 탭으로 보여줍니다.
- **예제**
  ```tsx
  <RightPanel />
  ```

### 12. TradingCard (`trading/TradingCard.tsx`)
- **Input (Props)**
  - `trading`: 트레이딩 정보 (티커, 거래소 등)
  - `realtimeData`: 실시간 시세 데이터
  - `trend`: 추세 데이터
  - `trendLoading`: 추세 로딩 상태
  - `bbData`: 볼린저 밴드 데이터
  - `handleRemoveClick`: 제거 버튼 핸들러
  - `onAutoTrade`: 자동 매매 실행 핸들러
  - `onSelectStock`: 종목 선택 핸들러
- **Output (Events)**
  - `handleRemoveClick`, `onAutoTrade`, `onSelectStock`
- **설명**
  - 개별 종목의 트레이딩 상태를 보여주는 카드 컴포넌트입니다.
  - 내부 로직은 `useTradingCardLogic`으로 분리되었으며, `TradingHeader`, `TradingTrendBadges` 등의 하위 컴포넌트를 조합하여 구성됩니다.
  - **Sub-Components**:
    - `TradingHeader`: 티커, 이름, 가격 정보 및 볼린저 밴드 배지 표시
    - `TradingTrendBadges`: 이동평균선 추세 상태 배지 표시 (Simple/Detailed 모드)
    - `TradingMicroStructure`: 체결강도, 호가 잔량(OBI), 스프레드 정보 표시
    - `TradingHistoryTable`: 매수/매도 이력 테이블 표시
- **예제**
  ```tsx
  <TradingCard trading={tradingItem} realtimeData={data} ... />
  ```

### 12. TrendAnalysisDialog (`trend-analysis-dialog.tsx`)
- **Input (Props)**
  - `open` (boolean): 다이얼로그 표시 여부
  - `onOpenChange` ((open: boolean) => void): 다이얼로그 상태 변경 핸들러
- **Output (Events)**
  - `onOpenChange`: 다이얼로그 닫기 시 발생
- **설명**
  - S&P 500 전 종목에 대한 이동평균 추세 분석을 일괄 수행하는 다이얼로그입니다.
- **예제**
  ```tsx
  <TrendAnalysisDialog open={isOpen} onOpenChange={setIsOpen} />
  ```