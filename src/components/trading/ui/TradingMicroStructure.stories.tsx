import type { Meta, StoryObj } from '@storybook/react'
import { TradingMicroStructure } from './TradingMicroStructure'

const meta: Meta<typeof TradingMicroStructure> = {
  title: 'Trading/UI/TradingMicroStructure',
  component: TradingMicroStructure,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof TradingMicroStructure>

export const StrongBuy: Story = {
  args: {
    supplyDemandStatus: '강한 매수세',
    supplyDemandColor: 'text-red-500 font-bold',
    strength: 150,
    spreadStatus: '양호',
    spreadColor: 'bg-green-500',
    spreadRate: 0.05,
  },
}

export const StrongSell: Story = {
  args: {
    supplyDemandStatus: '강한 매도세',
    supplyDemandColor: 'text-blue-500 font-bold',
    strength: 50,
    spreadStatus: '⚠️ 호가 벌어짐',
    spreadColor: 'bg-orange-500',
    spreadRate: 0.15,
  },
}

export const Caution: Story = {
  args: {
    supplyDemandStatus: '팽팽함',
    supplyDemandColor: 'text-gray-500',
    strength: 100,
    spreadStatus: '❗거래량 부족',
    spreadColor: 'bg-red-500',
    spreadRate: 0.35,
  },
}
