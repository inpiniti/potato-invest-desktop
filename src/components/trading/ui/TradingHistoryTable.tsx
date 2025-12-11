import type { TradingHistory } from '@/types/trading'

interface TradingHistoryTableProps {
  histories: TradingHistory[]
  currentPrice: number | null
}

export const TradingHistoryTable = ({ histories, currentPrice }: TradingHistoryTableProps) => {
  if (histories.length === 0) return null

  return (
    <div className="mt-2 border rounded">
      <table className="w-full text-[10px]">
        <thead className="bg-muted/50">
          <tr>
            <th className="p-1 text-left">매수가</th>
            <th className="p-1 text-left">수량</th>
            <th className="p-1 text-left">매도가</th>
            <th className="p-1 text-right">손익</th>
          </tr>
        </thead>
        <tbody>
          {histories.slice(0, 5).map((h) => {
            const profit = h.sellPrice 
              ? (h.sellPrice - h.buyPrice) * h.buyQuantity 
              : currentPrice 
                ? (currentPrice - h.buyPrice) * h.buyQuantity 
                : null
            const profitRate = h.sellPrice 
              ? ((h.sellPrice - h.buyPrice) / h.buyPrice * 100)
              : currentPrice 
                ? ((currentPrice - h.buyPrice) / h.buyPrice * 100)
                : null
            
            return (
              <tr key={h.id} className="border-t">
                <td className="p-1">${h.buyPrice.toFixed(2)}</td>
                <td className="p-1">{h.buyQuantity}</td>
                <td className="p-1">
                  {h.sellPrice ? `$${h.sellPrice.toFixed(2)}` : <span className="text-muted-foreground">-</span>}
                </td>
                <td className={`p-1 text-right ${profit && profit > 0 ? 'text-red-400' : profit && profit < 0 ? 'text-blue-400' : ''}`}>
                  {profit !== null ? (
                    <>
                      ${profit.toFixed(2)} ({profitRate?.toFixed(1)}%)
                    </>
                  ) : '-'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {histories.length > 5 && (
        <div className="text-[10px] text-muted-foreground text-center py-1">
          +{histories.length - 5}개 더 있음
        </div>
      )}
    </div>
  )
}
