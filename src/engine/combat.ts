// Combat rules. Functions here mutate a draft RunState (the reducer clones
// state first), which keeps the rules short and readable.

import { CARD_BY_ID } from '../content/cards'
import { ENEMY_BY_ID } from '../content/enemies'
import { POTION_BY_ID } from '../content/potions'
import { attackDamage, cardBlock, resolveInstance } from './cards'
import { rngOf } from './rng'
import { STATUS_INFO } from './statuses'
import type { CardInstance, CombatState, Combatant, Effect, EnemyState, RunState, StatusId } from './types'

export const HAND_LIMIT = 10
export const BASE_DRAW = 5
export const BASE_ENERGY = 3

const has = (run: RunState, relic: string) => run.relics.includes(relic)

function log(c: CombatState, line: string) {
  c.log.push(line)
  if (c.log.length > 40) c.log.splice(0, c.log.length - 40)
}

export const aliveEnemies = (c: CombatState) => c.enemies.filter((e) => e.hp > 0)

function addStatus(c: CombatState, who: Combatant, target: 'player' | number, status: StatusId, amount: number) {
  who.statuses[status] = (who.statuses[status] ?? 0) + amount
  if (who.statuses[status] === 0) delete who.statuses[status]
  c.fx.push({ type: 'status', target, status, amount })
}

function gainBlock(c: CombatState, who: Combatant, target: 'player' | number, amount: number) {
  if (amount <= 0) return
  who.block += amount
  c.fx.push({ type: 'block', target, amount })
}

// ---------- Drawing ----------

export function drawCards(run: RunState, n: number) {
  const c = run.combat!
  const rng = rngOf(run)
  for (let i = 0; i < n; i++) {
    if (c.drawPile.length === 0) {
      if (c.discardPile.length === 0) return
      c.drawPile = rng.shuffle(c.discardPile)
      c.discardPile = []
    }
    const card = c.drawPile.pop()!
    if (c.hand.length >= HAND_LIMIT) c.discardPile.push(card)
    else c.hand.push(card)
  }
}

// ---------- Damage ----------

/** Damage to the player. `attack` damage is reduced by Block first. */
export function damagePlayer(run: RunState, amount: number, attack: boolean) {
  const c = run.combat!
  const p = c.player
  let blocked = 0
  if (attack) {
    blocked = Math.min(p.block, amount)
    p.block -= blocked
  }
  let loss = amount - blocked
  if (loss > 0 && (p.statuses.buffer ?? 0) > 0) {
    addStatus(c, p, 'player', 'buffer', -1)
    log(c, 'Buffer prevented the damage.')
    loss = 0
  }
  if (run.storyMode) loss = Math.min(loss, p.hp - 1)
  p.hp = Math.max(0, p.hp - Math.max(0, loss))
  c.fx.push({ type: 'damage', target: 'player', amount: Math.max(0, loss), blocked })
  if (p.hp <= 0) c.outcome = 'lost'
}

export function damageEnemy(run: RunState, enemy: EnemyState, amount: number, opts: { pierce?: boolean; attack?: boolean } = {}) {
  const c = run.combat!
  if (enemy.hp <= 0) return
  const blocked = opts.pierce ? 0 : Math.min(enemy.block, amount)
  enemy.block -= blocked
  const loss = Math.min(enemy.hp, amount - blocked)
  enemy.hp -= loss
  run.stats.damageDealt += loss
  c.fx.push({ type: 'damage', target: enemy.uid, amount: loss, blocked })
  if (opts.attack && (enemy.statuses.thorns ?? 0) > 0) {
    damagePlayer(run, enemy.statuses.thorns!, false)
  }
  if (enemy.hp <= 0) {
    enemy.hp = 0
    enemy.block = 0
    c.fx.push({ type: 'death', target: enemy.uid })
    run.stats.enemiesSlain.push(enemy.defId)
    log(c, `${ENEMY_BY_ID[enemy.defId].name} is defeated.`)
    if (aliveEnemies(c).length === 0 && c.outcome === 'ongoing') c.outcome = 'won'
  }
}

// ---------- Effects (cards and potions) ----------

export function resolveEffects(run: RunState, effects: Effect[], targetUid: number | undefined, fromCard: boolean) {
  const c = run.combat!
  const p = c.player
  const rng = rngOf(run)
  const target = () => c.enemies.find((e) => e.uid === targetUid && e.hp > 0) ?? aliveEnemies(c)[0]

  for (const effect of effects) {
    if (c.outcome !== 'ongoing') return
    switch (effect.kind) {
      case 'damage': {
        const times = effect.times ?? 1
        for (let i = 0; i < times; i++) {
          if (c.outcome !== 'ongoing') break
          const targets =
            effect.target === 'all' ? aliveEnemies(c) : effect.target === 'random' ? [rng.pick(aliveEnemies(c))] : [target()]
          for (const t of targets) {
            if (!t) continue
            const dmg = fromCard ? attackDamage(effect.amount, p.statuses, t.statuses) : effect.amount
            damageEnemy(run, t, dmg, { pierce: effect.pierce, attack: fromCard })
          }
        }
        break
      }
      case 'damageFromBlock': {
        const t = target()
        if (t) damageEnemy(run, t, attackDamage(p.block, p.statuses, t.statuses), { attack: true })
        break
      }
      case 'block':
        gainBlock(c, p, 'player', fromCard ? cardBlock(effect.amount, p.statuses) : effect.amount)
        break
      case 'doubleBlock':
        gainBlock(c, p, 'player', p.block)
        break
      case 'draw':
        drawCards(run, effect.amount)
        break
      case 'energy':
        c.energy += effect.amount
        break
      case 'heal': {
        const healed = Math.min(effect.amount, p.maxHp - p.hp)
        p.hp += healed
        if (healed > 0) c.fx.push({ type: 'heal', target: 'player', amount: healed })
        break
      }
      case 'loseHp':
        damagePlayer(run, effect.amount, false)
        break
      case 'status': {
        if (effect.target === 'self') addStatus(c, p, 'player', effect.status, effect.amount)
        else {
          const targets = effect.target === 'all' ? aliveEnemies(c) : [target()].filter(Boolean)
          for (const t of targets) addStatus(c, t!, t!.uid, effect.status, effect.amount)
        }
        break
      }
      case 'upgradeHand':
        for (const card of c.hand) {
          if (!card.upgraded && CARD_BY_ID[card.id].upgrade && !c.tempUpgrades.includes(card.uid)) c.tempUpgrades.push(card.uid)
        }
        break
      case 'exhaustStatusCardsDraw': {
        const junk = c.hand.filter((card) => ['status', 'curse'].includes(CARD_BY_ID[card.id].type))
        c.hand = c.hand.filter((card) => !junk.includes(card))
        c.exhaustPile.push(...junk)
        drawCards(run, junk.length)
        break
      }
    }
  }
}

// ---------- Enemies ----------

function chooseEnemyMove(run: RunState, enemy: EnemyState, turn: number) {
  const def = ENEMY_BY_ID[enemy.defId]
  const roll = rngOf(run).next()
  enemy.moveId = def.pickMove({ turn, history: enemy.history, hpRatio: enemy.hp / enemy.maxHp, roll })
}

function newUid(run: RunState) {
  return run.nextUid++
}

function enemyTakeTurn(run: RunState, enemy: EnemyState) {
  const c = run.combat!
  const def = ENEMY_BY_ID[enemy.defId]
  const move = enemy.moveId ? def.moves[enemy.moveId] : undefined
  if (!move) return
  enemy.block = 0
  log(c, `${def.name} uses ${move.name}.`)
  for (const action of move.actions) {
    if (c.outcome !== 'ongoing' || enemy.hp <= 0) break
    switch (action.kind) {
      case 'attack': {
        const times = action.times ?? 1
        for (let i = 0; i < times && c.outcome === 'ongoing'; i++) {
          damagePlayer(run, attackDamage(action.amount, enemy.statuses, c.player.statuses), true)
        }
        break
      }
      case 'block':
        gainBlock(c, enemy, enemy.uid, action.amount)
        break
      case 'blockAll':
        for (const e of aliveEnemies(c)) gainBlock(c, e, e.uid, action.amount)
        break
      case 'buff':
        addStatus(c, enemy, enemy.uid, action.status, action.amount)
        break
      case 'buffAll':
        for (const e of aliveEnemies(c)) addStatus(c, e, e.uid, action.status, action.amount)
        break
      case 'debuff':
        addStatus(c, c.player, 'player', action.status, action.amount)
        break
      case 'heal': {
        const healed = Math.min(action.amount, enemy.maxHp - enemy.hp)
        enemy.hp += healed
        if (healed > 0) c.fx.push({ type: 'heal', target: enemy.uid, amount: healed })
        break
      }
      case 'addCards': {
        const rng = rngOf(run)
        for (let i = 0; i < action.count; i++) {
          const card: CardInstance = { uid: newUid(run), id: action.cardId, upgraded: false }
          if (action.pile === 'discard') c.discardPile.push(card)
          else c.drawPile.splice(rng.int(0, c.drawPile.length), 0, card)
        }
        log(c, `${action.count} ${CARD_BY_ID[action.cardId].name} added to your ${action.pile} pile.`)
        break
      }
    }
  }
  enemy.history.push(enemy.moveId!)
}

/** Turn-based statuses tick down by 1. `only` limits which ones tick. */
function decayStatuses(who: Combatant, only?: StatusId[]) {
  for (const key of Object.keys(who.statuses) as StatusId[]) {
    if (only && !only.includes(key)) continue
    if (STATUS_INFO[key].decays && who.statuses[key]) {
      who.statuses[key]! -= 1
      if (who.statuses[key]! <= 0) delete who.statuses[key]
    }
  }
}

// ---------- Turn flow ----------

function startPlayerTurn(run: RunState) {
  const c = run.combat!
  c.turn += 1
  run.stats.turns += 1
  c.cardsPlayedThisTurn = 0
  c.player.block = 0
  c.energy = BASE_ENERGY + (has(run, 'merged-prs') ? 1 : 0)
  if (c.turn === 1 && has(run, 'psm-1')) c.energy += 1
  if (c.turn === 3 && has(run, 'agile-badge')) c.energy += 2

  const s = c.player.statuses
  if (s.ssr) gainBlock(c, c.player, 'player', s.ssr)
  if (s.growth) addStatus(c, c.player, 'player', 'strength', s.growth)

  let draw = BASE_DRAW + (s.pairProgrammer ?? 0) + (has(run, 'top-committer') ? 1 : 0)
  if (c.turn === 1 && has(run, 'aws-cloud-quest')) draw += 2
  drawCards(run, draw)
}

export function startCombat(run: RunState, encounterId: string, enemyIds: string[], tier: CombatState['tier']) {
  const rng = rngOf(run)
  const enemies: EnemyState[] = enemyIds.map((id) => {
    const def = ENEMY_BY_ID[id]
    let hp = rng.int(def.hp[0], def.hp[1])
    if (run.storyMode && tier === 'boss') hp = Math.ceil(hp * 0.5)
    return {
      uid: newUid(run),
      defId: id,
      hp,
      maxHp: hp,
      block: 0,
      statuses: { ...(def.startStatuses ?? {}) },
      moveId: null,
      history: [],
    }
  })
  const deck = run.deck.map((card) => ({ ...card }))
  run.combat = {
    encounterId,
    tier,
    turn: 0,
    energy: 0,
    maxEnergy: BASE_ENERGY + (has(run, 'merged-prs') ? 1 : 0),
    player: { hp: run.hp, maxHp: run.maxHp, block: 0, statuses: {} },
    enemies,
    drawPile: rng.shuffle(deck),
    hand: [],
    discardPile: [],
    exhaustPile: [],
    tempUpgrades: [],
    attacksPlayed: 0,
    cardsPlayedThisTurn: 0,
    log: [`Encounter: ${enemyIds.map((id) => ENEMY_BY_ID[id].name).join(', ')}.`],
    fx: [],
    outcome: 'ongoing',
  }
  const c = run.combat
  // Start-of-combat relics
  if (has(run, 'aws-ccp')) gainBlock(c, c.player, 'player', 8)
  if (has(run, 'rtl-56')) {
    gainBlock(c, c.player, 'player', 12)
    addStatus(c, c.player, 'player', 'dexterity', 2)
  }
  if (has(run, 'google-educator-2')) addStatus(c, c.player, 'player', 'dexterity', 1)
  if (has(run, 'gemini-educator')) addStatus(c, c.player, 'player', 'strength', 1)
  if (has(run, 'gitleaks')) addStatus(c, c.player, 'player', 'buffer', 1)
  for (const e of enemies) {
    if (has(run, 'lighthouse-script')) addStatus(c, e, e.uid, 'vulnerable', 1)
    if (has(run, 'optimizely-graph')) {
      addStatus(c, e, e.uid, 'vulnerable', 2)
      addStatus(c, e, e.uid, 'weak', 1)
    }
    chooseEnemyMove(run, e, 1)
  }
  // Block from relics persists through the first turn.
  const startBlock = c.player.block
  startPlayerTurn(run)
  c.player.block += startBlock
}

export function playCard(run: RunState, uid: number, targetUid?: number): boolean {
  const c = run.combat
  if (!c || c.outcome !== 'ongoing') return false
  const idx = c.hand.findIndex((card) => card.uid === uid)
  if (idx < 0) return false
  const card = c.hand[idx]
  const resolved = resolveInstance(card, c.tempUpgrades)
  if (resolved.def.unplayable || resolved.cost > c.energy) return false
  if (resolved.def.target === 'enemy') {
    const t = c.enemies.find((e) => e.uid === targetUid && e.hp > 0)
    if (!t) {
      if (aliveEnemies(c).length !== 1) return false
      targetUid = aliveEnemies(c)[0].uid
    }
  }
  c.energy -= resolved.cost
  c.hand.splice(idx, 1)
  c.cardsPlayedThisTurn += 1
  run.stats.cardsPlayed += 1
  c.fx.push({ type: 'play', cardId: card.id })
  log(c, `You play ${resolved.name}.`)

  resolveEffects(run, resolved.effects, targetUid, true)

  if (resolved.def.type === 'attack') {
    c.attacksPlayed += 1
    const fed = c.player.statuses.federation
    if (fed && c.outcome === 'ongoing') for (const e of aliveEnemies(c)) damageEnemy(run, e, fed)
  }

  if (resolved.def.type === 'power') {
    // Powers leave play once their effect is active.
  } else if (resolved.exhaust) c.exhaustPile.push(card)
  else c.discardPile.push(card)
  return true
}

export function drinkPotion(run: RunState, slot: number, targetUid?: number): boolean {
  const c = run.combat
  const id = run.potions[slot]
  if (!c || c.outcome !== 'ongoing' || !id) return false
  const potion = POTION_BY_ID[id]
  if (potion.target === 'enemy' && !c.enemies.some((e) => e.uid === targetUid && e.hp > 0)) {
    if (aliveEnemies(c).length !== 1) return false
    targetUid = aliveEnemies(c)[0].uid
  }
  run.potions[slot] = null
  log(c, `You use ${potion.name}.`)
  resolveEffects(run, potion.effects, targetUid, false)
  if (has(run, 'ai-k12')) resolveEffects(run, [{ kind: 'heal', amount: 5 }], undefined, false)
  return true
}

export function endTurn(run: RunState) {
  const c = run.combat
  if (!c || c.outcome !== 'ongoing') return
  // End of player turn
  for (const card of c.hand) {
    const burn = CARD_BY_ID[card.id].burnAtEndOfTurn
    if (burn && c.outcome === 'ongoing') {
      log(c, `${CARD_BY_ID[card.id].name} burns you for ${burn}.`)
      damagePlayer(run, burn, false)
    }
  }
  const pipe = c.player.statuses.pipeline
  if (pipe) for (const e of aliveEnemies(c)) damageEnemy(run, e, pipe)
  c.discardPile.push(...c.hand)
  c.hand = []
  if (c.outcome !== 'ongoing') return
  // Player debuffs tick at the end of the round, but debuffs the enemies
  // apply this turn must survive until the next round.
  const playerDebuffs = (Object.keys(c.player.statuses) as StatusId[]).filter((k) => STATUS_INFO[k].decays)

  // Enemy turn
  c.fx.push({ type: 'enemyTurn' })
  for (const e of c.enemies) {
    if (e.hp <= 0 || c.outcome !== 'ongoing') continue
    enemyTakeTurn(run, e)
  }
  for (const e of aliveEnemies(c)) {
    if (e.statuses.ritual) addStatus(c, e, e.uid, 'strength', e.statuses.ritual)
    decayStatuses(e)
  }
  if (c.outcome !== 'ongoing') return
  decayStatuses(c.player, playerDebuffs)
  for (const e of aliveEnemies(c)) chooseEnemyMove(run, e, c.turn + 1)
  startPlayerTurn(run)
}

/** The damage an enemy's intent will deal, for display. */
export function intentDamage(c: CombatState, enemy: EnemyState): { amount: number; times: number } | null {
  const move = enemy.moveId ? ENEMY_BY_ID[enemy.defId].moves[enemy.moveId] : undefined
  const attack = move?.actions.find((a) => a.kind === 'attack')
  if (!attack || attack.kind !== 'attack') return null
  return { amount: attackDamage(attack.amount, enemy.statuses, c.player.statuses), times: attack.times ?? 1 }
}
