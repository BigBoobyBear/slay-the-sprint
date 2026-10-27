// Map generation in the style of Slay the Spire: a 7-column grid, up to 6
// paths walked bottom-to-top that never cross, then room types assigned with
// a few rules (fixed first/middle/last floors, no back-to-back specials).

import type { Rng } from './rng'
import type { ActMap, MapNode, NodeType } from './types'

export const FLOORS_PER_ACT = 7
export const COLS = 7
const PATHS = 6

const SPECIAL: NodeType[] = ['elite', 'rest', 'shop']

export function generateMap(rng: Rng, act: number, floors = FLOORS_PER_ACT): ActMap {
  const id = (f: number, c: number) => `${f}-${c}`
  const edges = new Set<string>() // "f:c>c2"
  const cells = new Set<string>()

  let firstStart = -1
  for (let p = 0; p < PATHS; p++) {
    let col = rng.int(0, COLS - 1)
    if (p === 1) while (col === firstStart) col = rng.int(0, COLS - 1)
    if (p === 0) firstStart = col
    cells.add(id(0, col))
    for (let f = 0; f < floors - 1; f++) {
      const options = [col - 1, col, col + 1].filter((c) => c >= 0 && c < COLS)
      const valid = options.filter((next) => {
        // Moving right crosses an existing edge from the right neighbour going left, and vice versa.
        if (next === col + 1 && edges.has(`${f}:${col + 1}>${col}`)) return false
        if (next === col - 1 && edges.has(`${f}:${col - 1}>${col}`)) return false
        return true
      })
      const next = valid.length ? rng.pick(valid) : col
      edges.add(`${f}:${col}>${next}`)
      cells.add(id(f + 1, next))
      col = next
    }
  }

  const nodes: Record<string, MapNode> = {}
  for (const cell of cells) {
    const [f, c] = cell.split('-').map(Number)
    nodes[cell] = { id: cell, floor: f, col: c, type: 'monster', next: [] }
  }
  for (const e of edges) {
    const [f, rest] = e.split(':')
    const [from, to] = rest.split('>').map(Number)
    const node = nodes[id(Number(f), from)]
    const target = id(Number(f) + 1, to)
    if (!node.next.includes(target)) node.next.push(target)
  }

  const parents = (node: MapNode) => Object.values(nodes).filter((n) => n.next.includes(node.id))
  const middle = Math.floor(floors / 2)

  for (let f = 0; f < floors; f++) {
    const row = Object.values(nodes)
      .filter((n) => n.floor === f)
      .sort((a, b) => a.col - b.col)
    for (const node of row) {
      if (f === 0) node.type = 'monster'
      else if (f === floors - 1) node.type = 'rest'
      else if (f === middle) node.type = 'treasure'
      else {
        const parentTypes = parents(node).map((p) => p.type)
        let type: NodeType = 'monster'
        for (let attempt = 0; attempt < 12; attempt++) {
          type = rng.weighted<NodeType>({
            monster: 46,
            event: 24,
            elite: f >= 2 ? 14 : 0,
            rest: f >= 2 && f < floors - 2 ? 8 : 0,
            shop: 8,
          })
          const clash = SPECIAL.includes(type) && parentTypes.includes(type)
          const restBeforeRest = type === 'rest' && f === floors - 2
          if (!clash && !restBeforeRest) break
          type = 'monster'
        }
        node.type = type
      }
    }
  }

  // Guarantee one shop per act so the economy matters.
  const all = Object.values(nodes)
  if (!all.some((n) => n.type === 'shop')) {
    const candidates = all.filter((n) => n.type === 'event' || (n.type === 'monster' && n.floor > 0))
    if (candidates.length) rng.pick(candidates).type = 'shop'
  }

  const bossId = 'boss'
  nodes[bossId] = { id: bossId, floor: floors, col: Math.floor(COLS / 2), type: 'boss', next: [] }
  for (const n of all) if (n.floor === floors - 1) n.next = [bossId]
  for (const n of all) n.next.sort()

  const starts = all
    .filter((n) => n.floor === 0)
    .sort((a, b) => a.col - b.col)
    .map((n) => n.id)

  return { act, nodes, starts, bossId, floors }
}

/** Ids the player may move to next. */
export function reachableNodes(map: ActMap, current: string | null): string[] {
  if (current === null) return map.starts
  return map.nodes[current]?.next ?? []
}
