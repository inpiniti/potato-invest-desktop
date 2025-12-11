import type { Meta, StoryObj } from '@storybook/react'
import TradingViewWidgetChart from './TradingViewWidgetChart'

const meta: Meta<typeof TradingViewWidgetChart> = {
  title: 'Components/TradingViewWidgetChart',
  component: TradingViewWidgetChart,
  tags: ['autodocs'],
  argTypes: {
    symbol: { control: 'text' },
    market: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof TradingViewWidgetChart>

export const Default: Story = {
  args: {
    symbol: 'AAPL',
    market: 'NASDAQ',
  },
}

export const Tesla: Story = {
  args: {
    symbol: 'TSLA',
    market: 'NASDAQ',
  },
}
