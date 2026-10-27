// Deterministic RNG (mulberry32). The state is a single 32-bit number kept in
// RunState, so a run can be saved, resumed and replayed exactly.

export interface Rng {
  next(): number // [0, 1)
  int(min: number, max: number): number // inclusive
  pick<T>(items: readonly T[]): T
  shuffle<T>(items: T[]): T[]
  chance(p: number): boolean
  weighted<T extends string>(weights: Partial<Record<T, number>>): T
}

export function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^ (h >>> 16)) >>> 0
}

/** Wrap a holder whose `rng` field stores the state; advancing writes it back. */
export function rngOf(holder: { rng: number }): Rng {
  const next = () => {
    holder.rng = (holder.rng + 0x6d2b79f5) >>> 0
    let t = holder.rng
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const rng: Rng = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (items) => items[Math.floor(next() * items.length)],
    shuffle: (items) => {
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[items[i], items[j]] = [items[j], items[i]]
      }
      return items
    },
    chance: (p) => next() < p,
    weighted: (weights) => {
      const entries = Object.entries(weights) as [string, number][]
      const total = entries.reduce((sum, [, w]) => sum + w, 0)
      let roll = next() * total
      for (const [key, w] of entries) {
        roll -= w
        if (roll < 0) return key as never
      }
      return entries[entries.length - 1][0] as never
    },
  }
  return rng
}

export function randomSeed(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
  return s
}
