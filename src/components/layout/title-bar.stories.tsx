import type { Meta, StoryObj } from '@storybook/react'
import { TitleBar } from './title-bar'
import { SidebarProvider } from '@/components/ui/sidebar'

const meta: Meta<typeof TitleBar> = {
  title: 'Layout/TitleBar',
  component: TitleBar,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <SidebarProvider>
        <div className="w-full border shadow-md">
          <Story />
        </div>
      </SidebarProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof TitleBar>

export const Default: Story = {}
