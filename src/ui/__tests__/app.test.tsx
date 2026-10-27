import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../../App'
import { useGame } from '../../store/gameStore'

function reset() {
  useGame.setState({ run: null, view: 'title', overlay: null, inspect: null, muted: true, storyMode: false })
}

describe('App (integration)', () => {
  beforeEach(reset)

  it('shows the title screen with recruiter quick facts and CV access', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Slay the Sprint')
    expect(screen.getByText('For recruiters, in 10 seconds')).toBeInTheDocument()
    expect(screen.getAllByText('nhannd213@gmail.com').length).toBeGreaterThan(0)
    expect(document.body.textContent).not.toMatch(/964|084 251|Nguyen Khe/)
  })

  it('"Just read the CV" opens the CV overlay', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Just read the CV (2 min)'))
    const cv = screen.getByRole('dialog', { name: 'Curriculum vitae' })
    expect(within(cv).getByText('Optimizely CMS Migration · Apr 2026 – Sep 2026')).toBeInTheDocument()
    fireEvent.click(within(cv).getByText('← Back to the game'))
    expect(screen.queryByRole('dialog', { name: 'Curriculum vitae' })).not.toBeInTheDocument()
  })

  it('plays from onboarding into a fight, plays a card and ends a turn', async () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Seed'), { target: { value: 'DEMO' } })
    fireEvent.click(screen.getByText('Start a run'))
    expect(await screen.findByText('Onboarding Day', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(useGame.getState().run!.seed).toBe('DEMO')
    fireEvent.click(screen.getByText('Graduate from PTIT'))

    // Map: first-floor rooms are available buttons
    const rooms = await screen.findAllByRole('button', { name: /Floor 1: Fight.*\(available\)/ })
    fireEvent.click(rooms[0])
    expect(useGame.getState().run!.screen).toBe('combat')

    const hand = await screen.findByRole('list', { name: 'Your hand' })
    // A Skill needs no target, so one click plays it.
    const run = useGame.getState().run!
    const idx = run.combat!.hand.findIndex((c) => c.id === 'unit-test' || c.id === 'stand-up')
    expect(idx).toBeGreaterThanOrEqual(0)
    fireEvent.click(within(hand).getAllByRole('button', { name: /^\d+:/ })[idx])
    expect(useGame.getState().run!.stats.cardsPlayed).toBe(1)
    expect(useGame.getState().run!.combat!.hand).toHaveLength(run.combat!.hand.length - 1 + (run.combat!.hand[idx].id === 'stand-up' ? 1 : 0))

    act(() => {
      fireEvent.click(screen.getByText('End Turn'))
    })
    const after = useGame.getState().run!
    expect(after.screen === 'combat' ? after.combat!.turn : 2).toBe(2)
  })

  it('Skip to CV is available during a run and inspect shows the CV story', async () => {
    render(<App />)
    fireEvent.click(screen.getByText('Start a run'))
    fireEvent.click(await screen.findByText('Start committing early', {}, { timeout: 3000 }))
    fireEvent.click(await screen.findByRole('button', { name: /Relic VS Code/ }))
    expect(screen.getByText('From the CV')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.click(screen.getByText('Skip to CV'))
    expect(screen.getByRole('dialog', { name: 'Curriculum vitae' })).toBeInTheDocument()
  })

  it('the Codex lists every chapter of the career', async () => {
    render(<App />)
    fireEvent.click(screen.getByText('Start a run'))
    fireEvent.click(await screen.findByText('Start committing early', {}, { timeout: 3000 }))
    fireEvent.click(await screen.findByTitle(/Codex/))
    fireEvent.click(screen.getByRole('tab', { name: 'Acts = Career' }))
    expect(screen.getByText(/Chapter 3 · Optimizely CMS Migration/)).toBeInTheDocument()
  })
})
