import type { Meta, StoryObj } from '@storybook/react'
import { AccountSettingsDialog } from './account-settings-dialog'
import { fn } from '@storybook/test'

// Mock Stores
import { useAccountStore } from '@/stores/useAccountStore'
import { useBalanceStore } from '@/stores/useBalanceStore'
import { useEffect } from 'react'

const meta: Meta<typeof AccountSettingsDialog> = {
  title: 'Components/AccountSettingsDialog',
  component: AccountSettingsDialog,
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
    },
  },
  decorators: [
    (Story) => {
        // Mocking Data
        useEffect(() => {
            useAccountStore.setState({
                accounts: [
                    { cano: '12345678-01', appkey: 'mock-key-1', appsecret: 'mock-secret', alias: 'Main Account' },
                    { cano: '87654321-01', appkey: 'mock-key-2', appsecret: 'mock-secret' }
                ],
                selectedAccount: { cano: '12345678-01', appkey: 'mock-key-1', appsecret: 'mock-secret', alias: 'Main Account' }
            })
            useBalanceStore.setState({
                balance: {
                    tot_asst_amt: '10000.00',
                    evlu_amt_smtl: '10500.00',
                    evlu_pfls_amt_smtl: '500.00',
                    evlu_erng_rt1: '5.00',
                    dncl_amt: '2000.00',
                    wdrw_psbl_tot_amt: '2000.00',
                    pchs_amt_smtl: '8000.00',
                    frcr_evlu_tota: '10500.00'
                },
                holdings: []
            })
        }, [])
        return <Story />
    }
  ]
}

export default meta
type Story = StoryObj<typeof AccountSettingsDialog>

export const Default: Story = {
  args: {
    open: true,
    onOpenChange: fn(),
  },
}

export const Empty: Story = {
    args: {
        open: true,
        onOpenChange: fn(),
    },
    decorators: [
        (Story) => {
            useEffect(() => {
                useAccountStore.setState({ accounts: [], selectedAccount: null })
                useBalanceStore.setState({ balance: null, holdings: [] })
            }, [])
            return <Story />
        }
    ]
}
