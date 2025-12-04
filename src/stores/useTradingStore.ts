import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TradingItem {
  ticker: string
  name: string
  addedAt: string
}

interface TradingStore {
  tradings: TradingItem[]
  addTrading: (ticker: string, name: string) => void
  removeTrading: (ticker: string) => void
  isInTrading: (ticker: string) => boolean
  clearTradings: () => void
}

export const useTradingStore = create<TradingStore>()(
  persist(
    (set, get) => ({
      tradings: [],
      
      addTrading: (ticker: string, name: string) => {
        const { tradings } = get()
        if (!tradings.find(t => t.ticker === ticker)) {
          set({
            tradings: [
              ...tradings,
              {
                ticker,
                name,
                addedAt: new Date().toISOString(),
              },
            ],
          })
        }
      },
      
      removeTrading: (ticker: string) => {
        set({
          tradings: get().tradings.filter(t => t.ticker !== ticker),
        })
      },
      
      isInTrading: (ticker: string) => {
        return get().tradings.some(t => t.ticker === ticker)
      },
      
      clearTradings: () => {
        set({ tradings: [] })
      },
    }),
    {
      name: 'trading-storage',
    }
  )
)
