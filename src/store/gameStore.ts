import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { playSfx, type Sfx } from '../audio/sfx'
import { randomSeed } from '../engine/rng'
import type * as EngineModule from '../engine/run'
import { SAVE_VERSION } from '../engine/version'
import type { Action, FxEvent, RunState } from '../engine/types'

export type Overlay = null | 'cv' | 'deck' | 'codex' | 'draw' | 'discard' | 'exhaust' | 'help'

export type Inspectable =
  | { kind: 'card'; id: string; upgraded: boolean }
  | { kind: 'enemy'; id: string; uid?: number }
  | { kind: 'relic'; id: string }
  | { kind: 'potion'; id: string }

interface GameStore {
  run: RunState | null
  view: 'title' | 'game'
  overlay: Overlay
  inspect: Inspectable | null
  muted: boolean
  storyMode: boolean
  /** Bumped on every dispatch so effects can react to new fx. */
  fxSeq: number
  dispatch: (action: Action) => void
  startRun: (opts?: { seed?: string }) => void
  continueRun: () => void
  abandonRun: () => void
  toTitle: () => void
  setOverlay: (overlay: Overlay) => void
  setInspect: (item: Inspectable | null) => void
  toggleMute: () => void
  setStoryMode: (on: boolean) => void
}

/** localStorage that never throws (private mode, blocked storage, previews). */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value)
    } catch {
      /* ignore */
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name)
    } catch {
      /* ignore */
    }
  },
}

// The engine (and all game content) is loaded on demand, so the title
// screen and CV don't have to download it first.
let engine: typeof EngineModule | null = null
export const loadEngine = () =>
  import('../engine/run').then((mod) => {
    engine = mod
    return mod
  })

function soundFor(fx: FxEvent[]): Sfx | null {
  if (fx.some((f) => f.type === 'death')) return 'death'
  if (fx.some((f) => f.type === 'damage' && f.amount > 0)) return 'hit'
  if (fx.some((f) => f.type === 'block')) return 'block'
  if (fx.some((f) => f.type === 'heal')) return 'heal'
  if (fx.some((f) => f.type === 'status')) return 'buff'
  if (fx.some((f) => f.type === 'play')) return 'card'
  return null
}

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      run: null,
      view: 'title',
      overlay: null,
      inspect: null,
      muted: true,
      storyMode: false,
      fxSeq: 0,
      dispatch: (action) => {
        const { run, muted } = get()
        if (!run || !engine) return
        const next = engine.reduce(run, action)
        set({ run: next, fxSeq: get().fxSeq + 1 })
        if (muted) return
        if (next.screen !== run.screen && next.screen === 'victory') playSfx('victory')
        else if (next.screen !== run.screen && next.screen === 'defeat') playSfx('defeat')
        else {
          const sound = next.combat ? soundFor(next.combat.fx) : null
          playSfx(sound ?? 'click')
        }
      },
      startRun: (opts) => {
        const seed = opts?.seed?.trim().toUpperCase() || randomSeed()
        void loadEngine().then(({ newRun }) => set({ run: newRun(seed, get().storyMode), view: 'game', overlay: null, inspect: null }))
      },
      continueRun: () => void loadEngine().then(() => set({ view: 'game', overlay: null })),
      abandonRun: () => set({ run: null, view: 'title', overlay: null, inspect: null }),
      toTitle: () => set({ view: 'title', overlay: null, inspect: null }),
      setOverlay: (overlay) => set({ overlay }),
      setInspect: (inspect) => set({ inspect }),
      toggleMute: () => {
        const muted = !get().muted
        set({ muted })
        if (!muted) playSfx('click')
      },
      setStoryMode: (storyMode) => set({ storyMode }),
    }),
    {
      name: 'slay-the-sprint',
      version: SAVE_VERSION,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ run: s.run, muted: s.muted, storyMode: s.storyMode }),
      // Old saves from another version are dropped rather than crashing.
      migrate: () => ({ run: null, muted: true, storyMode: false }),
    },
  ),
)
