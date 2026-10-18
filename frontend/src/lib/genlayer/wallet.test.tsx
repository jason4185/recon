import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useWallet, WalletControl, WalletProvider } from './wallet'

function State() {
  const wallet = useWallet()
  return <output data-testid="wallet-state">{wallet.status}:{wallet.error ?? ''}</output>
}

describe('wallet connection boundary', () => {
  it('shows a real connect action when no injected wallet is available', () => {
    Object.defineProperty(window, 'ethereum', { configurable: true, value: undefined })
    render(<WalletProvider><WalletControl /><State /></WalletProvider>)
    expect(screen.getByRole('button', { name: 'Connect wallet' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Connect wallet' }))
    expect(screen.getByTestId('wallet-state').textContent).toContain('No injected EIP-1193 wallet')
  })
})
