import { describe, expect, it } from 'vitest'
import { ACTS } from '../../content/acts'
import { CARDS } from '../../content/cards'
import { ENEMIES, ENEMY_BY_ID } from '../../content/enemies'
import { EVENTS } from '../../content/events'
import { RELIC_BY_ID } from '../../content/relics'
import { attackDamage, describeCard, resolveCard } from '../cards'
import { startCombat } from '../combat'
import { generateMap } from '../map'
import { rngOf } from '../rng'
import { newRun, reduce } from '../run'
import type { RunState } from '../types'

function inCombat(enemies: string[], seed = 'TEST'): RunState {
  const run = reduce(newRun(seed), { type: 'CHOOSE_ONBOARDING', option: 'gold' })
  startCombat(run, 'test', enemies, 'normal')
  run.screen = 'combat'
  return run
}

describe('content integrity', () => {
  it('every encounter references a real enemy', () => {
    for (const act of ACTS) {
      for (const group of [...act.easy, ...act.hard, ...act.elites, act.boss.enemies]) {
        for (const id of group) expect(ENEMY_BY_ID[id], id).toBeDefined()
      }
    }
  })

  it('every enemy move picker returns a defined move', () => {
    for (const enemy of ENEMIES) {
      for (let turn = 1; turn <= 8; turn++) {
        for (const roll of [0, 0.3, 0.6, 0.99]) {
          const id = enemy.pickMove({ turn, history: [], hpRatio: 1, roll })
          expect(enemy.moves[id], `${enemy.id} turn ${turn}`).toBeDefined()
        }
      }
    }
  })

  it('every card has CV evidence and readable text', () => {
    for (const card of CARDS) {
      expect(card.cv.length, card.id).toBeGreaterThan(10)
      expect(describeCard(resolveCard(card.id, false)), card.id).not.toMatch(/undefined|NaN/)
      if (card.upgrade) expect(describeCard(resolveCard(card.id, true))).not.toMatch(/undefined|NaN/)
    }
  })

  it('events only reference real cards', () => {
    const ids = new Set(CARDS.map((c) => c.id))
    for (const event of EVENTS)
      for (const choice of event.choices)
        for (const effect of choice.effects) if (effect.kind === 'card' || effect.kind === 'curse') expect(ids.has(effect.cardId)).toBe(true)
  })

  it('the starter relic exists', () => {
    expect(RELIC_BY_ID.vscode).toBeDefined()
  })
})

describe('damage maths', () => {
  it('applies strength, weak and vulnerable in Slay the Spire order', () => {
    expect(attackDamage(6, {})).toBe(6)
    expect(attackDamage(6, { strength: 2 })).toBe(8)
    expect(attackDamage(8, { weak: 1 })).toBe(6)
    expect(attackDamage(6, {}, { vulnerable: 1 })).toBe(9)
    expect(attackDamage(6, { strength: 2, weak: 1 }, { vulnerable: 1 })).toBe(9)
  })
})

describe('combat', () => {
  it('starts with 5 cards and 3 Focus', () => {
    const run = inCombat(['console-error'])
    expect(run.combat!.hand).toHaveLength(5)
    expect(run.combat!.energy).toBe(3)
    expect(run.combat!.drawPile).toHaveLength(5)
  })

  it('playing Commit spends Focus and damages the enemy', () => {
    let run = inCombat(['jsp-scriptlet'])
    run.combat!.hand = [{ uid: 999, id: 'commit', upgraded: false }]
    const enemy = run.combat!.enemies[0]
    const before = enemy.hp
    run = reduce(run, { type: 'PLAY_CARD', uid: 999, target: enemy.uid })
    expect(run.combat!.energy).toBe(2)
    expect(run.combat!.enemies[0].hp).toBe(before - 6)
    expect(run.combat!.discardPile.map((c) => c.uid)).toContain(999)
  })

  it('Block absorbs enemy attacks and resets next turn', () => {
    let run = inCombat(['jsp-scriptlet'])
    run.combat!.enemies[0].moveId = 'bean' // 9 damage
    run.combat!.hand = [{ uid: 900, id: 'unit-test', upgraded: false }]
    run = reduce(run, { type: 'PLAY_CARD', uid: 900 })
    expect(run.combat!.player.block).toBe(5)
    const hp = run.combat!.player.hp
    run = reduce(run, { type: 'END_TURN' })
    expect(run.combat!.player.hp).toBe(hp - 4)
    expect(run.combat!.player.block).toBe(0)
    expect(run.combat!.turn).toBe(2)
  })

  it('debuffs applied by enemies last into the next enemy turn', () => {
    let run = inCombat(['wcag-gremlin'])
    run.combat!.enemies[0].moveId = 'heading' // Vulnerable 1
    run.combat!.hand = []
    run = reduce(run, { type: 'END_TURN' })
    expect(run.combat!.player.statuses.vulnerable).toBe(1)
    run.combat!.enemies[0].moveId = 'label' // 5 damage → 7 with vulnerable
    run.combat!.hand = []
    const hp = run.combat!.player.hp
    run = reduce(run, { type: 'END_TURN' })
    expect(run.combat!.player.hp).toBe(hp - 7)
    expect(run.combat!.player.statuses.vulnerable).toBeUndefined()
  })

  it('killing the last enemy wins and moves to rewards', () => {
    let run = inCombat(['console-error'])
    run.combat!.enemies[0].hp = 3
    run.combat!.hand = [{ uid: 901, id: 'commit', upgraded: false }]
    run = reduce(run, { type: 'PLAY_CARD', uid: 901, target: run.combat!.enemies[0].uid })
    expect(run.screen).toBe('reward')
    expect(run.reward!.cardRewards[0].cards).toHaveLength(3)
  })

  it('story mode never lets Morale drop below 1', () => {
    let run = reduce(newRun('STORY', true), { type: 'CHOOSE_ONBOARDING', option: 'gold' })
    startCombat(run, 'test', ['legacy-codebase'], 'boss')
    run.screen = 'combat'
    run.combat!.player.hp = 2
    run.combat!.enemies[0].moveId = 'conflict'
    run.combat!.hand = []
    run = reduce(run, { type: 'END_TURN' })
    expect(run.combat!.player.hp).toBe(1)
    expect(run.combat!.outcome).toBe('ongoing')
  })

  it('cards that cost more than your Focus cannot be played', () => {
    let run = inCombat(['console-error'])
    run.combat!.energy = 1
    run.combat!.hand = [{ uid: 902, id: 'd3-chart', upgraded: false }]
    run = reduce(run, { type: 'PLAY_CARD', uid: 902, target: run.combat!.enemies[0].uid })
    expect(run.combat!.hand).toHaveLength(1)
  })
})

describe('map', () => {
  it('has fixed first, middle and last floors and a boss', () => {
    for (const seed of ['A', 'B', 'C', 'D', 'E']) {
      const map = generateMap(rngOf({ rng: seed.charCodeAt(0) * 7919 }), 1)
      const nodes = Object.values(map.nodes)
      expect(nodes.filter((n) => n.floor === 0).every((n) => n.type === 'monster')).toBe(true)
      expect(nodes.filter((n) => n.floor === map.floors - 1).every((n) => n.type === 'rest')).toBe(true)
      expect(nodes.filter((n) => n.floor === Math.floor(map.floors / 2)).every((n) => n.type === 'treasure')).toBe(true)
      expect(map.nodes[map.bossId].type).toBe('boss')
      expect(nodes.some((n) => n.type === 'shop')).toBe(true)
    }
  })

  it('paths never cross', () => {
    for (let s = 1; s < 40; s++) {
      const map = generateMap(rngOf({ rng: s * 104729 }), 2)
      const edges = Object.values(map.nodes).flatMap((n) => n.next.map((t) => [n.floor, n.col, map.nodes[t].col] as const))
      for (const [f, a, b] of edges) {
        for (const [f2, c, d] of edges) {
          if (f !== f2) continue
          expect(a < c && b > d).toBe(false)
        }
      }
    }
  })

  it('every node can reach the boss', () => {
    const map = generateMap(rngOf({ rng: 42 }), 3)
    const reach = (id: string): boolean => id === map.bossId || map.nodes[id].next.some(reach)
    for (const id of map.starts) expect(reach(id)).toBe(true)
  })
})

describe('determinism', () => {
  it('the same seed and actions produce the same run', () => {
    const play = () => {
      let run = reduce(newRun('SAME'), { type: 'CHOOSE_ONBOARDING', option: 'relic' })
      run = reduce(run, { type: 'CHOOSE_NODE', nodeId: run.map.starts[0] })
      for (let i = 0; i < 3; i++) run = reduce(run, { type: 'END_TURN' })
      return run
    }
    expect(JSON.stringify(play())).toBe(JSON.stringify(play()))
  })
})

describe('run flow', () => {
  it('onboarding diploma raises Max Morale', () => {
    const run = reduce(newRun('X'), { type: 'CHOOSE_ONBOARDING', option: 'diploma' })
    expect(run.maxHp).toBe(70)
    expect(run.relics).toContain('ptit-diploma')
    expect(run.screen).toBe('map')
  })

  it('cannot jump to an unreachable node', () => {
    const run = reduce(newRun('X'), { type: 'CHOOSE_ONBOARDING', option: 'gold' })
    const after = reduce(run, { type: 'CHOOSE_NODE', nodeId: 'boss' })
    expect(after.screen).toBe('map')
  })

  it('rest heals 30% and can only be used once', () => {
    let run = reduce(newRun('X'), { type: 'CHOOSE_ONBOARDING', option: 'gold' })
    run.screen = 'rest'
    run.hp = 20
    run = reduce(run, { type: 'REST' })
    expect(run.hp).toBe(38)
    run = reduce(run, { type: 'REST' })
    expect(run.hp).toBe(38)
  })
})
