import type { Meta, StoryObj } from '@storybook/react'
import { TradingHistoryTable } from './TradingHistoryTable'

const meta: Meta<typeof TradingHistoryTable> = {
  title: 'Trading/UI/TradingHistoryTable',
  component: TradingHistoryTable,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof TradingHistoryTable>

const mockHistories = [
  {
    id: '1',
    uid: 'user1',
    ticker: 'AAPL',
    buyPrice: 150.0,
    buyQuantity: 10,
    buyTime: '2025-12-10T10:00:00Z',
    sellPrice: 155.0,
    sellQuantity: 10,
    sellTime: '2025-12-10T11:00:00Z',
  },
  {
    id: '2',
    uid: 'user1',
    ticker: 'AAPL',
    buyPrice: 152.0,
    buyQuantity: 5,
    buyTime: '2025-12-10T12:00:00Z',
    sellPrice: null,
    sellQuantity: null,
    sellTime: null,
  },
]

export const Default: Story = {
  args: {
    histories: mockHistories,
    currentPrice: 153.0,
  },
}

export const Empty: Story = {
  args: {
    histories: [],
    currentPrice: 150.0,
  },
}
