# 트레이딩 히스토리 사용 가이드

## 📋 개요

트레이딩 히스토리는 **DB 중심 아키텍처**로 설계되었습니다.
- **Supabase**가 단일 진실 공급원(Single Source of Truth)
- **Zustand Store**는 읽기 전용 캐시 역할
- 모든 CUD 작업은 DB에 먼저 수행 후 자동으로 Store 동기화

## 🗄️ Supabase 테이블 설정

1. Supabase 대시보드에서 SQL Editor 열기
2. `supabase-trading-table.sql` 파일의 내용 복사
3. SQL 실행하여 테이블 및 인덱스 생성

```sql
-- trading 테이블이 생성되며 다음 기능이 포함됩니다:
-- ✅ RLS (Row Level Security) - 본인 데이터만 접근 가능
-- ✅ 인덱스 - uid, ticker, buy_time 조회 최적화
-- ✅ 자동 updated_at 트리거
```

## 🎯 사용 방법

### 1. 컴포넌트에서 Hook 사용

```typescript
import { useTradingHook } from '@/hooks/useTradingHook'
import { useTradingStore } from '@/stores/useTradingStore'

function TradingComponent() {
  const { fetchHistories, addHistory, updateHistory, loading, error } = useTradingHook()
  const { histories, getHistoriesByTicker } = useTradingStore()

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchHistories()
  }, [])

  // ...
}
```

### 2. 히스토리 조회

```typescript
// 전체 히스토리 조회 (DB에서 가져와서 Store에 설정)
const fetchData = async () => {
  const histories = await fetchHistories()
  console.log('조회된 히스토리:', histories)
}

// Store에서 특정 티커의 히스토리만 필터링
const appleHistories = getHistoriesByTicker('AAPL')
```

### 3. 새 히스토리 추가 (구매 시)

```typescript
const handleBuy = async () => {
  const newHistory = await addHistory({
    ticker: 'AAPL',
    buyPrice: 150.5,
    buyQuantity: 10,
    buyTime: new Date().toISOString(),
    sellPrice: null,
    sellQuantity: null,
    sellTime: null,
  })

  if (newHistory) {
    console.log('구매 기록 추가 완료:', newHistory)
    // DB 추가 후 자동으로 fetchHistories()가 호출되어 Store 동기화됨
  }
}
```

### 4. 히스토리 업데이트 (판매 시)

```typescript
const handleSell = async (historyId: string) => {
  const updated = await updateHistory(historyId, {
    sellPrice: 155.0,
    sellQuantity: 10,
    sellTime: new Date().toISOString(),
  })

  if (updated) {
    console.log('판매 정보 업데이트 완료:', updated)
    // DB 업데이트 후 자동으로 fetchHistories()가 호출되어 Store 동기화됨
  }
}
```

## 🔐 인증 및 보안

### UID (사용자 식별)
- `kakaoToken`을 UID로 사용
- `useAuthStore`에서 자동으로 가져옴
- 로그인하지 않은 경우 에러 발생

### RLS (Row Level Security)
- Supabase에서 자동으로 본인 데이터만 접근 가능
- 다른 사용자의 데이터는 조회/수정 불가

```typescript
// ✅ 본인 데이터만 조회됨
const histories = await fetchHistories()

// ✅ 본인 데이터만 업데이트됨
await updateHistory(id, updates)

// ❌ 다른 사용자의 데이터는 접근 불가 (RLS가 자동 차단)
```

## 📊 데이터 흐름

```
사용자 액션
    ↓
useTradingHook
    ↓
Supabase DB (CUD 작업)
    ↓
fetchHistories() 자동 호출
    ↓
useTradingStore.setHistories()
    ↓
UI 자동 업데이트
```

## 🎨 실전 예제

### 트레이딩 대시보드 컴포넌트

```typescript
import { useEffect } from 'react'
import { useTradingHook } from '@/hooks/useTradingHook'
import { useTradingStore } from '@/stores/useTradingStore'

export function TradingDashboard() {
  const { fetchHistories, addHistory, updateHistory, loading, error } = useTradingHook()
  const { histories } = useTradingStore()

  // 초기 데이터 로드
  useEffect(() => {
    fetchHistories()
  }, [])

  // 구매 처리
  const handleBuy = async (ticker: string, price: number, quantity: number) => {
    await addHistory({
      ticker,
      buyPrice: price,
      buyQuantity: quantity,
      buyTime: new Date().toISOString(),
      sellPrice: null,
      sellQuantity: null,
      sellTime: null,
    })
  }

  // 판매 처리
  const handleSell = async (historyId: string, price: number, quantity: number) => {
    await updateHistory(historyId, {
      sellPrice: price,
      sellQuantity: quantity,
      sellTime: new Date().toISOString(),
    })
  }

  // 수익률 계산
  const calculateProfit = (history: TradingHistory) => {
    if (!history.sellPrice || !history.sellQuantity) return null
    
    const buyTotal = history.buyPrice * history.buyQuantity
    const sellTotal = history.sellPrice * history.sellQuantity
    const profit = sellTotal - buyTotal
    const profitRate = (profit / buyTotal) * 100
    
    return { profit, profitRate }
  }

  if (loading) return <div>로딩 중...</div>
  if (error) return <div>오류: {error}</div>

  return (
    <div>
      <h1>트레이딩 히스토리</h1>
      
      {/* 미체결 포지션 */}
      <section>
        <h2>보유 중</h2>
        {histories
          .filter(h => !h.sellPrice)
          .map(history => (
            <div key={history.id}>
              <span>{history.ticker}</span>
              <span>{history.buyQuantity}주</span>
              <span>${history.buyPrice}</span>
              <button onClick={() => handleSell(history.id, 155, history.buyQuantity)}>
                판매
              </button>
            </div>
          ))}
      </section>

      {/* 체결 완료 */}
      <section>
        <h2>거래 완료</h2>
        {histories
          .filter(h => h.sellPrice)
          .map(history => {
            const result = calculateProfit(history)
            return (
              <div key={history.id}>
                <span>{history.ticker}</span>
                <span>수익: ${result?.profit.toFixed(2)}</span>
                <span 
                  className={result && result.profitRate >= 0 ? 'text-red-400' : 'text-blue-400'}
                >
                  {result?.profitRate.toFixed(2)}%
                </span>
              </div>
            )
          })}
      </section>
    </div>
  )
}
```

## 🔄 동기화 전략

### 자동 동기화
- `addHistory()` 성공 시 → 자동으로 `fetchHistories()` 호출
- `updateHistory()` 성공 시 → 자동으로 `fetchHistories()` 호출

### 수동 동기화
```typescript
// 필요한 경우 수동으로 동기화
const refresh = async () => {
  await fetchHistories()
}
```

## ⚡ 성능 최적화

### 인덱스 활용
- `uid` 인덱스: 사용자별 조회 최적화
- `ticker` 인덱스: 종목별 조회 최적화
- `buy_time` 인덱스: 시간순 정렬 최적화

### 조회 쿼리 최적화
```typescript
// ✅ 인덱스를 활용한 빠른 조회
.eq('uid', kakaoToken)
.order('buy_time', { ascending: false })
```

## 🚨 에러 처리

```typescript
const { error } = useTradingHook()

// Hook에서 자동으로 에러 처리
if (error) {
  console.error('트레이딩 히스토리 오류:', error)
  // UI에 에러 메시지 표시
}
```

## 📝 타입 정의

모든 타입은 `@/types/trading.ts`에서 export됩니다:

```typescript
import type { TradingHistory, TradingRecord } from '@/types/trading'

// TradingHistory: 앱에서 사용하는 camelCase 타입
// TradingRecord: Supabase DB의 snake_case 타입
```

## 🎯 Best Practices

1. **항상 fetchHistories()로 시작**: 컴포넌트 마운트 시 데이터 로드
2. **에러 처리**: `error` 상태를 확인하여 UI에 표시
3. **로딩 상태**: `loading` 상태로 사용자 피드백 제공
4. **타입 안정성**: TypeScript 타입을 활용하여 안전한 코드 작성
5. **Store는 읽기 전용**: Store의 데이터를 직접 수정하지 말고 Hook 사용
