// The run reducer: (state, action) → new state. It clones the state, applies
// the action to the draft, and returns it, so the store and the simulator
// share exactly the same rules.

import { ACTS } from '../content/acts'
import { CARD_BY_ID, REWARD_POOL, STARTER_DECK } from '../content/cards'
import { EVENTS, EVENT_BY_ID, type EventEffect } from '../content/events'
import { POTIONS } from '../content/potions'
import { RELICS } from '../content/relics'
import { canUpgrade } from './cards'
import { endTurn, playCard, startCombat, drinkPotion } from './combat'
import { generateMap, reachableNodes } from './map'
import { hashSeed, rngOf, type Rng } from './rng'
import type { Action, CardInstance, Rarity, RewardState, RunState, ShopItem } from './types'

export { SAVE_VERSION } from './version'
import { SAVE_VERSION } from './version'
export const POTION_SLOTS = 3
export const REMOVE_PRICE = 75

export function newRun(seed: string, storyMode = false): RunState {
  const run: RunState = {
    version: SAVE_VERSION,
    seed,
    rng: hashSeed(seed),
    storyMode,
    hp: 60,
    maxHp: 60,
    gold: 99,
    deck: [],
    relics: ['vscode'],
    potions: [null, null, null],
    act: 1,
    map: { act: 1, nodes: {}, starts: [], bossId: 'boss', floors: 0 },
    currentNode: null,
    visited: [],
    screen: 'onboarding',
    combat: null,
    reward: null,
    shop: null,
    event: null,
    pick: null,
    treasureRelic: null,
    seenRelics: ['vscode'],
    seenEvents: [],
    nextUid: 1,
    stats: {
      floorsClimbed: 0,
      enemiesSlain: [],
      elitesSlain: 0,
      bossesSlain: 0,
      damageDealt: 0,
      cardsPlayed: 0,
      turns: 0,
      goldEarned: 0,
    },
    restDone: false,
    fightsThisAct: 0,
    lastEncounter: null,
    lastMessage: null,
  }
  run.deck = STARTER_DECK.map((id) => ({ uid: run.nextUid++, id, upgraded: false }))
  run.map = generateMap(rngOf(run), 1)
  return run
}

// ---------- Helpers ----------

const addCard = (run: RunState, id: string, upgraded = false) => {
  const card: CardInstance = { uid: run.nextUid++, id, upgraded }
  run.deck.push(card)
  return card
}

function gainRelic(run: RunState, id: string) {
  if (run.relics.includes(id)) return
  run.relics.push(id)
  if (!run.seenRelics.includes(id)) run.seenRelics.push(id)
  if (id === 'ptit-diploma') {
    run.maxHp += 10
    run.hp += 10
  }
  if (id === 'google-educator-1') {
    run.maxHp += 7
    run.hp = Math.min(run.maxHp, run.hp + 7)
  }
}

function randomRelic(run: RunState, rng: Rng, tier: 'common' | 'boss' = 'common'): string | null {
  const pool = RELICS.filter((r) => r.tier === tier && !run.relics.includes(r.id) && !run.seenRelics.includes(r.id))
  if (!pool.length) return null
  const id = rng.pick(pool).id
  run.seenRelics.push(id)
  return id
}

function rollRarity(rng: Rng, tier: 'normal' | 'elite' | 'boss' | 'shop'): Rarity {
  if (tier === 'boss') return 'rare'
  const weights =
    tier === 'elite' ? { common: 50, uncommon: 38, rare: 12 } : tier === 'shop' ? { common: 45, uncommon: 40, rare: 15 } : { common: 60, uncommon: 33, rare: 7 }
  return rng.weighted<Rarity>(weights)
}

function randomCards(rng: Rng, count: number, tier: 'normal' | 'elite' | 'boss' | 'shop'): string[] {
  const chosen: string[] = []
  let guard = 0
  while (chosen.length < count && guard++ < 200) {
    const rarity = rollRarity(rng, tier)
    const pool = REWARD_POOL.filter((c) => c.rarity === rarity && !chosen.includes(c.id))
    if (pool.length) chosen.push(rng.pick(pool).id)
  }
  return chosen
}

const freePotionSlot = (run: RunState) => run.potions.findIndex((p) => p === null)

function healRun(run: RunState, amount: number) {
  run.hp = Math.min(run.maxHp, run.hp + amount)
}

function upgradeRandom(run: RunState, rng: Rng, count: number) {
  const candidates = rng.shuffle(run.deck.filter(canUpgrade))
  for (const card of candidates.slice(0, count)) card.upgraded = true
}

// ---------- Rooms ----------

function enterNode(run: RunState, nodeId: string) {
  const node = run.map.nodes[nodeId]
  const act = ACTS[run.act - 1]
  const rng = rngOf(run)
  run.currentNode = nodeId
  run.visited.push(nodeId)
  run.stats.floorsClimbed += 1
  run.lastMessage = null

  switch (node.type) {
    case 'monster': {
      const pool = run.fightsThisAct < 2 ? act.easy : act.hard
      let idx = rng.int(0, pool.length - 1)
      const key = (i: number) => `${run.act}:${run.fightsThisAct < 2 ? 'e' : 'h'}${i}`
      if (key(idx) === run.lastEncounter && pool.length > 1) idx = (idx + 1) % pool.length
      run.lastEncounter = key(idx)
      run.fightsThisAct += 1
      startCombat(run, key(idx), pool[idx], 'normal')
      run.screen = 'combat'
      break
    }
    case 'elite': {
      const idx = rng.int(0, act.elites.length - 1)
      startCombat(run, `${run.act}:elite${idx}`, act.elites[idx], 'elite')
      run.screen = 'combat'
      break
    }
    case 'boss':
      startCombat(run, act.boss.id, act.boss.enemies, 'boss')
      run.screen = 'combat'
      break
    case 'rest':
      run.restDone = false
      run.screen = 'rest'
      break
    case 'shop':
      run.shop = makeShop(run, rng)
      run.screen = 'shop'
      break
    case 'treasure':
      run.treasureRelic = randomRelic(run, rng)
      run.screen = 'treasure'
      break
    case 'event': {
      const fits = EVENTS.filter((e) => e.acts.includes(run.act))
      const fresh = fits.filter((e) => !run.seenEvents.includes(e.id))
      const event = rng.pick(fresh.length ? fresh : fits)
      run.seenEvents.push(event.id)
      run.event = { id: event.id, resolved: null }
      run.screen = 'event'
      break
    }
  }
}

function makeShop(run: RunState, rng: Rng) {
  const discount = run.relics.includes('key-vault') ? 0.8 : 1
  const price = (base: number) => Math.round(rng.int(Math.round(base * 0.9), Math.round(base * 1.1)) * discount)
  const cardPrice: Record<string, number> = { common: 50, uncommon: 75, rare: 150 }
  const items: ShopItem[] = [
    ...randomCards(rng, 5, 'shop').map((id) => ({ kind: 'card' as const, id, price: price(cardPrice[CARD_BY_ID[id].rarity]), sold: false })),
    ...[randomRelic(run, rng), randomRelic(run, rng)]
      .filter((id): id is string => Boolean(id))
      .map((id) => ({ kind: 'relic' as const, id, price: price(150), sold: false })),
    ...rng
      .shuffle([...POTIONS])
      .slice(0, 2)
      .map((p) => ({ kind: 'potion' as const, id: p.id, price: price(50), sold: false })),
    { kind: 'remove', id: 'remove', price: Math.round(REMOVE_PRICE * discount), sold: false },
  ]
  return { items }
}

function makeReward(run: RunState, rng: Rng): RewardState {
  const tier = run.combat!.tier
  const choices = 3 + (run.relics.includes('llms-txt') ? 1 : 0)
  const gold = tier === 'boss' ? rng.int(60, 80) : tier === 'elite' ? rng.int(25, 35) : rng.int(12, 20)
  const bonus = tier !== 'normal' && run.relics.includes('app-insights') ? 15 : 0
  let relic: string | null = null
  if (tier === 'elite') relic = randomRelic(run, rng)
  if (tier === 'boss' && run.act === 1 && !run.relics.includes('psm-1')) relic = 'psm-1'
  const bossRelics = tier === 'boss' ? [randomRelic(run, rng, 'boss'), randomRelic(run, rng, 'boss'), randomRelic(run, rng, 'boss')].filter((r): r is string => Boolean(r)) : null
  return {
    gold: gold + bonus,
    goldTaken: false,
    potion: rng.chance(tier === 'normal' ? 0.4 : 0.6) ? rng.pick(POTIONS).id : null,
    relic,
    cardRewards: [{ cards: randomCards(rng, choices, tier), taken: false }],
    bossRelics: bossRelics && bossRelics.length ? bossRelics : null,
  }
}

function finishCombat(run: RunState) {
  const c = run.combat!
  const rng = rngOf(run)
  if (c.outcome === 'lost') {
    run.hp = 0
    run.screen = 'defeat'
    return
  }
  run.hp = c.player.hp
  if (run.relics.includes('vscode')) healRun(run, 6)
  if (c.tier === 'elite') run.stats.elitesSlain += 1
  if (c.tier === 'boss') run.stats.bossesSlain += 1
  if (c.tier === 'boss' && run.act === ACTS.length) {
    run.screen = 'victory'
    return
  }
  run.reward = makeReward(run, rng)
  run.screen = 'reward'
}

function applyEventEffects(run: RunState, effects: EventEffect[], rng: Rng) {
  for (const e of effects) {
    switch (e.kind) {
      case 'hp':
        if (e.amount >= 0) healRun(run, e.amount)
        else run.hp = Math.max(1, run.hp + e.amount)
        break
      case 'maxHp':
        run.maxHp += e.amount
        run.hp += e.amount
        break
      case 'gold':
        run.gold = Math.max(0, run.gold + e.amount)
        if (e.amount > 0) run.stats.goldEarned += e.amount
        break
      case 'card':
        addCard(run, e.cardId)
        break
      case 'randomCard': {
        const pool = REWARD_POOL.filter((c) => c.rarity === e.rarity)
        addCard(run, rng.pick(pool).id)
        break
      }
      case 'randomRelic': {
        const id = randomRelic(run, rng)
        if (id) gainRelic(run, id)
        else {
          run.gold += 50
        }
        break
      }
      case 'potions':
        for (let i = 0; i < run.potions.length; i++) if (!run.potions[i]) run.potions[i] = rng.pick(POTIONS).id
        break
      case 'upgradeRandom':
        upgradeRandom(run, rng, e.count)
        break
      case 'pickUpgrade':
        if (run.deck.some(canUpgrade)) run.pick = { purpose: 'upgrade', returnTo: run.screen, source: 'event' }
        break
      case 'pickRemove':
        run.pick = { purpose: 'remove', returnTo: run.screen, source: 'event' }
        break
      case 'curse':
        addCard(run, e.cardId)
        break
    }
  }
}

// ---------- Reducer ----------

export function reduce(state: RunState, action: Action): RunState {
  const run = structuredClone(state)
  if (run.combat) run.combat.fx = []
  apply(run, action)
  return run
}

function apply(run: RunState, action: Action) {
  const rng = rngOf(run)
  switch (action.type) {
    case 'CHOOSE_ONBOARDING': {
      if (run.screen !== 'onboarding') return
      run.screen = 'map'
      if (action.option === 'diploma') gainRelic(run, 'ptit-diploma')
      if (action.option === 'relic') {
        const id = randomRelic(run, rng)
        if (id) gainRelic(run, id)
      }
      if (action.option === 'gold') {
        run.gold += 100
        run.stats.goldEarned += 100
      }
      if (action.option === 'remove') run.pick = { purpose: 'remove', returnTo: 'map', source: 'onboarding' }
      return
    }
    case 'CHOOSE_NODE': {
      if (run.screen !== 'map' || run.pick) return
      if (!reachableNodes(run.map, run.currentNode).includes(action.nodeId)) return
      enterNode(run, action.nodeId)
      return
    }
    case 'PLAY_CARD': {
      if (run.screen !== 'combat') return
      if (playCard(run, action.uid, action.target) && run.combat!.outcome !== 'ongoing') finishCombat(run)
      return
    }
    case 'END_TURN': {
      if (run.screen !== 'combat') return
      endTurn(run)
      if (run.combat!.outcome !== 'ongoing') finishCombat(run)
      return
    }
    case 'USE_POTION': {
      if (run.screen === 'combat') {
        if (drinkPotion(run, action.slot, action.target) && run.combat!.outcome !== 'ongoing') finishCombat(run)
      } else if (run.potions[action.slot] === 'ollama') {
        run.potions[action.slot] = null
        healRun(run, 15)
      }
      return
    }
    case 'DISCARD_POTION':
      run.potions[action.slot] = null
      return
    case 'TAKE_GOLD': {
      const r = run.reward
      if (!r || r.goldTaken) return
      r.goldTaken = true
      run.gold += r.gold
      run.stats.goldEarned += r.gold
      return
    }
    case 'TAKE_POTION': {
      const r = run.reward
      const slot = freePotionSlot(run)
      if (!r?.potion || slot < 0) return
      run.potions[slot] = r.potion
      r.potion = null
      return
    }
    case 'TAKE_RELIC': {
      const r = run.reward
      if (!r?.relic) return
      gainRelic(run, r.relic)
      r.relic = null
      return
    }
    case 'TAKE_CARD': {
      const reward = run.reward?.cardRewards[action.rewardIndex]
      if (!reward || reward.taken || !reward.cards.includes(action.cardId)) return
      reward.taken = true
      addCard(run, action.cardId)
      return
    }
    case 'SKIP_CARD': {
      const reward = run.reward?.cardRewards[action.rewardIndex]
      if (reward) reward.taken = true
      return
    }
    case 'TAKE_BOSS_RELIC': {
      const r = run.reward
      if (!r?.bossRelics?.includes(action.relicId)) return
      gainRelic(run, action.relicId)
      r.bossRelics = null
      return
    }
    case 'LEAVE_REWARD': {
      if (run.screen !== 'reward') return
      // Don't let anyone lose Commits or a relic (a certification!) by
      // leaving early. Cards, potions and boss relics stay optional.
      const r = run.reward
      if (r && !r.goldTaken) {
        r.goldTaken = true
        run.gold += r.gold
        run.stats.goldEarned += r.gold
      }
      if (r?.relic) gainRelic(run, r.relic)
      const wasBoss = run.combat?.tier === 'boss'
      run.reward = null
      run.combat = null
      run.screen = wasBoss ? 'actComplete' : 'map'
      return
    }
    case 'NEXT_ACT': {
      if (run.screen !== 'actComplete') return
      run.act += 1
      run.hp = run.maxHp
      run.map = generateMap(rng, run.act)
      run.currentNode = null
      run.visited = []
      run.fightsThisAct = 0
      run.lastEncounter = null
      run.screen = 'map'
      return
    }
    case 'REST': {
      if (run.screen !== 'rest' || run.restDone) return
      healRun(run, Math.round(run.maxHp * 0.3))
      run.restDone = true
      return
    }
    case 'START_PICK': {
      if (action.source === 'rest' && (run.screen !== 'rest' || run.restDone)) return
      if (action.source === 'shop') {
        const item = run.shop?.items.find((i) => i.kind === 'remove')
        if (!item || item.sold || run.gold < item.price) return
      }
      run.pick = { purpose: action.purpose, returnTo: run.screen, source: action.source }
      return
    }
    case 'PICK_CARD': {
      const pick = run.pick
      if (!pick) return
      const idx = run.deck.findIndex((c) => c.uid === action.uid)
      if (idx < 0) return
      if (pick.purpose === 'upgrade') {
        if (!canUpgrade(run.deck[idx])) return
        run.deck[idx].upgraded = true
      } else {
        run.deck.splice(idx, 1)
      }
      if (pick.source === 'rest') run.restDone = true
      if (pick.source === 'shop') {
        const item = run.shop!.items.find((i) => i.kind === 'remove')!
        run.gold -= item.price
        item.sold = true
      }
      run.pick = null
      return
    }
    case 'CANCEL_PICK':
      run.pick = null
      return
    case 'LEAVE_ROOM': {
      if (!['rest', 'shop', 'treasure', 'event'].includes(run.screen) || run.pick) return
      if (run.screen === 'event' && !run.event?.resolved) return
      run.shop = null
      run.event = null
      run.treasureRelic = null
      run.screen = 'map'
      return
    }
    case 'BUY': {
      const item = run.shop?.items[action.index]
      if (!item || item.sold || item.kind === 'remove' || run.gold < item.price) return
      if (item.kind === 'potion') {
        const slot = freePotionSlot(run)
        if (slot < 0) return
        run.potions[slot] = item.id
      }
      if (item.kind === 'card') addCard(run, item.id)
      if (item.kind === 'relic') gainRelic(run, item.id)
      run.gold -= item.price
      item.sold = true
      return
    }
    case 'OPEN_TREASURE': {
      if (run.screen !== 'treasure') return
      if (run.treasureRelic) gainRelic(run, run.treasureRelic)
      else run.gold += 50
      run.treasureRelic = null
      run.lastMessage = 'opened'
      return
    }
    case 'EVENT_CHOICE': {
      if (run.screen !== 'event' || !run.event || run.event.resolved) return
      const def = EVENT_BY_ID[run.event.id]
      const choice = def.choices[action.choice]
      if (!choice || (choice.requiresGold && run.gold < choice.requiresGold)) return
      run.event.resolved = choice.result
      applyEventEffects(run, choice.effects, rng)
      return
    }
  }
}

/** Cards a pick overlay may show. */
export function pickableCards(run: RunState): CardInstance[] {
  if (!run.pick) return []
  return run.pick.purpose === 'upgrade' ? run.deck.filter(canUpgrade) : run.deck
}
