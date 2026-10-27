// Headless balance check: a greedy bot plays N seeded runs with the real
// reducer and reports win rate and where it died.
//   pnpm simulate --runs 500 [--story]

import { CARD_BY_ID } from '../src/content/cards'
import { EVENT_BY_ID } from '../src/content/events'
import { POTION_BY_ID } from '../src/content/potions'
import { attackDamage, canUpgrade, resolveInstance } from '../src/engine/cards'
import { aliveEnemies, intentDamage } from '../src/engine/combat'
import { reachableNodes } from '../src/engine/map'
import { newRun, pickableCards, reduce } from '../src/engine/run'
import type { Action, RunState } from '../src/engine/types'

const args = process.argv.slice(2)
const runs = Number(args[args.indexOf('--runs') + 1]) || 300
const story = args.includes('--story')

function incoming(run: RunState) {
  const c = run.combat!
  return aliveEnemies(c).reduce((sum, e) => {
    const i = intentDamage(c, e)
    return sum + (i ? i.amount * i.times : 0)
  }, 0)
}

function combatAction(run: RunState): Action {
  const c = run.combat!
  const enemies = aliveEnemies(c)
  const target = [...enemies].sort((a, b) => a.hp + a.block - (b.hp + b.block))[0]

  // Potions in elite/boss fights on turn 1, or when low.
  if (c.tier !== 'normal' || c.player.hp < c.player.maxHp * 0.3) {
    const slot = run.potions.findIndex((p) => p)
    if (slot >= 0) return { type: 'USE_POTION', slot, target: target.uid }
  }

  const playable = c.hand
    .map((card) => ({ card, r: resolveInstance(card, c.tempUpgrades) }))
    .filter(({ r }) => !r.def.unplayable && r.cost <= c.energy)
  if (!playable.length) return { type: 'END_TURN' }

  const need = incoming(run) - c.player.block
  const score = ({ r }: (typeof playable)[number]) => {
    let s = 0
    for (const e of r.effects) {
      if (e.kind === 'damage') {
        const per = attackDamage(e.amount, c.player.statuses, target.statuses) * (e.times ?? 1)
        s += e.target === 'all' ? per * enemies.length : per
      }
      if (e.kind === 'block') s += need > 0 ? (e.amount + (c.player.statuses.dexterity ?? 0)) * 1.3 : 1
      if (e.kind === 'draw') s += 4 * e.amount
      if (e.kind === 'energy') s += 6 * e.amount
      if (e.kind === 'status') s += r.def.type === 'power' ? (c.turn <= 2 ? 30 : 8) : 5
      if (e.kind === 'damageFromBlock') s += c.player.block
      if (e.kind === 'doubleBlock') s += need > 0 ? c.player.block : 0
      if (e.kind === 'loseHp') s -= e.amount * 1.5
    }
    if (r.def.type === 'status') s = 0.5
    return s / Math.max(0.6, r.cost)
  }
  const best = playable.sort((a, b) => score(b) - score(a))[0]
  if (score(best) <= 0) return { type: 'END_TURN' }
  return { type: 'PLAY_CARD', uid: best.card.uid, target: target.uid }
}

function step(run: RunState): Action | null {
  if (run.pick) {
    const cards = pickableCards(run)
    if (!cards.length) return { type: 'CANCEL_PICK' }
    const worst =
      run.pick.purpose === 'remove'
        ? (cards.find((c) => ['status', 'curse'].includes(CARD_BY_ID[c.id].type)) ?? cards.find((c) => c.id === 'commit') ?? cards[0])
        : (cards.find((c) => CARD_BY_ID[c.id].rarity !== 'starter') ?? cards[0])
    return { type: 'PICK_CARD', uid: worst.uid }
  }
  switch (run.screen) {
    case 'onboarding':
      return { type: 'CHOOSE_ONBOARDING', option: 'diploma' }
    case 'map': {
      const options = reachableNodes(run.map, run.currentNode).map((id) => run.map.nodes[id])
      const low = run.hp < run.maxHp * 0.5
      const pref = (t: string) => (t === 'rest' ? (low ? 0 : 3) : t === 'elite' ? (low ? 9 : 2) : t === 'monster' ? 1 : 2)
      return { type: 'CHOOSE_NODE', nodeId: options.sort((a, b) => pref(a.type) - pref(b.type))[0].id }
    }
    case 'combat':
      return combatAction(run)
    case 'reward': {
      const r = run.reward!
      if (!r.goldTaken) return { type: 'TAKE_GOLD' }
      if (r.relic) return { type: 'TAKE_RELIC' }
      if (r.bossRelics) return { type: 'TAKE_BOSS_RELIC', relicId: r.bossRelics[0] }
      if (r.potion && run.potions.includes(null)) return { type: 'TAKE_POTION' }
      const cr = r.cardRewards.findIndex((x) => !x.taken)
      if (cr >= 0) {
        const cards = r.cardRewards[cr].cards
        const rank = { rare: 0, uncommon: 1, common: 2, starter: 3, special: 4 }
        const best = [...cards].sort((a, b) => rank[CARD_BY_ID[a].rarity] - rank[CARD_BY_ID[b].rarity])[0]
        return { type: 'TAKE_CARD', rewardIndex: cr, cardId: best }
      }
      return { type: 'LEAVE_REWARD' }
    }
    case 'rest':
      if (run.restDone) return { type: 'LEAVE_ROOM' }
      if (run.hp < run.maxHp * 0.65 || !run.deck.some(canUpgrade)) return { type: 'REST' }
      return { type: 'START_PICK', purpose: 'upgrade', source: 'rest' }
    case 'shop': {
      const items = run.shop!.items
      const i = items.findIndex((it) => !it.sold && it.kind === 'relic' && it.price <= run.gold)
      if (i >= 0) return { type: 'BUY', index: i }
      const rm = items.find((it) => it.kind === 'remove')
      if (rm && !rm.sold && rm.price <= run.gold) return { type: 'START_PICK', purpose: 'remove', source: 'shop' }
      return { type: 'LEAVE_ROOM' }
    }
    case 'treasure':
      return run.treasureRelic ? { type: 'OPEN_TREASURE' } : { type: 'LEAVE_ROOM' }
    case 'event': {
      if (run.event!.resolved) return { type: 'LEAVE_ROOM' }
      const def = EVENT_BY_ID[run.event!.id]
      const i = def.choices.findIndex((c) => !c.requiresGold || c.requiresGold <= run.gold)
      return { type: 'EVENT_CHOICE', choice: Math.max(0, i) }
    }
    case 'actComplete':
      return { type: 'NEXT_ACT' }
    default:
      return null
  }
}

let wins = 0
const deaths: Record<string, number> = {}
const actReached = [0, 0, 0, 0]
let totalTurns = 0
let totalHpAtWin = 0
void POTION_BY_ID

for (let i = 0; i < runs; i++) {
  let run = newRun(`SIM${i}`, story)
  let guard = 0
  while (guard++ < 5000) {
    const action = step(run)
    if (!action) break
    const next = reduce(run, action)
    if (JSON.stringify(next) === JSON.stringify(run) && action.type !== 'END_TURN') {
      // Stuck: force progress.
      run = run.screen === 'combat' ? reduce(run, { type: 'END_TURN' }) : reduce(run, { type: 'LEAVE_ROOM' })
      continue
    }
    run = next
  }
  actReached[run.act] += 1
  totalTurns += run.stats.turns
  if (run.screen === 'victory') {
    wins++
    totalHpAtWin += run.hp
  } else {
    const where = run.combat ? `act${run.act} ${run.combat.encounterId}` : `act${run.act} ${run.screen}`
    deaths[where] = (deaths[where] ?? 0) + 1
  }
}

console.log(`${story ? 'STORY' : 'NORMAL'} — ${runs} runs`)
console.log(`Win rate: ${((wins / runs) * 100).toFixed(1)}%  (avg Morale at win: ${(totalHpAtWin / Math.max(1, wins)).toFixed(0)})`)
console.log(`Avg turns per run: ${(totalTurns / runs).toFixed(0)}`)
console.log('Final act reached:', actReached.slice(1).join(' / '))
console.log('Deaths:', Object.entries(deaths).sort((a, b) => b[1] - a[1]).slice(0, 10))
