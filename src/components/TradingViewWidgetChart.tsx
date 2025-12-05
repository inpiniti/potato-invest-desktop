import { useEffect, useRef, memo } from "react"

interface TradingViewWidgetChartProps {
  symbol?: string
  market?: string
}

function TradingViewWidgetChart({ symbol = "AAPL", market = "NASDAQ" }: TradingViewWidgetChartProps) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current) return
    
    // 이전 위젯 제거 (심볼 변경 시 교체)
    try {
      container.current.innerHTML = ""
    } catch (e) {
      // ignore
    }

    const script = document.createElement("script")
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.type = "text/javascript"
    script.async = true
    script.innerHTML = `
        {
          "allow_symbol_change": false,
          "calendar": false,
          "details": true,
          "hide_side_toolbar": true,
          "hide_top_toolbar": false,
          "hide_legend": false,
          "hide_volume": false,
          "hotlist": false,
          "interval": "D",
          "locale": "kr",
          "save_image": true,
          "style": "1",
          "symbol": "${market}:${symbol}",
          "theme": "dark",
          "timezone": "Etc/UTC",
          "backgroundColor": "rgba(0, 0, 0, 0)",
          "watchlist": [],
          "withdateranges": false,
          "compareSymbols": [],
          "studies": [
            "STD;Bollinger_Bands",
            "STD;MA%Ribbon"
          ],
          "autosize": true
        }`
    container.current.appendChild(script)

    return () => {
      try {
        if (container.current) container.current.innerHTML = ""
      } catch (e) {
        // ignore
      }
    }
  }, [symbol, market])

  return (
    <div className="tradingview-widget-container h-full w-full" ref={container}>
      <div className="tradingview-widget-container__widget h-full"></div>
    </div>
  )
}

export default memo(TradingViewWidgetChart)
