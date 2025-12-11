import type { Meta, StoryObj } from '@storybook/react'
import { TrendAnalysisDialog } from './trend-analysis-dialog'
import { fn } from '@storybook/test'
import { useSP500Store } from '@/stores/useSP500Store'
import { useEffect } from 'react'

const meta: Meta<typeof TrendAnalysisDialog> = {
  title: 'Components/TrendAnalysisDialog',
  component: TrendAnalysisDialog,
  tags: ['autodocs'],
  argTypes: {
    open: {
        control: 'boolean',
    },
  },
  decorators: [
      (Story) => {
          useEffect(() => {
              useSP500Store.setState({
                  sp500: [
                      { ticker: 'AAPL', name: 'Apple Inc.', exchange: 'NAS' },
                      { ticker: 'MSFT', name: 'Microsoft Corp.', exchange: 'NAS' },
                      { ticker: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NAS' },
                  ]
              })
          }, [])
          return <Story />
      }
  ]
}

export default meta
type Story = StoryObj<typeof TrendAnalysisDialog>

export const Default: Story = {
  args: {
    open: true,
    onOpenChange: fn(),
  },
}
