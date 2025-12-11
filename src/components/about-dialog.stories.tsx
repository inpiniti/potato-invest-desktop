import type { Meta, StoryObj } from '@storybook/react'
import { AboutDialog } from './about-dialog'
import { fn } from '@storybook/test'

const meta: Meta<typeof AboutDialog> = {
  title: 'Components/AboutDialog',
  component: AboutDialog,
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof AboutDialog>

export const Open: Story = {
  args: {
    open: true,
    onOpenChange: fn(),
  },
}
