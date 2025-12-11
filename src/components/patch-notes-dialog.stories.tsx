import type { Meta, StoryObj } from '@storybook/react'
import { PatchNotesDialog } from './patch-notes-dialog'
import { fn } from '@storybook/test'

const meta: Meta<typeof PatchNotesDialog> = {
  title: 'Components/PatchNotesDialog',
  component: PatchNotesDialog,
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof PatchNotesDialog>

export const Open: Story = {
  args: {
    open: true,
    onOpenChange: fn(),
  },
}
