import type { TrendMetric } from '@/types/trend'

/**
 * 추세 지표 계산 (공통 로직)
 * 기울기: (현재 - 과거) / 과거 * 100 (비율)
 * 가속도: 현재기울기 - 과거기울기
 * 반환값: 각 항목의 합산
 * @param mas 이동평균 값 배열 (0번째가 최신)
 * @returns 추세 지표 객체
 */
export const calculateTrendMetrics = (mas: (number | null)[]): TrendMetric => {
  // null 값이 있으면 기본값 반환
  if (mas.some(ma => ma === null)) {
    return {
      value: 0,
      slope: 0,
      accel: 0,
      description: '데이터 부족'
    }
  }

  const validMas = mas as number[]
  const current = validMas[0]

  // 1. 기울기 (Slope) 비율 계산
  // 식: (현재 - 과거) / 과거 * 100
  const slopes: number[] = []
  for (let i = 0; i < validMas.length - 1; i++) {
    const curr = validMas[i]
    const prev = validMas[i + 1]
    
    // 0으로 나누기 방지
    if (prev === 0) {
      slopes.push(0)
    } else {
      slopes.push(((curr - prev) / prev) * 100)
    }
  }

  // 2. 가속도 (Acceleration) 계산
  // 식: 현재기울기 - 과거기울기
  const accels: number[] = []
  for (let i = 0; i < slopes.length - 1; i++) {
    accels.push(slopes[i] - slopes[i + 1])
  }

  // 3. 합산
  const slopeSum = slopes.reduce((sum, val) => sum + val, 0)
  const accelSum = accels.reduce((sum, val) => sum + val, 0)

  // 4. 설명 생성
  // Slope: + 상승, - 하락, 0 박스권
  // Accel: + 상승추세변화(가속/반등), - 하락추세변화(둔화/낙폭확대), 0 변화없음
  let description = ''
  
  // 부동소수점 오차 고려하여 0 판단
  const isSlopeFlat = Math.abs(slopeSum) < 0.000001
  const isAccelFlat = Math.abs(accelSum) < 0.000001

  if (isSlopeFlat) {
    description = '박스권 횡보'
  } else if (slopeSum > 0) {
    description = '상승 추세'
  } else {
    description = '하락 추세'
  }

  if (!isAccelFlat) {
    if (accelSum > 0) {
      // 가속도가 + 인 경우
      if (slopeSum > 0) description += ' (상승폭 확대)'
      else if (slopeSum < 0) description += ' (하락폭 축소/반등 시도)'
      else description += ' (상승 전환 시도)'
    } else {
      // 가속도가 - 인 경우
      if (slopeSum > 0) description += ' (상승폭 둔화)'
      else if (slopeSum < 0) description += ' (하락폭 확대)'
      else description += ' (하락 전환 시도)'
    }
  } else {
    description += ' (모멘텀 유지)'
  }

  return {
    value: current,
    slope: slopeSum,
    accel: accelSum,
    description
  }
}

/**
 * 일별 데이터 이동평균 계산
 * @param data 일별 시세 데이터 (0번째가 최신)
 * @param period 이동평균 기간
 * @param index 계산할 인덱스 (0이 오늘)
 * @returns 이동평균 값
 */
export const calculateMADaily = (data: any[], period: number, index: number): number | null => {
  // 데이터가 충분하지 않으면 null 반환
  if (index + period > data.length) {
    return null
  }

  let sum = 0
  for (let i = index; i < index + period; i++) {
    // data[i].clos가 string이라고 가정
    const closePrice = parseFloat(data[i].clos)
    if (isNaN(closePrice)) {
      return null
    }
    sum += closePrice
  }

  return sum / period
}

/**
 * 분봉 데이터 이동평균 계산
 * @param data 분봉 시세 데이터 (0번째가 최신)
 * @param period 이동평균 기간
 * @param index 계산할 인덱스 (0이 현재)
 * @returns 이동평균 값
 */
export const calculateMAMinute = (data: any[], period: number, index: number): number | null => {
  // 데이터가 충분하지 않으면 null 반환
  if (index + period > data.length) {
    return null
  }

  let sum = 0
  for (let i = index; i < index + period; i++) {
    // data[i].last가 string이라고 가정
    const closePrice = parseFloat(data[i].last)
    if (isNaN(closePrice)) {
      return null
    }
    sum += closePrice
  }

  return sum / period
}
