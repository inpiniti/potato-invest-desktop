import type { Meta, StoryObj } from '@storybook/react'
import { TradingCard } from './TradingCard'
import { useTradingStore } from '@/stores/useTradingStore'
import { useTrendStore } from '@/stores/useTrendStore'
import { useEffect } from 'react'
import { fn } from '@storybook/test'

const meta: Meta<typeof TradingCard> = {
  title: 'Trading/TradingCard',
  component: TradingCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      // Mock store updates
      const { setHistories } = useTradingStore()
      const { setTrends } = useTrendStore()

      useEffect(() => {
        setHistories([
          {
            id: '1',
            uid: 'test',
            ticker: 'AAPL',
            buyPrice: 150,
            buyQuantity: 10,
            buyTime: new Date().toISOString(),
            sellPrice: null,
            sellQuantity: null,
            sellTime: null,
          }
        ])
        setTrends([
            {
                ticker: 'AAPL',
                exchange: 'NAS',
                ma20: { value: 155, slope: 5, accel: 2, description: '상승' },
                ma50: { value: 150, slope: 3, accel: 1, description: '상승' },
                ma100: { value: 145, slope: 1, accel: 0, description: '횡보' },
                ma200: { value: 140, slope: 1, accel: 0, description: '횡보' },
            }
        ])
      }, [])

      return <Story />
    }
  ]
}

export default meta
type Story = StoryObj<typeof TradingCard>

const mockTradingItem = {
  id: 't1',
  uid: 'u1',
  ticker: 'AAPL',
  name: 'Apple Inc.',
  exchange: 'NAS' as const,
  addedAt: new Date().toISOString(),
}

const mockRealtimeData = {
    RSYM: 'AAPL',
    SYMB: 'AAPL',
    ZDIV: '0',
    TYMD: '20251211',
    XYMD: '20251211',
    XKHM: '120000',
    KHMS: '120000',
    LAST: '155.50',
    SIGN: '2',
    DIFF: '5.50',
    RATE: '3.67',
    PBID: '155.40',
    PASK: '155.60',
    VBID: '1000',
    VASK: '500',
    STRN: '120.5',
    VOL: '1000000',
}

export const Default: Story = {
  args: {
    trading: mockTradingItem,
    realtimeData: mockRealtimeData,
    trend: {
        ticker: 'AAPL',
        exchange: 'NAS',
        ma20: { value: 155, slope: 5, accel: 2, description: '상승' },
        ma50: { value: 150, slope: 3, accel: 1, description: '상승' },
        ma100: { value: 145, slope: 1, accel: 0, description: '횡보' },
        ma200: { value: 140, slope: 1, accel: 0, description: '횡보' },
    },
    trendLoading: false,
    bbData: {
        bbUpper: 160,
        bbLower: 140,
        bbBasis: 150,
        marketCap: 3000000000000
    },
    handleRemoveClick: fn(),
    onAutoTrade: fn(),
    onSelectStock: fn(),
  },
}
