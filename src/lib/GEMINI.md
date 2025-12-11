# lib (Custom 함수) 룰 및 문서화

## 1. supabase.ts

- **설명**: Supabase 클라이언트를 초기화하고 내보내는 모듈입니다. 환경 변수(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)를 사용하여 연결을 설정합니다.

### Functions (Exports)

- **`supabase` (Client)**
  - **설명**: 초기화된 Supabase 클라이언트 인스턴스입니다. 데이터베이스 쿼리, 인증, 스토리지 작업 등에 사용됩니다.
  - **사용 예시**: `await supabase.from('table').select('*')`

---

## 2. utils.ts

- **설명**: 프로젝트 전반에서 사용되는 공통 유틸리티 함수들을 모아둔 파일입니다. 주로 스타일링 관련 헬퍼 함수가 포함되어 있습니다.

### Functions

- **`cn(...inputs: ClassValue[])`**
  - **설명**: Tailwind CSS 클래스를 조건부로 병합하고 충돌을 해결하는 함수입니다. `clsx`와 `tailwind-merge`를 결합하여 작동합니다.
  - **Input**: 클래스 이름 문자열, 객체, 배열 등 (clsx 호환)
  - **Output**: 병합된 최종 클래스 문자열
  - **사용 예시**: `className={cn("text-sm", isActive && "font-bold")}`

---

## 3. trend-calculator.ts (`src/utils/trend-calculator.ts`)

- **설명**: 이동평균선 계산 및 추세 지표(기울기, 가속도)를 분석하는 순수 함수들의 집합입니다.

### Functions

- **`calculateTrendMetrics(mas: (number | null)[])`**
  - **설명**: 이동평균선 값 배열을 받아 현재 값, 기울기(% 합산), 가속도(% 차이 합산), 상태 설명 문자열을 반환합니다.
- **`calculateMADaily(data, period, index)`**
  - **설명**: 일별 시세 데이터 배열에서 특정 시점의 이동평균을 계산합니다.
- **`calculateMAMinute(data, period, index)`**
  - **설명**: 분봉 시세 데이터 배열에서 특정 시점의 이동평균을 계산합니다.
