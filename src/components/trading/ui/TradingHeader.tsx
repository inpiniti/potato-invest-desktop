import { Badge } from '@/components/ui/badge'
import { calculateBBSignal } from '@/types/tradingview'
import type { TradingViewBBData } from '@/types/tradingview'

interface TradingHeaderProps {
  ticker: string
  name: string
  currentPrice: number | null
  changeRate: number | null
  changeDiff: number | null
  bbData: TradingViewBBData | null
  onSelectStock: () => void
}

export const TradingHeader = ({
  ticker,
  name,
  currentPrice,
  changeRate,
  changeDiff,
  bbData,
  onSelectStock
}: TradingHeaderProps) => {
  // Bollinger Band Signal Badge
  const renderBBSignal = () => {
    const signal = bbData ? calculateBBSignal(bbData) : null
    if (!signal) return null
    const signalStyles: Record<string, string> = {
      '강력매수': 'bg-red-600 text-white font-bold',
      '매수': 'bg-red-400 text-white',
      '매도': 'bg-blue-400 text-white',
      '강력매도': 'bg-blue-600 text-white font-bold',
    }
    return (
      <Badge className={`h-4 px-1 text-[10px] ${signalStyles[signal] || 'bg-gray-400 text-white'}`}>
        {signal}
      </Badge>
    )
  }

  return (
    <div 
      className="cursor-pointer hover:opacity-80"
      onClick={onSelectStock}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{ticker}</span>
        <span className="text-xs text-muted-foreground">{name}</span>
        {renderBBSignal()}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-lg font-bold">
          ${currentPrice ? currentPrice.toFixed(2) : '-.--'}
        </span>
        {changeRate !== null && (
          <span className={`text-xs ${changeRate > 0 ? 'text-red-400' : changeRate < 0 ? 'text-blue-400' : 'text-gray-400'}`}>
            {changeRate > 0 ? '+' : ''}{changeRate}% (${changeDiff})
          </span>
        )}
      </div>
    </div>
  )
}
