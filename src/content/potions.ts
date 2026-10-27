import type { CardTarget, Effect } from '../engine/types'

// Potions are AI tools from the CV: single-use boosts.

export interface PotionDef {
  id: string
  name: string
  description: string
  target: CardTarget
  effects: Effect[]
  cv: string
  color: string
}

export const POTIONS: PotionDef[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    description: 'Draw 3 cards. Gain 1 Focus.',
    target: 'none',
    effects: [
      { kind: 'draw', amount: 3 },
      { kind: 'energy', amount: 1 },
    ],
    cv: 'Claude Code: part of an AI-assisted SDLC workflow, plus his own agents and harnesses.',
    color: '#e07a4f',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    description: 'Gain 2 Focus.',
    target: 'none',
    effects: [{ kind: 'energy', amount: 2 }],
    cv: 'Cursor, the AI code editor (Intermediate).',
    color: '#9aa4b8',
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    description: 'Deal 18 damage.',
    target: 'enemy',
    effects: [{ kind: 'damage', amount: 18, target: 'enemy' }],
    cv: 'GitHub Copilot (Intermediate) and Copilot for Microsoft 365.',
    color: '#6e7bd9',
  },
  {
    id: 'codex',
    name: 'Codex',
    description: 'Gain 14 Block.',
    target: 'none',
    effects: [{ kind: 'block', amount: 14 }],
    cv: 'OpenAI Codex, one of his daily AI tools.',
    color: '#4fa38a',
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    description: 'Apply 3 Tech Debt to an enemy.',
    target: 'enemy',
    effects: [{ kind: 'status', status: 'vulnerable', amount: 3, target: 'enemy' }],
    cv: 'Windsurf, the AI IDE (Intermediate).',
    color: '#3fb6c9',
  },
  {
    id: 'antigravity',
    name: 'Antigravity',
    description: 'Deal 10 damage to ALL enemies.',
    target: 'none',
    effects: [{ kind: 'damage', amount: 10, target: 'all' }],
    cv: "Google Antigravity, Google's agentic IDE.",
    color: '#8a6fd1',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    description: 'Heal 15 Morale.',
    target: 'none',
    effects: [{ kind: 'heal', amount: 15 }],
    cv: 'Ollama: running models locally. Offline healing.',
    color: '#d8d3c4',
  },
  {
    id: 'openclaw',
    name: 'OpenClaw',
    description: 'Gain 2 Experience.',
    target: 'none',
    effects: [{ kind: 'status', status: 'strength', amount: 2, target: 'self' }],
    cv: 'OpenClaw, an open-source agent he experiments with.',
    color: '#d1554f',
  },
]

export const POTION_BY_ID: Record<string, PotionDef> = Object.fromEntries(POTIONS.map((p) => [p.id, p]))
