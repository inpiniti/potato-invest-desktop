import type { Meta, StoryObj } from '@storybook/react'
import { IssueDialog } from './issue-dialog'
import { fn } from '@storybook/test'

const meta: Meta<typeof IssueDialog> = {
  title: 'Components/IssueDialog',
  component: IssueDialog,
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
    },
    type: {
        control: 'radio',
        options: ['bug', 'feature'],
    },
  },
}

export default meta
type Story = StoryObj<typeof IssueDialog>

export const OpenBug: Story = {
  args: {
    open: true,
    onOpenChange: fn(),
    type: 'bug',
  },
}

export const OpenFeature: Story = {
  args: {
    open: true,
    onOpenChange: fn(),
    type: 'feature',
  },
}
