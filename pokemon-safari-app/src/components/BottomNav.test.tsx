import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BottomNav } from './BottomNav'

describe('BottomNav', () => {
  it('exposes five accessible links labeled Home, Game, Dex, Pack, Settings', () => {
    render(<BottomNav />)

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Game' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dex' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pack' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument()
  })

  it('applies touch-target class on nav controls', () => {
    render(<BottomNav />)

    const home = screen.getByRole('link', { name: 'Home' })
    expect(home.className).toMatch(/touch-target/)
  })
})
