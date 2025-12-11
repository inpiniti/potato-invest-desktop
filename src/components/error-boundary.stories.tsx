import type { Meta, StoryObj } from '@storybook/react'
import { ErrorBoundary } from './error-boundary'
import { Button } from '@/components/ui/button'

const ErrorComponent = () => {
  throw new Error('This is a test error for Storybook.')
}

const meta: Meta<typeof ErrorBoundary> = {
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ErrorBoundary>

export const Default: Story = {
  args: {
    children: <div>Content is valid</div>
  },
}

export const WithError: Story = {
  args: {
      children: <ErrorComponent />
  }
}
