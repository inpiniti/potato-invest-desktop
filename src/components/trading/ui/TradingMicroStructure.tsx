interface TradingMicroStructureProps {
  supplyDemandStatus: string
  supplyDemandColor: string
  strength: number | null
  spreadStatus: string
  spreadColor: string
  spreadRate: number
}

export const TradingMicroStructure = ({
  supplyDemandStatus,
  supplyDemandColor,
  strength,
  spreadStatus,
  spreadColor,
  spreadRate
}: TradingMicroStructureProps) => {
  return (
    <div className="flex items-center gap-2 text-[10px]">
      {/* 수급 상태 */}
      <div className={`flex items-center gap-1 ${supplyDemandColor}`}>
        <span className="font-medium">{supplyDemandStatus}</span>
        {strength && <span className="text-muted-foreground">({strength.toFixed(0)}%)</span>}
      </div>
      
      <div className="h-2 w-[1px] bg-border" />
      
      {/* 스프레드 상태 */}
      <div className="flex items-center gap-1">
        <div className={`h-1.5 w-1.5 rounded-full ${spreadColor}`} />
        <span className="text-muted-foreground">{spreadStatus}</span>
        {spreadRate > 0 && <span className="text-muted-foreground">({spreadRate.toFixed(2)}%)</span>}
      </div>
    </div>
  )
}
