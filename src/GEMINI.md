# App 화면 레이아웃 룰 및 문서화

## 1. 레이아웃 구조

`App.tsx`는 애플리케이션의 최상위 컴포넌트로서 전체적인 레이아웃 구조를 정의하고 전역 상태 초기화를 담당합니다.

### 전체 구조 (Flex Layout)
화면은 `flex h-screen w-full` 컨테이너 내에서 3단 분할 구조를 가집니다.
1.  **좌측: AppSidebar (`<AppSidebar />`)**:
    -   너비: `350px` (CSS 변수 `--sidebar-width`로 제어)
    -   역할: 네비게이션, 계좌 선택, 보유 종목/S&P 500 리스트 표시
2.  **중앙: MainContent (`<MainContent />`)**:
    -   너비: `flex-1` (남은 공간 모두 차지)
    -   역할: 차트, 트레이딩 카드 리스트(매매 패널), 종목 상세 정보 등 핵심 기능 영역
3.  **우측: RightPanel (`<RightPanel />`)**:
    -   너비: `w-80` (320px 고정)
    -   역할: 선택된 종목의 뉴스 및 커뮤니티(토스) 반응 표시

### Provider 및 Overlay
-   **SidebarProvider**: shadcn/ui 사이드바 상태 관리를 위한 컨텍스트 제공
-   **Toaster**: `sonner` 라이브러리를 사용한 전역 토스트 메시지 표시 (`top-right` 위치)
-   **ErrorBoundary**: 앱 전역 에러 포착 및 복구 UI 제공 (최상위 래퍼)

---

## 2. App 레벨 useEffect 설명

`App.tsx`에서는 앱 실행 시 필요한 초기화 작업들을 여러 `useEffect` 훅으로 분리하여 관리합니다.

### 1) 다크모드 초기화
-   **Dependency**: `[darkMode]`
-   **동작**: `useSettingStore`의 `darkMode` 상태 변경 시 HTML `root` 요소에 `dark` 클래스를 추가하거나 제거하여 테마를 적용합니다.

### 2) 사용자 세션 관리 (Supabase)
-   **Dependency**: `[login, logout]`
-   **동작**:
    -   앱 시작 시 Supabase 세션을 확인하여 로그인 상태를 복원합니다.
    -   `onAuthStateChange` 리스너를 등록하여 로그인/로그아웃 이벤트를 감지하고 `useAuthStore`를 동기화합니다.

### 3) 트레이딩 데이터 로드
-   **Dependency**: `[userId]`
-   **동작**: 사용자가 로그인(`userId` 존재) 상태가 되면 다음을 수행합니다.
    -   `cleanupDuplicates()`: 트레이딩 목록 중복 정리
    -   `fetchTradingList()`: 사용자의 관심 종목(트레이딩 리스트) 로드
    -   `fetchHistories()`: 매매 이력 로드

### 4) 계좌 초기화 (웹소켓 및 잔고)
-   **Dependency**: `[]` (앱 시작 시 1회, 단 내부적으로 `accessToken` 체크)
-   **동작**: `accessToken`과 `selectedAccount`가 존재하면 다음을 수행합니다.
    -   `koreaInvestApproval`: 한국투자증권 실시간 웹소켓 접속용 `approval_key` 발급 및 저장
    -   `koreaInvestBalance`: 계좌 잔고 및 보유 종목 형황을 조회하여 `useBalanceStore` 업데이트

### 5) S&P 500 데이터 크롤링
-   **Dependency**: `[]` (앱 시작 시 1회)
-   **동작**: `sp500Fetch` IPC를 호출하여 S&P 500 종목 리스트를 크롤링하고 `useSP500Store`에 저장합니다.

### 6) TradingView 데이터 조회 (Sequential)
-   **Dependency**: `[sp500, fetchBBData]`
-   **동작**: **5번**의 S&P 500 데이터 로드가 완료(`sp500` 배열 변경)되면, 해당 종목들의 볼린저 밴드 및 시가총액 데이터를 TradingView에서 일괄 조회(`fetchBBData`)합니다.

### 7) 딥링크 처리
-   **Dependency**: `[]` (앱 시작 시 1회)
-   **동작**: 외부 인증(카카오 등) 후 앱으로 복귀하는 딥링크(`potato-invest://...`)를 감지하여 URL 해시 파라미터(`access_token`, `refresh_token`)를 파싱하고 Supabase 세션을 설정합니다.
