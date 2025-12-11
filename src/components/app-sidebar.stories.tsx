import type { Meta, StoryObj } from '@storybook/react'
import { AppSidebar } from './app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { useTradingStore } from '@/stores/useTradingStore'
import { useSP500Store } from '@/stores/useSP500Store'
import { useEffect } from 'react'
import { Toaster } from 'sonner'

const meta: Meta<typeof AppSidebar> = {
  title: 'Components/AppSidebar',
  component: AppSidebar,
  tags: ['autodocs'],
  decorators: [
    (Story) => {
        // Mock stores
        const { setTradings } = useTradingStore()
        const { setSP500 } = useSP500Store()

        useEffect(() => {
            setTradings([
                { uid: 'u1', ticker: 'AAPL', exchange: 'NAS', addedAt: new Date().toISOString() },
                { uid: 'u1', ticker: 'TSLA', exchange: 'NAS', addedAt: new Date().toISOString() },
            ])
            setSP500([
                { ticker: 'MSFT', name: 'Microsoft', exchange: 'NASDAQ' },
                { ticker: 'GOOGL', name: 'Alphabet', exchange: 'NASDAQ' },
            ])
        }, [])

        return (
            <SidebarProvider>
                <div className="flex bg-background h-screen w-[300px]">
                    <Story />
                </div>
                <Toaster />
            </SidebarProvider>
        )
    }
  ],
}

export default meta
type Story = StoryObj<typeof AppSidebar>

export const Default: Story = {}
