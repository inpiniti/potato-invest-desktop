import type { Meta, StoryObj } from '@storybook/react'
import { RightPanel } from './right-panel'
import { useStockStore } from '@/stores/useStockStore'
import { useEffect } from 'react'

const meta: Meta<typeof RightPanel> = {
  title: 'Components/RightPanel',
  component: RightPanel,
  tags: ['autodocs'],
  decorators: [
    (Story) => {
        // Mock store
        const { setTicker, setNews, setToss } = useStockStore()
        
        useEffect(() => {
            setTicker('AAPL')
            setNews([
                {
                    title: 'Apple releases new iPhone 16',
                    content: 'The new iPhone 16 features...',
                    author: 'TechCrunch',
                    createdAt: new Date().toISOString(),
                    thumbnail: 'https://via.placeholder.com/150',
                },
            ])
            setToss([
                {
                    title: 'TSLA Analysis',
                    author: 'investor1',
                    content: 'Apple is going to the moon!',
                    createdAt: new Date().toISOString(),
                    likeCount: 10,
                    readCount: 100,
                },
            ])
        }, [])
        
        return (
            <div className="w-80 h-[600px] border">
                <Story />
            </div>
        )
    }
  ],
}

export default meta
type Story = StoryObj<typeof RightPanel>

export const Default: Story = {}

export const Empty: Story = {
    decorators: [
        (Story) => {
            const { setTicker, setNews, setToss } = useStockStore()
             useEffect(() => {
                setTicker('TSLA')
                setNews([])
                setToss([])
            }, [])
            return (
                 <div className="w-80 h-[600px] border">
                    <Story />
                </div>
            )
        }
    ]
}

export const NoSelection: Story = {
     decorators: [
        (Story) => {
            const { setTicker } = useStockStore()
             useEffect(() => {
                setTicker('')
            }, [])
            return (
                 <div className="w-80 h-[600px] border">
                    <Story />
                </div>
            )
        }
    ]
}
