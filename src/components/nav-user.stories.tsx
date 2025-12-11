import type { Meta, StoryObj } from '@storybook/react'
import { NavUser } from './nav-user'
import { SidebarProvider } from '@/components/ui/sidebar'
import { useAuthStore } from '@/stores/useAuthStore'
import { useSettingStore } from '@/stores/useSettingStore'
import { useEffect } from 'react'

const meta: Meta<typeof NavUser> = {
  title: 'Components/NavUser',
  component: NavUser,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <SidebarProvider>
        <div className="w-64 p-4 border rounded-md">
           <Story />
        </div>
      </SidebarProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof NavUser>

export const LoggedOut: Story = {
    decorators: [
        (Story) => {
            useEffect(() => {
                useAuthStore.setState({ 
                    userId: null,
                    email: null,
                    logout: () => {}
                })
            }, [])
            return <Story />
        }
    ]
}

export const LoggedIn: Story = {
    decorators: [
        (Story) => {
            useEffect(() => {
                useAuthStore.setState({ 
                    userId: 'mock-user-id',
                    email: 'user@example.com',
                    name: 'Test User',
                    thumbnailUrl: 'https://github.com/shadcn.png',
                    logout: () => {}
                })
            }, [])
            return <Story />
        }
    ]
}
