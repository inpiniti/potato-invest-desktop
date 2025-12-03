# Potato Invest Desktop - 프로젝트 개요

> **🤖 AI 에이전트 필독 사항**
> 
> **이 프로젝트의 모든 작업은 반드시 한국어로 수행해야 합니다.**
> 
> - ✅ **Git 커밋 메시지**: 반드시 한국어로 작성 (예: "feat: 로그인 기능 추가")
> - ✅ **코드 주석**: 모든 주석은 한국어로 작성
> - ✅ **문서화**: README, 가이드 등 모든 문서는 한국어
> - ✅ **사용자 메시지**: UI에 표시되는 모든 텍스트는 한국어
> - ✅ **커뮤니케이션**: 개발자와의 모든 대화는 한국어
> 
> **절대 영어로 작성하지 마세요!** 이는 프로젝트의 핵심 규칙입니다.

---

## 📋 프로젝트 소개

**Potato Invest Desktop**은 한국투자증권 API를 활용한 퀀트 투자 데스크톱 애플리케이션입니다.

### 핵심 기능
- 한국투자증권 API를 통한 실시간 데이터 수집
- 자동화된 퀀트 트레이딩 시스템
- 포트폴리오 관리 및 분석
- S&P 500, KOSPI 200 등 주요 지수 추적

---

## 🛠 기술 스택

### Frontend
- **React** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링
- **shadcn/ui** - UI 컴포넌트 라이브러리

### State Management
- **Zustand** - 전역 상태 관리

### Desktop
- **Electron** - 데스크톱 애플리케이션 프레임워크
- **IPC (Inter-Process Communication)** - 보안 통신

### Backend & Database
- **Supabase** - 데이터베이스 및 인증

### External API
- **한국투자증권 API** - 주식 데이터 및 매매 실행

---

## 🎨 UI/UX 디자인 가이드

### 전체 레이아웃
애플리케이션은 **VS Code 스타일**의 레이아웃을 따릅니다:

```
┌─────────────────────────────────────────┐
│  [메뉴]  │  [목록]  │     [메인]        │
│         │         │                    │
│  아이콘  │  리스트  │  ┌──────────────┐ │
│         │         │  │ 종목 정보 영역 │ │
│         │         │  └──────────────┘ │
│         │         │  ┌──────────────┐ │
│         │         │  │ 트레이딩 영역  │ │
│  계정    │         │  └──────────────┘ │
└─────────────────────────────────────────┘
```

### 레이아웃 구조

#### 1. 사이드바 (Sidebar)
- **메뉴 섹션** (상단)
  - 보유계좌 아이콘
  - S&P 500 아이콘
  - KOSPI 200 아이콘
  
- **계정 섹션** (하단)
  - 계정 아이콘
  - 계좌 설정 접근

- **목록 섹션**
  - 선택된 메뉴에 따른 데이터 목록 표시
  - 종목 리스트, 계좌 정보 등

#### 2. 메인 영역 (Main)
- **종목 정보 영역** (상단)
  - 선택한 종목의 상세 정보
  - 차트, 가격 정보, 기술적 지표 등

- **트레이딩 영역** (하단)
  - 매수/매도 인터페이스
  - 주문 내역
  - 포지션 관리

---

## 🏗 아키텍처 및 개발 패턴

### 컴포넌트 설계 원칙

#### 1. **관심사의 분리 (Separation of Concerns)**
컴포넌트와 데이터 로직을 완전히 분리합니다.

```typescript
// ❌ 나쁜 예 - 컴포넌트에 로직이 섞임
function StockList() {
  const [stocks, setStocks] = useState([]);
  
  useEffect(() => {
    fetch('/api/stocks')
      .then(res => res.json())
      .then(setStocks);
  }, []);
  
  return <div>{/* render */}</div>;
}

// ✅ 좋은 예 - 로직은 Hook으로 분리
// hooks/useStocks.ts
export function useStocks() {
  const [stocks, setStocks] = useState([]);
  
  useEffect(() => {
    fetch('/api/stocks')
      .then(res => res.json())
      .then(setStocks);
  }, []);
  
  return { stocks };
}

// components/StockList.tsx
function StockList() {
  const { stocks } = useStocks();
  return <div>{/* render */}</div>;
}
```

#### 2. **컴포넌트 분류**

**Presentational Components (표현 컴포넌트)**
- 순수하게 UI 렌더링만 담당
- Props를 통해 데이터를 받음
- 비즈니스 로직 없음
- 재사용 가능하도록 설계

```typescript
// components/ui/StockCard.tsx
interface StockCardProps {
  symbol: string;
  price: number;
  change: number;
  onClick?: () => void;
}

export function StockCard({ symbol, price, change, onClick }: StockCardProps) {
  return (
    <div onClick={onClick}>
      <h3>{symbol}</h3>
      <p>{price}</p>
      <p className={change > 0 ? 'text-green-500' : 'text-red-500'}>
        {change}%
      </p>
    </div>
  );
}
```

**Container Components (컨테이너 컴포넌트)**
- Custom Hooks를 사용하여 데이터 관리
- 표현 컴포넌트에 데이터 전달
- 비즈니스 로직 처리

```typescript
// components/StockListContainer.tsx
export function StockListContainer() {
  const { stocks, selectStock } = useStocks();
  const { addToWatchlist } = useWatchlist();
  
  return (
    <div>
      {stocks.map(stock => (
        <StockCard
          key={stock.symbol}
          {...stock}
          onClick={() => selectStock(stock.symbol)}
        />
      ))}
    </div>
  );
}
```

#### 3. **Custom Hooks 패턴**

모든 데이터 로직과 상태 관리는 Custom Hooks로 분리합니다.

```typescript
// hooks/useKoreaInvestAPI.ts
export function useKoreaInvestAPI() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchStockData = async (symbol: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/korea-invest/stock/${symbol}`);
      const data = await response.json();
      setData(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  
  return { data, loading, error, fetchStockData };
}
```

#### 4. **Zustand Store 패턴**

전역 상태는 도메인별로 분리된 Store로 관리합니다.

```typescript
// stores/accountStore.ts
interface AccountState {
  accounts: Account[];
  selectedAccount: Account | null;
  setAccounts: (accounts: Account[]) => void;
  selectAccount: (accountId: string) => void;
}

export const useAccountStore = create<AccountState>((set) => ({
  accounts: [],
  selectedAccount: null,
  setAccounts: (accounts) => set({ accounts }),
  selectAccount: (accountId) => 
    set((state) => ({
      selectedAccount: state.accounts.find(a => a.id === accountId)
    })),
}));
```

```typescript
// stores/tradingStore.ts
interface TradingState {
  positions: Position[];
  orders: Order[];
  addOrder: (order: Order) => void;
  updatePosition: (position: Position) => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  positions: [],
  orders: [],
  addOrder: (order) => 
    set((state) => ({ orders: [...state.orders, order] })),
  updatePosition: (position) => 
    set((state) => ({
      positions: state.positions.map(p => 
        p.id === position.id ? position : p
      )
    })),
}));
```

---

## 📁 프로젝트 구조

```
potato-invest-desktop/
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── ui/             # shadcn/ui 기반 기본 UI 컴포넌트
│   │   ├── layout/         # 레이아웃 컴포넌트 (Sidebar, Main 등)
│   │   ├── stock/          # 주식 관련 컴포넌트
│   │   ├── trading/        # 트레이딩 관련 컴포넌트
│   │   └── account/        # 계정 관련 컴포넌트
│   │
│   ├── hooks/              # Custom Hooks
│   │   ├── useStocks.ts
│   │   ├── useKoreaInvestAPI.ts
│   │   ├── useTradingData.ts
│   │   └── useAccountSettings.ts
│   │
│   ├── stores/             # Zustand Stores
│   │   ├── accountStore.ts
│   │   ├── tradingStore.ts
│   │   ├── stockStore.ts
│   │   └── uiStore.ts
│   │
│   ├── services/           # API 서비스 레이어
│   │   ├── koreaInvestAPI.ts
│   │   └── dataProcessor.ts
│   │
│   ├── types/              # TypeScript 타입 정의
│   │   ├── stock.ts
│   │   ├── trading.ts
│   │   └── account.ts
│   │
│   ├── utils/              # 유틸리티 함수
│   │   ├── formatters.ts
│   │   └── validators.ts
│   │
│   └── App.tsx             # 메인 애플리케이션
│
├── electron/               # Electron 관련 파일
└── public/                 # 정적 파일
```

---

## 🔑 핵심 개발 원칙

### 1. **한국어 우선**
- 모든 주석과 문서는 한국어로 작성
- 변수명과 함수명은 영어 사용 (코드 컨벤션)
- 사용자 인터페이스 텍스트는 한국어

### 2. **타입 안정성**
- 모든 함수와 컴포넌트에 명시적 타입 정의
- `any` 타입 사용 최소화
- API 응답에 대한 타입 정의 필수

### 3. **재사용성**
- 컴포넌트는 최대한 재사용 가능하게 설계
- 공통 로직은 Custom Hook으로 추출
- shadcn/ui 컴포넌트를 기반으로 확장

### 4. **성능 최적화**
- 불필요한 리렌더링 방지 (React.memo, useMemo, useCallback)
- 큰 리스트는 가상화 (react-window 등)
- API 호출 최소화 및 캐싱

### 5. **에러 처리**
- 모든 API 호출에 에러 처리 구현
- 사용자에게 명확한 에러 메시지 표시
- 로깅 시스템 구축

### 6. **보안 (Security)**
- **IPC 통신 필수**: 민감한 작업은 반드시 Electron IPC를 통해 처리
- **메인 프로세스에서 처리해야 할 작업**:
  - Supabase 데이터베이스 조회 및 수정
  - 한국투자증권 API 호출
  - 계정 로그인 및 인증
  - API 키 및 시크릿 관리
- **렌더러 프로세스 제한**:
  - API 키, 시크릿 등 민감 정보 직접 접근 금지
  - 환경 변수 직접 접근 금지
  - 모든 민감한 작업은 IPC를 통해 메인 프로세스에 요청
- **보안 통신 패턴**:
  ```typescript
  // ❌ 나쁜 예 - 렌더러에서 직접 API 호출
  const response = await fetch('https://api.korea-invest.com', {
    headers: {
      'API-KEY': process.env.KOREA_INVEST_API_KEY // 보안 위험!
    }
  });
  
  // ✅ 좋은 예 - IPC를 통한 안전한 호출
  // Renderer Process
  const data = await window.electron.invoke('korea-invest:getStockPrice', { symbol: 'AAPL' });
  
  // Main Process (electron/main.ts)
  ipcMain.handle('korea-invest:getStockPrice', async (event, { symbol }) => {
    const apiKey = process.env.KOREA_INVEST_API_KEY; // 메인 프로세스에서만 접근
    const response = await fetch(`https://api.korea-invest.com/stock/${symbol}`, {
      headers: { 'API-KEY': apiKey }
    });
    return response.json();
  });
  ```

---

## 🔌 한국투자증권 API 연동

### API 주요 기능
1. **시세 조회** - 실시간 주가 데이터
2. **주문 실행** - 매수/매도 주문
3. **계좌 조회** - 보유 종목 및 잔고
4. **체결 내역** - 거래 내역 조회

### API 서비스 레이어 예시

```typescript
// services/koreaInvestAPI.ts
export class KoreaInvestAPI {
  private baseURL = process.env.KOREA_INVEST_API_URL;
  private apiKey = process.env.KOREA_INVEST_API_KEY;
  
  async getStockPrice(symbol: string): Promise<StockPrice> {
    // API 호출 로직
  }
  
  async executeOrder(order: OrderRequest): Promise<OrderResponse> {
    // 주문 실행 로직
  }
  
  async getAccountBalance(accountId: string): Promise<Balance> {
    // 계좌 조회 로직
  }
}
```

---

## 🎯 개발 시 체크리스트

### 새로운 기능 개발 시
- [ ] 타입 정의 작성 (`types/`)
- [ ] API 서비스 함수 작성 (`services/`)
- [ ] Custom Hook 작성 (`hooks/`)
- [ ] 표현 컴포넌트 작성 (`components/`)
- [ ] 컨테이너 컴포넌트 작성 (필요시)
- [ ] Zustand Store 업데이트 (전역 상태 필요시)
- [ ] 에러 처리 구현
- [ ] 한국어 주석 추가

### 코드 리뷰 포인트
- [ ] 컴포넌트와 로직이 분리되어 있는가?
- [ ] 타입이 명확하게 정의되어 있는가?
- [ ] 재사용 가능한 구조인가?
- [ ] 에러 처리가 적절한가?
- [ ] 성능 최적화가 고려되었는가?

---

## 📝 코딩 컨벤션

### 파일명
- 컴포넌트: PascalCase (예: `StockCard.tsx`)
- Hook: camelCase with 'use' prefix (예: `useStocks.ts`)
- Store: camelCase with 'Store' suffix (예: `accountStore.ts`)
- 유틸리티: camelCase (예: `formatters.ts`)

### 컴포넌트 작성 순서
```typescript
// 1. Import 문
import { useState } from 'react';
import { useStocks } from '@/hooks/useStocks';

// 2. 타입 정의
interface Props {
  // ...
}

// 3. 컴포넌트 정의
export function ComponentName({ prop }: Props) {
  // 3.1. Hooks
  const { data } = useStocks();
  const [state, setState] = useState();
  
  // 3.2. 이벤트 핸들러
  const handleClick = () => {
    // ...
  };
  
  // 3.3. 렌더링
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

---

## 🚀 시작하기

### 개발 환경 설정
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# Electron 앱 실행
npm run electron:dev
```

### 환경 변수
`.env` 파일에 다음 변수들을 설정해야 합니다:
```
KOREA_INVEST_API_KEY=your_api_key
KOREA_INVEST_API_SECRET=your_api_secret
KOREA_INVEST_API_URL=https://api.korea-invest.com
```

---

## 📚 참고 자료

- [React 공식 문서](https://react.dev)
- [Zustand 문서](https://github.com/pmndrs/zustand)
- [Tailwind CSS 문서](https://tailwindcss.com)
- [shadcn/ui 문서](https://ui.shadcn.com)
- [Electron 문서](https://www.electronjs.org)
- [한국투자증권 API 문서](https://apiportal.koreainvestment.com)

---

## ⚠️ 중요 참고사항

1. **개발자는 한국어만 사용 가능** - 모든 커뮤니케이션과 문서는 한국어로 작성
2. **컴포넌트-로직 분리 엄수** - 이 원칙을 반드시 지켜야 함
3. **타입 안정성 최우선** - TypeScript의 이점을 최대한 활용
4. **VS Code 스타일 UI** - 디자인 일관성 유지
5. **한국투자증권 API** - 모든 데이터와 거래는 이 API를 통해 처리
6. **보안 최우선** - Supabase, API 호출, 인증은 반드시 IPC 통신으로 처리

---

*이 문서는 AI 에이전트가 프로젝트를 이해하고 일관된 코드를 작성하기 위한 가이드입니다.*
*프로젝트 진행에 따라 지속적으로 업데이트됩니다.*
