// Dev-only helpers for visual QA (never included in production builds).
//   __sts.jump('shop' | 'rest' | 'treasure' | 'event' | 'elite' | 'boss' | 'monster')
//   __sts.win()   → win the current fight
//   __sts.lose()  → lose the current fight
//   __sts.act(3)  → skip to the start of an act

import { ENEMY_BY_ID } from './content/enemies'
import { generateMap, reachableNodes } from './engine/map'
import { rngOf } from './engine/rng'
import type { NodeType } from './engine/types'
import { useGame } from './store/gameStore'

function mutate(fn: (run: NonNullable<ReturnType<typeof useGame.getState>['run']>) => void) {
  const run = structuredClone(useGame.getState().run)
  if (!run) throw new Error('Start a run first')
  fn(run)
  useGame.setState({ run, view: 'game' })
}

const dev = {
  jump(type: NodeType) {
    mutate((run) => {
      run.screen = 'map'
      run.pick = null
      const id = reachableNodes(run.map, run.currentNode)[0]
      run.map.nodes[id].type = type
    })
    const run = useGame.getState().run!
    useGame.getState().dispatch({ type: 'CHOOSE_NODE', nodeId: reachableNodes(run.map, run.currentNode)[0] })
  },
  win() {
    mutate((run) => {
      for (const e of run.combat!.enemies) e.hp = 1
      run.combat!.hand.unshift({ uid: 99999, id: 'release-day', upgraded: true })
      run.combat!.energy = 9
    })
    useGame.getState().dispatch({ type: 'PLAY_CARD', uid: 99999 })
  },
  lose() {
    mutate((run) => {
      run.combat!.player.hp = 1
      run.combat!.player.block = 0
      run.storyMode = false
      for (const e of run.combat!.enemies) {
        const moves = ENEMY_BY_ID[e.defId].moves
        e.moveId = Object.keys(moves).find((id) => moves[id].actions.some((a) => a.kind === 'attack')) ?? e.moveId
      }
    })
    useGame.getState().dispatch({ type: 'END_TURN' })
  },
  act(n: number) {
    mutate((run) => {
      run.act = n
      run.map = generateMap(rngOf(run), n)
      run.currentNode = null
      run.visited = []
      run.screen = 'map'
      run.combat = null
    })
  },
  store: useGame,
}

declare global {
  interface Window {
    __sts: typeof dev
  }
}

window.__sts = dev
