import type { StatusId } from './types'

export interface StatusInfo {
  name: string
  description: (n: number) => string
  debuff: boolean
  /** Decreases by 1 at the end of its owner's turn. */
  decays: boolean
  icon: string
}

export const STATUS_INFO: Record<StatusId, StatusInfo> = {
  strength: {
    name: 'Experience',
    description: (n) => `Attacks deal ${n} more damage.`,
    debuff: false,
    decays: false,
    icon: '⚔',
  },
  dexterity: {
    name: 'Discipline',
    description: (n) => `Cards give ${n} more Block.`,
    debuff: false,
    decays: false,
    icon: '◈',
  },
  vulnerable: {
    name: 'Tech Debt',
    description: (n) => `Takes 50% more attack damage for ${n} turn${n === 1 ? '' : 's'}.`,
    debuff: true,
    decays: true,
    icon: '✖',
  },
  weak: {
    name: 'Burnout',
    description: (n) => `Deals 25% less attack damage for ${n} turn${n === 1 ? '' : 's'}.`,
    debuff: true,
    decays: true,
    icon: '☁',
  },
  ritual: {
    name: 'Momentum',
    description: (n) => `Gains ${n} Experience at the end of each turn.`,
    debuff: false,
    decays: false,
    icon: '☄',
  },
  thorns: {
    name: 'Policy',
    description: (n) => `Attackers take ${n} damage per hit.`,
    debuff: false,
    decays: false,
    icon: '✷',
  },
  buffer: {
    name: 'Buffer',
    description: (n) => `Prevents the next ${n} time${n === 1 ? '' : 's'} you would lose Morale.`,
    debuff: false,
    decays: false,
    icon: '⛨',
  },
  ssr: {
    name: 'Next.js SSR',
    description: (n) => `At the start of your turn, gain ${n} Block.`,
    debuff: false,
    decays: false,
    icon: '▲',
  },
  federation: {
    name: 'Federation',
    description: (n) => `Whenever you play an Attack, deal ${n} damage to ALL enemies.`,
    debuff: false,
    decays: false,
    icon: '⬡',
  },
  pairProgrammer: {
    name: 'AI Pair',
    description: (n) => `At the start of your turn, draw ${n} extra card${n === 1 ? '' : 's'}.`,
    debuff: false,
    decays: false,
    icon: '✦',
  },
  pipeline: {
    name: 'CI/CD',
    description: (n) => `At the end of your turn, deal ${n} damage to ALL enemies.`,
    debuff: false,
    decays: false,
    icon: '⟳',
  },
  growth: {
    name: 'Growth',
    description: (n) => `At the start of your turn, gain ${n} Experience.`,
    debuff: false,
    decays: false,
    icon: '❦',
  },
}
