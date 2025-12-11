import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Loader2 } from 'lucide-react'
import type { Trend } from '@/types/trend'
import type { TradingViewBBData } from '@/types/tradingview'
import type { TradingListItem } from '@/types/trading'
import type { RealtimePrice } from '@/types/realtime'
import { useTradingCardLogic } from './hooks/useTradingCardLogic'
import { TradingHeader } from './ui/TradingHeader'
import { TradingTrendBadges } from './ui/TradingTrendBadges'
import { TradingMicroStructure } from './ui/TradingMicroStructure'
import { TradingHistoryTable } from './ui/TradingHistoryTable'

interface TradingCardProps {
  trading: TradingListItem
  realtimeData: RealtimePrice | undefined
  trend: Trend | null
  trendLoading: boolean
  bbData: TradingViewBBData | null
  handleRemoveClick: (ticker: string, name: string) => void
  onAutoTrade: (ticker: string, price: number, type: 'buy' | 'sell') => void
  onSelectStock: (ticker: string, exchange: 'NAS' | 'NYS') => void
}

export const TradingCard = ({ 
  trading, 
  realtimeData,
  trend,
  trendLoading,
  bbData,
  handleRemoveClick, 
  onAutoTrade,
  onSelectStock
}: TradingCardProps) => {
  const {
    dailyTrend,
    currentPrice,
    changeRate,
    changeDiff,
    histories,
    isHighlighted,
    supplyDemandStatus,
    supplyDemandColor,
    strength,
    spreadStatus,
    spreadColor,
    spreadRate,
    autoTradeStatus
  } = useTradingCardLogic({ trading, realtimeData, trend, onAutoTrade })

  return (
    <Card 
      key={trading.ticker} 
      className={`w-full transition-all duration-1000 ${
        isHighlighted 
          ? 'border-primary/80 shadow-lg shadow-primary/20' 
          : 'border-border'
      } ${autoTradeStatus !== 'idle' ? 'ring-2 ring-primary' : ''}`}
    >
      <CardHeader className="p-3 flex flex-row items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              {/* Header: Ticker, Price, Badges */}
              <TradingHeader 
                ticker={trading.ticker}
                name={trading.name}
                currentPrice={currentPrice}
                changeRate={changeRate}
                changeDiff={changeDiff}
                bbData={bbData}
                onSelectStock={() => onSelectStock(trading.ticker, trading.exchange)}
              />
              
              {/* Daily Trend Badges (Simple Mode) */}
              {dailyTrend && (
                <TradingTrendBadges trend={dailyTrend} mode="simple" />
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveClick(trading.ticker, trading.name)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 pt-0">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-muted-foreground">
            추가일: {new Date(trading.addedAt).toLocaleDateString('ko-KR')}
          </div>
          
          <div className="flex flex-col gap-1 items-end">
            <div className="flex items-center gap-2">
              {trendLoading && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
              {/* Minute Trend Badges (Detailed Mode) */}
              <TradingTrendBadges trend={trend} loading={trendLoading} mode="detailed" />
            </div>
            
            {/* Microstructure Info */}
            {realtimeData && (
              <TradingMicroStructure
                supplyDemandStatus={supplyDemandStatus}
                supplyDemandColor={supplyDemandColor}
                strength={strength}
                spreadStatus={spreadStatus}
                spreadColor={spreadColor}
                spreadRate={spreadRate}
              />
            )}
          </div>
        </div>
        
        {/* History Table */}
        <TradingHistoryTable histories={histories} currentPrice={currentPrice} />
      </CardContent>
    </Card>
  )
}
