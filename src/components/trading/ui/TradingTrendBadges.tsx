import { Badge } from '@/components/ui/badge'
import type { Trend } from '@/types/trend'
import { Loader2 } from 'lucide-react'

interface TradingTrendBadgesProps {
  trend: Trend | null
  loading?: boolean
  mode?: 'simple' | 'detailed'
}

export const TradingTrendBadges = ({ trend, loading = false, mode = 'detailed' }: TradingTrendBadgesProps) => {
  if (loading && !trend) {
    return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
  }

  if (!trend) {
    if (!loading) return <span className="text-xs text-muted-foreground">-</span>
    return null
  }

  return (
    <div className="flex gap-0.5">
      {(['ma20', 'ma50', 'ma100', 'ma200'] as const).map((maKey) => {
        const metric = trend[maKey]
        const { slope, accel } = metric
        let bgColor = 'bg-gray-400'

        if (mode === 'simple') {
          // Daily Trend 로직 (Header)
          if (slope > 0) {
            bgColor = 'bg-red-500'
          } else if (slope < 0) {
            bgColor = 'bg-blue-500'
          } else {
            bgColor = 'bg-gray-400'
          }
        } else {
          // Minute Trend 로직 (Content)
          // 1. 빨강 (Buy Signal): 상승 가속
          if (slope > 0 && accel > 0) {
            bgColor = 'bg-red-500'
          }
          // 2. 파랑 (Sell Signal): 상승 둔화 (고점 징후) 또는 하락 가속
          else if (accel < 0) {
            bgColor = 'bg-blue-500'
          }
          // 3. 회색: 나머지
          else {
            bgColor = 'bg-gray-400'
          }
        }

        return (
          <Badge key={maKey} className={`h-4 px-1 text-[10px] ${bgColor} text-white`}>
            {maKey.replace('ma', '')} ({slope.toFixed(2)}%,{accel.toFixed(2)}%)
          </Badge>
        )
      })}
    </div>
  )
}
