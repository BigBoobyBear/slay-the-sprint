import { CARD_BY_ID } from '../content/cards'
import { STATUS_INFO } from './statuses'
import type { CardDef, CardInstance, Combatant, Effect, Statuses } from './types'

export interface ResolvedCard {
  def: CardDef
  name: string
  cost: number
  effects: Effect[]
  exhaust: boolean
  upgraded: boolean
}

export function resolveCard(id: string, upgraded: boolean): ResolvedCard {
  const def = CARD_BY_ID[id]
  if (!def) throw new Error(`Unknown card: ${id}`)
  const up = upgraded && def.upgrade ? def.upgrade : undefined
  return {
    def,
    name: up?.name ?? (upgraded && def.upgrade ? `${def.name}+` : def.name),
    cost: up?.cost ?? def.base.cost,
    effects: up?.effects ?? def.base.effects,
    exhaust: up?.exhaust ?? def.base.exhaust ?? false,
    upgraded,
  }
}

export function resolveInstance(card: CardInstance, tempUpgrades: number[] = []): ResolvedCard {
  return resolveCard(card.id, card.upgraded || tempUpgrades.includes(card.uid))
}

export function canUpgrade(card: CardInstance): boolean {
  return !card.upgraded && Boolean(CARD_BY_ID[card.id]?.upgrade)
}

// ---------- Damage / block maths (shared by engine and UI previews) ----------

export function attackDamage(base: number, attacker: Statuses, defender?: Statuses): number {
  let dmg = base + (attacker.strength ?? 0)
  if ((attacker.weak ?? 0) > 0) dmg *= 0.75
  if (defender && (defender.vulnerable ?? 0) > 0) dmg *= 1.5
  return Math.max(0, Math.floor(dmg))
}

export function cardBlock(base: number, player: Statuses): number {
  return Math.max(0, base + (player.dexterity ?? 0))
}

// ---------- Text ----------

export interface DescribeContext {
  player: Combatant
  target?: Combatant
}

function num(base: number, actual: number | undefined) {
  if (actual === undefined || actual === base) return String(base)
  return actual > base ? `${actual}▲` : `${actual}▼`
}

export function describeEffect(effect: Effect, ctx?: DescribeContext): string {
  switch (effect.kind) {
    case 'damage': {
      const actual = ctx ? attackDamage(effect.amount, ctx.player.statuses, effect.target === 'enemy' ? ctx.target?.statuses : undefined) : undefined
      const times = effect.times && effect.times > 1 ? ` ${effect.times} times` : ''
      const who = effect.target === 'all' ? ' to ALL enemies' : effect.target === 'random' ? ' to a random enemy' : ''
      const pierce = effect.pierce ? ' Ignores Block.' : ''
      return `Deal ${num(effect.amount, actual)} damage${who}${times}.${pierce}`
    }
    case 'damageFromBlock':
      return ctx ? `Deal damage equal to your Block (${attackDamage(ctx.player.block, ctx.player.statuses, ctx.target?.statuses)}).` : 'Deal damage equal to your Block.'
    case 'block': {
      const actual = ctx ? cardBlock(effect.amount, ctx.player.statuses) : undefined
      return `Gain ${num(effect.amount, actual)} Block.`
    }
    case 'doubleBlock':
      return 'Double your Block.'
    case 'draw':
      return `Draw ${effect.amount} card${effect.amount === 1 ? '' : 's'}.`
    case 'energy':
      return `Gain ${effect.amount} Focus.`
    case 'heal':
      return `Heal ${effect.amount} Morale.`
    case 'loseHp':
      return `Lose ${effect.amount} Morale.`
    case 'upgradeHand':
      return 'Upgrade ALL cards in your hand for this combat.'
    case 'exhaustStatusCardsDraw':
      return 'Exhaust all Status cards in your hand. Draw 1 card for each.'
    case 'status': {
      const info = STATUS_INFO[effect.status]
      if (['ssr', 'federation', 'pairProgrammer', 'pipeline', 'growth'].includes(effect.status)) {
        return info.description(effect.amount)
      }
      if (effect.status === 'buffer') return `Gain ${effect.amount} Buffer.`
      const who = effect.target === 'self' ? 'Gain' : 'Apply'
      const to = effect.target === 'all' ? ' to ALL enemies' : ''
      return `${who} ${effect.amount} ${info.name}${to}.`
    }
  }
}

export function describeCard(card: ResolvedCard, ctx?: DescribeContext): string {
  const parts = card.effects.map((e) => describeEffect(e, ctx))
  if (card.def.unplayable) parts.unshift('Unplayable.')
  if (card.def.burnAtEndOfTurn) parts.push(`End of turn: lose ${card.def.burnAtEndOfTurn} Morale.`)
  if (card.exhaust) parts.push('Exhaust.')
  return parts.join(' ')
}
