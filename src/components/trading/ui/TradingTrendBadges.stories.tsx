import type { Meta, StoryObj } from '@storybook/react'
import { TradingTrendBadges } from './TradingTrendBadges'
import type { Trend } from '@/types/trend'

const meta: Meta<typeof TradingTrendBadges> = {
  title: 'Trading/UI/TradingTrendBadges',
  component: TradingTrendBadges,
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'radio',
      options: ['simple', 'detailed'],
    },
    loading: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof TradingTrendBadges>

const mockTrend: Trend = {
  ticker: 'AAPL',
  exchange: 'NAS',
  ma20: { value: 150, slope: 5, accel: 2, description: '상승폭 확대' },
  ma50: { value: 140, slope: 2, accel: -1, description: '상승폭 둔화' },
  ma100: { value: 130, slope: 0, accel: 0, description: '횡보' },
  ma200: { value: 120, slope: -2, accel: -1, description: '하락폭 확대' },
}

export const Detailed: Story = {
  args: {
    trend: mockTrend,
    mode: 'detailed',
    loading: false,
  },
}

export const Simple: Story = {
  args: {
    trend: mockTrend,
    mode: 'simple',
    loading: false,
  },
}

export const Loading: Story = {
  args: {
    trend: null,
    loading: true,
  },
}
