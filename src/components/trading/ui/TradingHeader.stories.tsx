import type { Meta, StoryObj } from '@storybook/react'
import { TradingHeader } from './TradingHeader'
import { fn } from '@storybook/test'

const meta: Meta<typeof TradingHeader> = {
  title: 'Trading/UI/TradingHeader',
  component: TradingHeader,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof TradingHeader>

export const Default: Story = {
  args: {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    currentPrice: 155.50,
    changeRate: 1.25,
    changeDiff: 2.50,
    bbData: {
      bbUpper: 160,
      bbLower: 140,
      bbBasis: 150,
      marketCap: 3000000000000,
    },
    onSelectStock: fn(),
  },
}

export const Negative: Story = {
  args: {
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    currentPrice: 200.00,
    changeRate: -2.50,
    changeDiff: -5.00,
    bbData: null,
    onSelectStock: fn(),
  },
}
