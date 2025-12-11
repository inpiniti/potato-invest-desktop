import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Streamdown } from 'streamdown'
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PatchNotesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PatchVersion {
  version: string
  date: string
  title?: string
  content?: string
  changes?: string[]
}

interface PatchNotesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const versions: PatchVersion[] = [
  {
    version: '0.0.44',
    date: '2025-12-11',
    title: '사이드바 레이아웃 겹침 문제 해결',
    changes: [
      '🐛 사이드바 상단이 타이틀바에 가려지는 UI 버그 수정',
      '📐 AppSidebar 컴포넌트에 고정 위치(top: 32px) 및 높이 스타일 적용',
      '🔧 전체 레이아웃 구조에서 타이틀바와 사이드바의 Z-index 관계 명확화',
    ],
  },
  {
    version: '0.0.43',
    date: '2025-12-11',
    title: '커스텀 타이틀바 및 레이아웃 구조 개선',
    changes: [
      '✨ 커스텀 윈도우 타이틀바 추가 (VS Code 스타일)',
      '🪟 윈도우 제목표시줄 제거 및 최소화/최대화/닫기 버튼 커스텀 구현',
      '🛠️ 상단바에 사이드바, 하단 패널, 우측 패널 토글 버튼 추가',
      '📐 전체 레이아웃 구조 개선 (상단 타이틀바 + 하단 컨텐츠 영역)',
      '🔧 하단 트레이딩 패널 닫기/열기 기능 개선',
    ],
  },
  {
    version: "0.0.42",
    date: "2024-12-11",
    title: "Storybook 통합 및 개발 환경 개선",
    content: `
- **Storybook 도입**
  - UI 컴포넌트 독립 개발 및 테스트 환경 구축
  - 주요 컴포넌트(TradingCard, Sidebar 등) 스토리 작성
  - \`npm run storybook\` 명령어로 실행 가능
  
- **개발 환경 최적화**
  - Vite 설정 수정: Storybook 실행 시 Electron 플러그인 충돌 방지
  - ESM Alias 호환성 수정 (\`__dirname\` 제거)
      `
  },
  {
    version: "0.0.41",
    date: "2025-12-11",
    title: "컴포넌트 리팩토링 및 코드 안정성 강화",
    content: `
### 🧹 TradingCard 컴포넌트 구조 개선

**주요 변경 사항:**
- **컴포넌트 분할**: 비대해진 \`TradingCard\` 컴포넌트를 기능별로 4개의 하위 컴포넌트로 분리하여 가독성과 유지보수성을 극대화했습니다.
  - \`TradingHeader\`: 기본 정보 및 가격 표시
  - \`TradingTrendBadges\`: 추세 분석 배지
  - \`TradingMicroStructure\`: 수급 및 스프레드 지표
  - \`TradingHistoryTable\`: 매매 이력 리스트
- **로직 분리 (Custom Hook)**: 자동 매매, 상태 관리, 데이터 계산 로직을 \`useTradingCardLogic\` 훅으로 완전히 추출하여 UI와 로직의 관심사를 분리했습니다.

### 📈 추세 분석 로직 모듈화

- **유틸리티화**: \`useTrendHook\` 내부에 있던 이동평균 및 추세 강도 계산 로직을 \`src/utils/trend-calculator.ts\`로 분리했습니다.
- **재사용성**: 순수 함수 형태로 분리되어 유닛 테스트가 용이해지고 다른 컴포넌트에서도 쉽게 재사용할 수 있습니다.

**기술적 상세:**
- \`src/components/trading/ui/\`: 하위 컴포넌트 폴더 구조화
- \`src/utils/trend-calculator.ts\`: \`calculateTrendMetrics\`, \`calculateMADaily/Minute\` 이동
`
  },
  {
    version: "0.0.40",
    date: "2025-12-11",
    title: "추세 분석 로직 개선 및 강도 시각화",
    content: `
### 📈 추세 분석 알고리즘 고도화

**주요 변경 사항:**
- **퍼센트(%) 기반 추세 분석**: 기존의 단순 빈도수 기반 점수에서 벗어나, 가격 변동에 따른 기울기(Slope)와 가속도(Accel)를 **퍼센트 단위로 계산 및 합산**하는 방식으로 변경했습니다.
- **가격 독립적 강도 측정**: 주가(Price)가 높은 종목이 기울기가 높게 나오던 문제를 해결하여, 모든 종목을 동일한 기준으로 비교 분석할 수 있게 되었습니다.

### 🎨 트레이딩 UI 업데이트

- **직관적인 배지 색상**: 
  - **빨강 (상승)**: 기울기 > 0
  - **파랑 (하락)**: 기울기 < 0
  - **회색 (보합)**: 기울기 0
- **상세 정보 표시**: 단순히 점수(0~9)만 보여주는 것이 아니라, 구체적인 변화율(예: 1.52%, -0.23%)을 표시하여 추세의 강도를 명확히 알 수 있습니다.

### 🤖 자동 매매 로직 최적화

- **매수 조건**: 상승 추세(\`Slope > 0\`)이면서 모멘텀이 가속(\`Accel > 0\`)될 때 진입
- **매도 조건**: 상승 추세지만 상승 탄력이 둔화(\`Accel < 0\`)되거나 하락 반전 시 매도

**기술적 상세:**
- \`useTrendHook.ts\`: \`calculateTrendMetrics\` 함수 전면 재작성 (합산 로직 적용)
- \`TradingCard.tsx\`: 새로운 퍼센트 지표에 맞게 UI 및 자동매매 조건 수정
- \`AppSidebar.tsx\`: 추천 필터 및 배지 스타일 로직 업데이트
`
  },
  {
    version: "0.0.39",
    date: "2025-12-11",
    title: "아키텍처 리팩토링 및 안정성 강화",
    content: `
### 🏗 초기화 로직 및 컴포넌트 리팩토링

**주요 변경 사항:**
- **App 초기화 로직 분리**: \`App.tsx\`에 산재되어 있던 7개의 \`useEffect\` 로직을 \`useAppInit\` 커스텀 훅으로 추출하여 코드 가독성과 유지보수성을 향상시켰습니다.
- **MainContent 구조 개선**: 거대해진 \`MainContent\` 컴포넌트에서 트레이딩 카드 UI를 \`TradingCard\` 독립 컴포넌트로 분리했습니다.
- **시장 미시구조 지표 추가**: 트레이딩 카드에 매수/매도 압력과 스프레드 상태를 시각적으로 보여주는 지표를 추가했습니다.

### 🛡 에러 바운더리(Error Boundary) 적용

- **앱 안정성 강화**: 렌더링 중 예기치 않은 오류가 발생해도 흰 화면(White Screen)이 아닌 친절한 에러 메시지와 복구 버튼을 제공하여 사용자 경험을 개선했습니다.
- **상세 원인 파악**: 발생한 에러 로그를 UI에 표시하여 문제 원인을 쉽게 파악할 수 있도록 했습니다.

**기술적 상세:**
- \`src/hooks/useAppInit.ts\`: 초기화 로직 통합 훅
- \`src/components/trading/TradingCard.tsx\`: 트레이딩 카드 컴포넌트 분리
- \`src/components/error-boundary.tsx\`: 에러 바운더리 컴포넌트
`
  },
  {
    version: "0.0.38",
    date: "2025-12-11",
    title: "일별/분봉 추세 로직 분리 및 시각화 개선",
    content: `
### 📈 추세 분석 로직 고도화

**주요 변경 사항:**
- **일별/분봉 로직 분리**: 일별(Daily) 데이터와 실시간 분봉(Minutes) 데이터의 추세 판단 기준을 분리하여 정확도를 높였습니다.
- **S&P 500 일별 추세**: 기울기(Slope) 기반으로 단순화하여 직관적인 매매 신호를 제공합니다.
  - **상승 (Red)**: 기울기 3 이상 (강한 상승세)
  - **보합 (Gray)**: 기울기 2
  - **하락 (Blue)**: 기울기 1 이하
- **실시간 분봉 추세**: 기울기와 가속도를 모두 고려한 정밀한 분석을 적용했습니다.
  - **강력 매수**: (0, 3) 패턴
  - **매수**: (0, 1), (0, 2), (1, 2), (1, 3), (2, 3) 패턴
  - **강력 매도**: (4, 0) 패턴

### 🎨 UI 개선

- **사이드바 배지**: S&P 500 목록의 추세 배지가 새로운 일별 로직을 따르도록 업데이트되었습니다.
- **추천 필터**: '추천만 보기' 기능이 새로운 상승 기준(기울기 3 이상)을 정확히 반영합니다.

**기술적 상세:**
- \`useTrendHook.ts\`: \`determineTrend\` 함수 로직 분기 처리
- \`app-sidebar.tsx\`: \`getTrendBadgeStyle\` 함수 업데이트
- \`main-content.tsx\`: \`getTrendStyle\` 함수 분봉 로직 적용
`
  },
  {
    version: "0.0.37",
    date: "2025-12-10",
    title: "웹소켓 싱글톤 패턴 적용 및 자동 매매 조건 개선",
    content: `
### 🔌 웹소켓 아키텍처 개편

**주요 변경 사항:**
- **싱글톤 패턴 적용**: 중복 연결 방지를 위해 전역 WebSocketManager 클래스로 재구성
- **점진적 재연결 백오프**: 연결 실패 시 30초~150초 점진적 대기 시간 적용
- **PINGPONG 응답 처리**: 서버 ping 메시지에 자동 응답하여 연결 유지
- **electron/websocket.ts 제거**: 렌더러 직접 연결로 대체

### 🤖 자동 매매 조건 개선

- **매도 조건**: 하락 추세 + 현재가 > 매수가 (이익 시에만 매도)
- **매수 조건**: 상승전환 + 현재가 < 이전 매수가 (더 싸게만 매수)
- **첫 매수**: 가격 조건 없이 바로 진행

### 🎨 UI 변경

- **트레이딩 패널**: 수동 매수/매도 버튼 제거 (자동 매매만 사용)
- **S&P 500 목록**: 시총 정렬 토글 버튼 추가 (추천 버튼 옆)

**기술적 상세:**
- \`useRealtimePrice.ts\`: WebSocketManager 싱글톤 클래스 구현
- \`main-content.tsx\`: 자동 매매 가격 조건 로직 추가
- \`app-sidebar.tsx\`: sortByMarketCap 상태 및 정렬 로직 추가
`
  },
  {
    version: "0.0.36",
    date: "2025-12-09",
    title: "TradingView 볼린저 밴드 데이터 연동",
    content: `
### 📊 TradingView 볼린저 밴드 연동

**주요 변경 사항:**
- **볼린저 밴드 데이터**: TradingView에서 BB(상단/중단/하단) 및 시가총액 데이터 조회
- **매매 신호 표시**: 강력매수/매수/매도/강력매도 Badge 표시
- **시가총액 표시**: S&P 500 목록에 시가총액($B, $T) 포맷 표시

### 🔧 추세 분석 개선

- **Worker 수 감소**: 동시 API 호출 5개 → 2개로 감소 (Rate Limit 방지)
- **종목 클릭 연동**: 보유종목, 트레이딩 카드 클릭 시 상세 정보 조회

**기술적 상세:**
- \`useTradingViewHook.ts\`: 볼린저 밴드 fetch 훅
- \`useTradingViewStore.ts\`: BB 데이터 전역 상태 관리
- \`types/tradingview.ts\`: TradingViewBBData 타입 및 calculateBBSignal 함수
`
  },
  {
    version: "0.0.35",
    date: "2025-12-09",
    title: "버그 제보 / 기능 제안 게시판 구현",
    content: `
### 📝 이슈 게시판 시스템 구현

**주요 기능:**
- **버그 제보**: 앱 사용 중 발견한 버그를 제보할 수 있는 게시판
- **기능 제안**: 새로운 기능 아이디어를 제안할 수 있는 게시판
- **CRUD 기능**: 게시글 조회, 등록, 수정, 삭제 완벽 지원
- **댓글 시스템**: 게시글에 댓글 등록 및 삭제 가능
- **최신순 정렬**: 가장 최근 작성된 글이 상단에 표시

### 🎨 UI/UX 개선

- **재사용 가능한 게시판 레이아웃**: \`BoardLayout\`, \`ListPanel\`, \`DetailPanel\` 컴포넌트화
- **좌측 목록 / 우측 상세**: VS Code 스타일의 2단 레이아웃
- **등록하기 버튼**: 목록 상단에 배치하여 빠른 글 작성 지원
- **상태 배지**: 열림/닫힘 상태 표시

### 🔧 기술적 상세

- \`useIssueHook.ts\`: 이슈 CRUD 및 댓글 관리 훅
- \`issue-dialog.tsx\`: 버그/기능 이슈 통합 다이얼로그
- \`board-layout.tsx\`: 재사용 가능한 게시판 레이아웃 컴포넌트
- \`textarea.tsx\`: shadcn/ui 스타일 Textarea 컴포넌트 추가
- Supabase \`issues\`, \`issue_comments\` 테이블 연동

### 📋 사이드바 연동

- 앱 로고 클릭 → 드롭다운 메뉴에서 "버그 제보", "기능 제안" 접근

⚠️ **마이그레이션 필요**: \`recreate-issues-table.sql\` 실행 (author_id를 TEXT 타입으로 변경)
`
  },
  {
    version: "0.0.34",
    date: "2025-12-09",
    title: "웹소켓 실시간 구독 리팩토링 및 추세 조회 큐 시스템",
    content: `
### 🔄 웹소켓 실시간 구독 시스템 개편

**주요 변경 사항:**
- **예전 방식 복원**: 트레이딩 목록 변경 시 자동으로 구독/해제 처리 (컴포넌트 레벨에서 관리)
- **거래소(exchange) 지원**: 티커와 함께 거래소 정보(NAS/NYS)를 저장하여 정확한 시세 구독
- **TradingListItem 타입 확장**: \`exchange\` 필드 추가

### 📊 추세 조회 큐 시스템

- **순차 처리**: 여러 종목 동시 조회 시 실패 방지를 위한 큐(Queue) 시스템 도입
- **응답 기준 쓰로틀링**: 요청 시간이 아닌 응답 완료 시간 기준으로 1분 간격 적용
- **API 부하 방지**: 요청 간 200ms 딜레이 적용
- **캐시 유지**: 조회 중에도 기존 추세 데이터는 계속 표시

### 🎨 UI/UX 개선

- **2열 Grid 레이아웃**: 트레이딩 패널이 가로 2개씩 배치되어 화면 활용도 향상
- **테두리 하이라이트**: 실시간 데이터 수신 시 패널 테두리가 1초간 밝아졌다가 서서히 연해지는 애니메이션
- **Loader2 스피너**: 추세 조회 중 lucide-react의 Loader2 아이콘으로 로딩 표시 (기존 데이터 유지)

### 🗑️ 제거된 기능

- **상세조회 제거**: 웹소켓으로 실시간 수신되므로 0.0.33에서 추가된 별도 상세조회 불필요

**기술적 상세:**
- \`useTrendQueue.ts\`: 추세 조회 큐 관리 훅 신규 생성
- \`main-content.tsx\`: TradingCard 분리, 웹소켓 구독 관리, Grid 레이아웃 적용
- \`trading.ts\`: TradingListItem/TradingListRecord에 exchange 필드 추가
- \`useTradingHook.ts\`: addTradingItem에 exchange 파라미터 추가

⚠️ **마이그레이션 필요**: Supabase trading_list 테이블에 exchange 컬럼 추가 필요
`
  },
  {
    version: "0.0.33",
    date: "2025-12-08",
    title: "자동 트레이딩 및 추세 분석 기능 추가",
    content: `
### 🤖 자동 트레이딩 시스템

**주요 변경 사항:**
- **자동 매수 조건**: MA20이 '상승전환'이고 MA50/100/200이 상승 추세일 때 자동 매수
- **자동 매도 조건**: 4개 MA 중 하나라도 하락 또는 하락전환일 때 자동 매도
- **추세 변화 감지**: 조건 충족만으로는 거래하지 않고, 추세가 변경될 때만 거래
- **자동 거래 알림**: 자동 매수/매도 시 Toast 알림 (수동 클릭은 alert 유지)

### 📈 트레이딩 기능 강화

- **실시간 가격 반영**: 매수/매도 시 하드코딩된 1이 아닌 실시간 웹소켓 가격 사용
- **트레이딩 내역 표**: 각 종목 카드에 매수가, 수량, 매도가, 손익 표 표시
- **분봉 추세 분석 (getTrendMinutes)**: 각 종목별 MA20/50/100/200 추세 아이콘 표시

### 🔍 UI/UX 개선

- **검색 필터**: 종목 리스트에서 티커 또는 종목명으로 필터링 기능
- **추천 토글 버튼**: S&P 500 목록에서 4개 MA 모두 상승인 종목만 필터

### 🔧 버그 수정

- **웹소켓 중복 수신 해결**: Zustand store로 실시간 데이터 상태 관리
- **이벤트 리스너 단일화**: App.tsx에서 한 번만 등록하여 n*n 문제 해결

**기술적 상세:**
- \`useRealtimePriceStore.ts\`: 실시간 가격 전역 상태 관리
- \`main-content.tsx\`: 자동 트레이딩 로직 및 추세 변화 감지
- \`app-sidebar.tsx\`: 검색 필터 및 추천 토글 기능
`
  },
  {
    version: "0.0.32",
    date: "2025-12-08",
    title: "실시간 시세 파싱 및 트레이딩 연동",
    content: `
### ⚡ 실시간 데이터 처리 고도화

**주요 변경 사항:**
- **실시간 시세 연동**: 해외주식 실시간 체결가(HDFSCNT0) 데이터를 파싱하여 트레이딩 목록의 각 종목 카드에 실시간 가격 변동을 즉시 반영했습니다.
- **웹소켓 안정성 강화**: 중복 연결 시도로 인한 'ALREADY IN USE appkey' 오류를 해결하기 위해 연결 관리 및 재연결 로직을 개선했습니다.
- **한글 로그 지원**: 터미널 출력 인코딩을 조정하여 로그 가독성을 높였습니다.

**기술적 상세:**
- \`electron/websocket.ts\`: 텍스트 기반 웹소켓 데이터 파싱 로직 추가
- \`src/components/main-content.tsx\`: \`TradingCard\` 컴포넌트 분리 및 실시간 훅 적용
`
  },
  {
    version: "0.0.31",
    date: "2025-12-08",
    title: "트레이딩 목록 동기화 및 버그 수정",
    content: `
### 🛠️ 데이터 무결성 및 안정성 강화

**주요 변경 사항:**
- **트레이딩 목록 동기화**: 로컬 UI와 서버 데이터 간의 불일치를 해결하기 위해 중복 데이터를 자동으로 정리하는 \`cleanupDuplicates\` 로직을 추가했습니다.
- **버그 수정**: 트레이딩 히스토리 추가 시 잘못된 변수 참조로 인해 발생하던 오류를 수정했습니다.

**기술적 상세:**
- \`src/hooks/useTradingHook.ts\` 내 중복 제거 알고리즘 구현
- \`kakaoToken\` -> \`userId\` 변수명 참조 수정
`
  },
  {
    version: "0.0.30",
    date: "2025-12-08",
    title: "패치 노트 고도화 및 버전 히스토리 사이드바",
    content: `
### 📝 패치 노트 시스템 전면 개편

**주요 변경 사항:**
- **사이드바 레이아웃**: 기존의 단일 스크롤 방식에서 벗어나, 좌측 사이드바에 버전 리스트를 배치하고 우측에 상세 내용을 표시하는 2단 레이아웃을 적용했습니다.
- **전체 히스토리 복원**: 프로젝트 초기 버전(v0.0.0)부터 현재까지의 모든 업데이트 내역을 체계적으로 정리하여 기록했습니다.
- **가독성 향상**: 버전별 배지(Badge), 날짜 표시, 마크다운 렌더링을 개선하여 정보 전달력을 높였습니다.

**기술적 상세:**
- \`PatchNotesDialog.tsx\` 리팩토링: 상태 관리(\`selectedVersion\`) 추가 및 조건부 렌더링 로직 개선
- \`Streamdown\` 컴포넌트를 활용한 안정적인 마크다운 렌더링
`
  },
  {
    version: "0.0.29",
    date: "2025-12-08",
    title: "트레이딩과 웹소켓 구독이랑 연동",
    content: `
### 🔄 실시간 트레이딩 시스템 연동

**주요 변경 사항:**
- **웹소켓(WebSocket) 구독 로직 개선**: \`useWebSocket\` 훅이 트레이딩 컴포넌트와 직접 연동되어 실시간 호가 및 체결 데이터를 UI에 즉시 반영합니다.
- **상태 동기화**: Redux/Zustand 스토어의 주문 상태가 웹소켓 이벤트와 동기화되도록 수정하였습니다.
- **성능 최적화**: 잦은 상태 업데이트로 인한 리렌더링을 방지하기 위해 데이터 쓰로틀링(Throttling)을 적용했습니다.

**기술적 상세:**
- \`src/hooks/useTrading.ts\` 내 소켓 이벤트 리스너 등록 로직 변경
- \`TradePanel.tsx\` 컴포넌트의 실시간 데이터 바인딩 로직 수정
`
  },
  {
    version: "0.0.28",
    date: "2025-12-08",
    title: "웹소켓 토큰 발급 실패 오류 수정 및 알림 추가",
    content: `
### 🐛 버그 수정 및 예외 처리

**주요 변경 사항:**
- **토큰 발급 실패 핸들링**: 한국투자증권 API의 웹소켓 접속키 발급 실패 시 재시도 로직을 추가했습니다.
- **사용자 알림 강화**: 토큰 발급 실패 시 \`Sonner\` 또는 \`Toast\`를 통해 명확한 에러 메시지를 표시하도록 개선했습니다.

**기술적 상세:**
- \`src/lib/api/koreainvest.ts\` 내 에러 캐치 블록 보강
- API 응답 코드 분석을 통한 구체적인 원인 파악 로직 추가
`
  },
  {
    version: "0.0.27",
    date: "2025-12-08",
    title: "웹소켓 접근 토큰(approval_key) 관리 기능 추가",
    content: `
### 🔑 인증 키 관리 시스템

**주요 변경 사항:**
- **Approval Key 저장소**: 웹소켓 연결에 필수적인 approval_key를 안전하게 저장하고 관리하는 전용 모듈을 구현했습니다.
- **자동 갱신**: 키 만료 시 자동으로 갱신 요청을 보내는 백그라운드 프로세스를 추가했습니다.

**기술적 상세:**
- \`src/store/authStore.ts\` 상태 관리 로직 업데이트
- 보안을 위해 토큰 저장 시 메모리 내 암호화 처리 적용 고려
`
  },
  {
    version: "0.0.26",
    date: "2025-12-08",
    title: "macOS 및 Linux 빌드 타겟 추가",
    content: `
### 🖥️ 멀티 플랫폼 지원

**주요 변경 사항:**
- **Electron 빌드 설정**: Windows 외에 macOS(.dmg) 및 Linux(.AppImage) 빌드 설정을 추가했습니다.
- **플랫폼별 예외 처리**: OS별 파일 경로 구분자 및 네이티브 메뉴 동작 차이를 반영했습니다.

**기술적 상세:**
- \`electron-builder.yml\` 설정 파일 업데이트
- \`package.json\` 내 빌드 스크립트 확장 (\`build:mac\`, \`build:linux\`)
`
  },
  {
    version: "0.0.25",
    date: "2025-12-05",
    title: "Radix UI 아코디언 및 TradingView 차트 컴포넌트 추가",
    content: `
### 📊 차트 및 UI 컴포넌트 확장

**주요 변경 사항:**
- **Interactive Chart**: TradingView의 \`Lightweight Charts\` 라이브러리를 도입하여 고성능 캔들스틱 차트를 구현했습니다.
- **Accordion UI**: Radix UI 기반의 아코디언 컴포넌트를 추가하여 정보 밀도를 효율적으로 관리할 수 있게 되었습니다.

**기술적 상세:**
- \`src/components/ui/accordion.tsx\` 생성 및 스타일링
- \`src/components/chart/StockChart.tsx\` 컴포넌트 구현
`
  },
  {
    version: "0.0.24",
    date: "2025-12-05",
    title: "트레이딩 목록 및 히스토리 관리 기능",
    content: `
### 📝 주문 내역 및 포트폴리오 관리

**주요 변경 사항:**
- **주문 내역 리스트**: 사용자의 매수/매도 주문 내역을 시간순으로 조회할 수 있는 리스트 뷰를 구현했습니다.
- **필터링 기능**: 종목별, 기간별, 주문 상태별(체결/미체결) 필터링 기능을 추가했습니다.

**기술적 상세:**
- \`src/components/trading/OrderHistory.tsx\` 구현
- 가상 스크롤(Virtual Scrolling) 적용으로 대량의 데이터 렌더링 최적화
`
  },
  {
    version: "0.0.23",
    date: "2025-12-05",
    title: "주식 트레이딩 UI 및 매수/매도 로직 구현",
    content: `
### 💹 매매 인터페이스 구축

**주요 변경 사항:**
- **주문창 UI**: 매수(Bid)와 매도(Ask)를 직관적으로 수행할 수 있는 주문창 인터페이스를 디자인했습니다.
- **수량/가격 입력 검증**: 주문 가능 금액 체크 및 가격 단위(Tick size) 보정 로직을 포함했습니다.

**기술적 상세:**
- \`src/features/trading/TradeForm.tsx\` 컴포넌트 개발
- 입력값 유효성 검사를 위한 \`zod\` 스키마 정의 및 적용
`
  },
  {
    version: "0.0.22",
    date: "2025-12-05",
    title: "Electron 메인 프로세스 API 연동",
    content: `
### 🌉 IPC 통신 구조 설계

**주요 변경 사항:**
- **Renderer-Main 통신**: React 프론트엔드에서 Electron 메인 프로세스의 네이티브 기능을 호출하기 위한 IPC 채널을 정립했습니다.
- **보안 강화**: \`contextBridge\`를 통해 렌더러 프로세스에 노출되는 API를 제한하여 보안성을 높였습니다.

**기술적 상세:**
- \`electron/preload.ts\` 내 API 정의
- \`electron/main.ts\` 내 \`ipcMain.handle\` 핸들러 구현
`
  },
  {
    version: "0.0.21",
    date: "2025-12-05",
    title: "우측 패널(뉴스/커뮤니티) 컴포넌트 추가",
    content: `
### 📰 정보 패널 통합

**주요 변경 사항:**
- **사이드 정보 패널**: 화면 우측에 뉴스 피드와 커뮤니티 게시글을 볼 수 있는 패널을 추가했습니다.
- **탭 인터페이스**: 뉴스, 공시, 토론방 등 탭을 통해 다양한 정보를 전환하며 볼 수 있습니다.

**기술적 상세:**
- \`src/components/layout/RightPanel.tsx\` 레이아웃 추가
- 외부 뉴스 API 연동을 위한 서비스 레이어 구축
`
  },
  {
    version: "0.0.20",
    date: "2025-12-05",
    title: "딥링크, OAuth, 금융 API 연동",
    content: `
### 🔗 외부 서비스 연동 및 인증

**주요 변경 사항:**
- **Deep Linking**: 외부 브라우저나 앱에서 데스크톱 앱을 실행할 수 있는 커스텀 URL 스킴 처리를 구현했습니다.
- **OAuth 로그인**: 소셜 로그인 및 증권사 인증 흐름을 딥링크와 연동하여 매끄럽게 처리합니다.

**기술적 상세:**
- Electron \`setAsDefaultProtocolClient\` 설정
- OAuth 콜백 처리를 위한 URL 파싱 로직 구현
`
  },
  {
    version: "0.0.19",
    date: "2025-12-05",
    title: "주식 정보 타입 및 사이드바 상세 조회",
    content: `
### 📋 데이터 모델링 및 상세 뷰

**주요 변경 사항:**
- **TypeScript 정의**: 주식 종목, 호가, 체결 등 금융 데이터에 대한 엄격한 타입 정의를 추가했습니다.
- **상세 정보 패널**: 사이드바에서 종목 클릭 시 나타나는 상세 정보 뷰를 고도화했습니다.

**기술적 상세:**
- \`src/types/stock.ts\` 인터페이스 정의
- 사이드바 아이템 선택 상태에 따른 조건부 렌더링 로직 개선
`
  },
  {
    version: "0.0.18",
    date: "2025-12-05",
    title: "초기 설정 및 주식 크롤링",
    content: `
### 🕷️ 데이터 수집 인프라

**주요 변경 사항:**
- **웹 크롤러**: 기본 종목 정보(코드, 종목명 등)를 수집하기 위한 크롤링 모듈을 탑재했습니다.
- **초기 데이터 시딩**: 앱 실행 시 필수 데이터를 로컬 DB에 적재하는 로직을 추가했습니다.

**기술적 상세:**
- \`cheerio\` 또는 \`puppeteer\` 기반의 크롤링 스크립트 작성
- 데이터 정합성 검증 로직 추가
`
  },
  {
    version: "0.0.17",
    date: "2025-12-04",
    title: "주식 종목 추세 분석 기능",
    content: `
### 📈 기술적 분석 도구

**주요 변경 사항:**
- **이동평균선 분석**: 5일, 20일, 60일 이동평균선을 계산하여 추세를 판단하는 알고리즘을 도입했습니다.
- **신호 감지**: 골든크로스/데드크로스 등 매매 신호를 감지하여 사용자에게 알립니다.

**기술적 상세:**
- \`src/utils/indicators.ts\` 기술적 지표 계산 함수 라이브러리 작성
`
  },
  {
    version: "0.0.16",
    date: "2025-12-04",
    title: "AppSidebar 컴포넌트 및 추세 분석 훅",
    content: `
### 🧩 컴포넌트 모듈화

**주요 변경 사항:**
- **Sidebar 리팩토링**: 거대해진 사이드바 코드를 \`AppSidebar\` 컴포넌트로 분리하고 재사용성을 높였습니다.
- **Custom Hook**: 추세 분석 로직을 \`useTrendAnalysis\` 훅으로 캡슐화했습니다.

**기술적 상세:**
- \`src/components/layout/AppSidebar.tsx\` 분리
- React Context API를 활용한 사이드바 상태 전역 관리
`
  },
  {
    version: "0.0.15",
    date: "2025-12-04",
    title: "OAuth, 한국투자증권 API, S&P 500 크롤링",
    content: `
### 🌍 글로벌 시장 데이터 확장

**주요 변경 사항:**
- **해외 지수 연동**: S&P 500, 나스닥 등 주요 해외 지수 데이터를 수집하는 기능을 추가했습니다.
- **API 통합**: 국내 주식 API와 해외 지수 크롤링 데이터를 통합된 인터페이스로 제공합니다.

**기술적 상세:**
- 데이터 소스별 어댑터 패턴 적용으로 확장성 확보
`
  },
  {
    version: "0.0.14",
    date: "2025-12-04",
    title: "사이드바 컴포넌트 및 관련 타입",
    content: `
### 🎨 UI 구조화

**주요 변경 사항:**
- **네비게이션 구조**: 앱의 메인 네비게이션 역할을 하는 사이드바의 계층 구조를 정의했습니다.
- **메뉴 아이템 타입**: 사이드바 메뉴 생성을 위한 데이터 타입을 정의하고 동적 렌더링을 구현했습니다.

**기술적 상세:**
- \`Lucide React\` 아이콘 라이브러리 적용
- 사이드바 접기/펼치기 애니메이션 적용
`
  },
  {
    version: "0.0.13",
    date: "2025-12-04",
    title: "보유종목/S&P500 일별 시세 조회",
    content: `
### 📅 기간별 데이터 조회

**주요 변경 사항:**
- **일별 시세(Daily Candle)**: 종목 및 지수의 일별 시세 데이터를 조회하고 차트에 표시할 수 있게 되었습니다.
- **데이터 캐싱**: 자주 조회하는 시세 데이터에 대한 로컬 캐싱 전략을 수립했습니다.

**기술적 상세:**
- \`TanStack Query\`(React Query)를 이용한 서버 데이터 상태 관리
`
  },
  {
    version: "0.0.12",
    date: "2025-12-04",
    title: "계좌 설정 대화 상자 및 잔고 조회",
    content: `
### 💰 자산 관리 기능

**주요 변경 사항:**
- **계좌 연동**: 여러 증권사 계좌를 등록하고 관리할 수 있는 설정 다이얼로그를 추가했습니다.
- **잔고 현황**: 실시간 예수금 및 주식 평가 금액을 조회하는 기능을 구현했습니다.

**기술적 상세:**
- \`src/components/account/AccountSettings.tsx\` 구현
- 계좌 정보 암호화 저장 로직 포함
`
  },
  {
    version: "0.0.11",
    date: "2025-12-03",
    title: "데스크톱 앱 초기 설정 및 S&P 500 크롤링",
    content: `
### 🚀 초기화 프로세스 정립

**주요 변경 사항:**
- **앱 부트스트랩**: 앱 실행 시 필요한 설정 파일 확인, DB 초기화, 필수 데이터 로드 과정을 체계화했습니다.
- **스플래시 스크린**: 로딩 중 사용자 경험 향상을 위한 스플래시 스크린을 도입했습니다.

**기술적 상세:**
- Electron \`ready\` 이벤트 핸들러 내 초기화 체인 구성
`
  },
  {
    version: "0.0.10",
    date: "2025-12-03",
    title: "다이얼로그 UI 및 전역 CSS",
    content: `
### 🎨 디자인 시스템 적용

**주요 변경 사항:**
- **Global Styles**: 앱 전체에 일관된 폰트, 색상 변수, 리셋 CSS를 적용했습니다.
- **Dialog System**: 모달 다이얼로그를 위한 공통 컴포넌트 및 스타일 가이드를 수립했습니다.

**기술적 상세:**
- \`src/index.css\` 내 Tailwind \`@layer base\` 정의
- shadcn/ui Dialog 컴포넌트 커스터마이징
`
  },
  {
    version: "0.0.9",
    date: "2025-12-03",
    title: "Tailwind CSS 초기 스타일링",
    content: `
### 💅 스타일링 엔진 탑재

**주요 변경 사항:**
- **Tailwind Setup**: 유틸리티 퍼스트 CSS 프레임워크인 Tailwind CSS를 프로젝트에 통합했습니다.
- **Color Palette**: 브랜드 컬러 및 다크 모드 대응을 위한 색상 팔레트를 \`tailwind.config.js\`에 정의했습니다.

**기술적 상세:**
- PostCSS 설정 및 Autoprefixer 적용
`
  },
  {
    version: "0.0.8",
    date: "2025-12-02",
    title: "Electron 앱 초기 설정 및 딥링크/OAuth",
    content: `
### 🔐 보안 및 인증 기반

**주요 변경 사항:**
- **Security Policy**: CSP(Content Security Policy) 등 Electron 보안 권장 사항을 적용했습니다.
- **인증 핸들러**: OAuth 인증 리디렉션을 처리하기 위한 프로토콜 핸들러를 등록했습니다.

**기술적 상세:**
- \`webPreferences\` 내 \`nodeIntegration: false\`, \`contextIsolation: true\` 설정
`
  },
  {
    version: "0.0.7",
    date: "2025-12-02",
    title: "사이드바 및 계정 설정 추가",
    content: `
### 👤 사용자 경험 개선

**주요 변경 사항:**
- **Main Nav**: 앱의 주요 기능을 빠르게 접근할 수 있는 메인 네비게이션 바를 구축했습니다.
- **Profile Section**: 사용자 프로필 및 계정 설정을 위한 진입점을 마련했습니다.

**기술적 상세:**
- Flexbox 기반의 레이아웃 구조 잡기
`
  },
  {
    version: "0.0.6",
    date: "2025-12-02",
    title: "계좌 관리 및 인증 연동",
    content: `
### 🏦 금융 데이터 연동 준비

**주요 변경 사항:**
- **계좌 CRUD**: 계좌별 별칭 설정, 삭제 등 관리 기능을 구현했습니다.
- **인증 상태 관리**: 로그인 세션 유지 및 만료 처리를 위한 상태 관리를 도입했습니다.

**기술적 상세:**
- Zustand Store를 활용한 전역 인증 상태 관리
`
  },
  {
    version: "0.0.5",
    date: "2025-12-01",
    title: "딥링크 처리 및 빌드 환경",
    content: `
### 🛠️ 빌드 및 배포 파이프라인

**주요 변경 사항:**
- **URL Scheme**: 커스텀 URL 스킴(\`potato-invest://\`) 등록 및 파라미터 파싱 로직을 구현했습니다.
- **Build Scripts**: 개발(Dev) 모드와 프로덕션(Prod) 모드를 구분하는 스크립트를 작성했습니다.

**기술적 상세:**
- \`electron-builder\` 설정 최적화
`
  },
  {
    version: "0.0.4",
    date: "2025-12-01",
    title: "사용자 인증 및 다크모드 설정",
    content: `
### 🌙 테마 및 개인화

**주요 변경 사항:**
- **Dark Mode**: 시스템 설정 감지 및 사용자 수동 전환이 가능한 다크 모드를 완벽 지원합니다.
- **User Preference**: 사용자 설정(테마, 언어 등)을 로컬에 저장하고 불러오는 기능을 추가했습니다.

**기술적 상세:**
- \`next-themes\` 또는 유사한 테마 관리 라이브러리 패턴 적용
`
  },
  {
    version: "0.0.3",
    date: "2025-12-01",
    title: "Supabase 인증 및 딥링크",
    content: `
### ☁️ 백엔드 서비스 통합

**주요 변경 사항:**
- **Supabase Auth**: Supabase를 이용한 이메일/비밀번호 로그인 및 소셜 로그인 기능을 통합했습니다.
- **세션 동기화**: Electron 앱과 Supabase 간의 세션 토큰 교환 메커니즘을 구현했습니다.

**기술적 상세:**
- Supabase Javascript Client (\`@supabase/supabase-js\`) 설정
`
  },
  {
    version: "0.0.2",
    date: "2025-12-01",
    title: "Electron 메인 프로세스 초기 설정",
    content: `
### ⚡ Electron 코어 구현

**주요 변경 사항:**
- **Window Management**: 메인 윈도우 생성, 종료, 최소화 등 생명주기 관리를 구현했습니다.
- **Native Menus**: 애플리케이션 상단 네이티브 메뉴를 커스터마이징했습니다.

**기술적 상세:**
- \`BrowserWindow\` 옵션 튜닝 (프레임리스 윈도우 등 고려)
`
  },
  {
    version: "0.0.1",
    date: "2025-12-01",
    title: "개발 환경 및 Git 설정",
    content: `
### ⚙️ 프로젝트 인프라

**주요 변경 사항:**
- **Git Hooks**: 코드 품질 유지를 위한 Husky 및 lint-staged 설정.
- **Code Style**: Prettier 및 ESLint 설정을 통해 코드 스타일을 통일했습니다.

**기술적 상세:**
- \`.gitignore\`, \`.editorconfig\` 파일 작성
`
  },
  {
    version: "0.0.0",
    date: "2025-11-30",
    title: "초기 프로젝트 설정 (react+electron+tailwind+shadcn)",
    content: `
### 🎆 프로젝트 시작

**주요 변경 사항:**
- **Scaffold**: Vite 기반의 React 프로젝트와 Electron을 연동하여 보일러플레이트를 구축했습니다.
- **UI Stack**: Tailwind CSS와 shadcn/ui를 설치하여 모던한 UI 개발 환경을 마련했습니다.

**기술적 상세:**
- \`npm init\` 및 주요 의존성 패키지 설치
- 폴더 구조 설계 (\`src\`, \`electron\`, \`public\`)
`
  }
]

export function PatchNotesDialog({ open, onOpenChange }: PatchNotesDialogProps) {
  const [selectedVersion, setSelectedVersion] = useState<string>(versions[0].version)

  const currentVersionData = versions.find(v => v.version === selectedVersion) || versions[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-muted/20">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            패치 노트
            <Badge variant="outline" className="text-xs font-normal">History</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Version List */}
          <div className="w-64 border-r bg-muted/10 flex flex-col">
            <div className="p-4 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Version History
            </div>
            <ScrollArea className="flex-1">
              <div className="flex flex-col p-2 gap-1">
                {versions.map((v) => (
                  <Button
                    key={v.version}
                    variant={selectedVersion === v.version ? "secondary" : "ghost"}
                    className={cn(
                      "justify-start h-auto py-3 px-3 w-full text-left flex flex-col items-start gap-1 transition-all",
                      selectedVersion === v.version 
                        ? "bg-accent text-accent-foreground shadow-sm" 
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedVersion(v.version)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={cn(
                        "font-bold text-sm",
                        selectedVersion === v.version ? "text-primary" : ""
                      )}>
                        v{v.version}
                      </span>
                      {selectedVersion === v.version && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate w-full">
                      {v.date}
                    </span>
                    <span className="text-xs line-clamp-1 w-full opacity-80">
                      {v.title}
                    </span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel: Content */}
          <div className="flex-1 flex flex-col overflow-hidden bg-background">
            <div className="p-6 pb-2 border-b bg-background/95 backdrop-blur z-10">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold tracking-tight">v{currentVersionData.version}</h2>
                <Badge variant="secondary" className="text-xs">{currentVersionData.date}</Badge>
              </div>
              <p className="text-base text-muted-foreground font-medium">
                {currentVersionData.title}
              </p>
            </div>
            <ScrollArea className="flex-1 p-6">
              <div className="prose dark:prose-invert prose-sm max-w-none pb-10">
                {currentVersionData.content ? (
                  <Streamdown>
                    {currentVersionData.content}
                  </Streamdown>
                ) : (
                  <ul className="list-disc pl-5 space-y-2">
                    {currentVersionData.changes?.map((change, i) => (
                      <li key={i} className="text-foreground">{change}</li>
                    ))}
                  </ul>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
