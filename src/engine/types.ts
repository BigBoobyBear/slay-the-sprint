// Core game types. The engine is pure TypeScript with no React, so it can be
// unit-tested and run headless by scripts/simulate.ts.

export type StatusId =
  | 'strength' // "Experience": +N attack damage
  | 'dexterity' // "Discipline": +N block from cards
  | 'vulnerable' // "Tech Debt": take 50% more attack damage (turns)
  | 'weak' // "Burnout": deal 25% less attack damage (turns)
  | 'ritual' // gain N strength at end of own turn
  | 'thorns' // attackers take N damage
  | 'buffer' // prevent the next N times you would lose HP
  | 'ssr' // power: gain N block at start of turn
  | 'federation' // power: after you play an Attack, deal N to ALL enemies
  | 'pairProgrammer' // power: draw N extra cards at start of turn
  | 'pipeline' // power: at end of turn deal N to ALL enemies
  | 'growth' // power: gain N strength at start of turn

export type Statuses = Partial<Record<StatusId, number>>

export type CardType = 'attack' | 'skill' | 'power' | 'status' | 'curse'
export type Rarity = 'starter' | 'common' | 'uncommon' | 'rare' | 'special'
export type CardTarget = 'enemy' | 'none'

export type Effect =
  | { kind: 'damage'; amount: number; target: 'enemy' | 'all' | 'random'; times?: number; pierce?: boolean }
  | { kind: 'damageFromBlock' }
  | { kind: 'block'; amount: number }
  | { kind: 'doubleBlock' }
  | { kind: 'draw'; amount: number }
  | { kind: 'energy'; amount: number }
  | { kind: 'status'; status: StatusId; amount: number; target: 'enemy' | 'all' | 'self' }
  | { kind: 'heal'; amount: number }
  | { kind: 'loseHp'; amount: number }
  | { kind: 'upgradeHand' }
  | { kind: 'exhaustStatusCardsDraw' }

export interface CardStats {
  name?: string
  cost: number
  effects: Effect[]
  exhaust?: boolean
}

export interface CardDef {
  id: string
  name: string
  type: CardType
  rarity: Rarity
  target: CardTarget
  base: CardStats
  upgrade?: Partial<CardStats>
  unplayable?: boolean
  /** Status/curse cards: lose this much HP if still in hand at end of turn. */
  burnAtEndOfTurn?: number
  /** One-line real-world story shown in the Inspect panel. */
  cv: string
  /** Short flavour shown under the card text. */
  flavor?: string
  /** Icon key for card art. */
  art: string
}

export interface CardInstance {
  uid: number
  id: string
  upgraded: boolean
}

export type IntentKind = 'attack' | 'defend' | 'buff' | 'debuff' | 'attackDefend' | 'attackDebuff' | 'summon' | 'unknown'

export type EnemyAction =
  | { kind: 'attack'; amount: number; times?: number }
  | { kind: 'block'; amount: number }
  | { kind: 'blockAll'; amount: number }
  | { kind: 'buff'; status: StatusId; amount: number }
  | { kind: 'buffAll'; status: StatusId; amount: number }
  | { kind: 'debuff'; status: StatusId; amount: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'addCards'; cardId: string; count: number; pile: 'discard' | 'draw' }

export interface EnemyMove {
  name: string
  intent: IntentKind
  actions: EnemyAction[]
}

export interface MoveContext {
  turn: number
  history: string[]
  hpRatio: number
  roll: number // 0..1 from the run RNG
}

export interface EnemyDef {
  id: string
  name: string
  hp: [number, number]
  tier: 'normal' | 'elite' | 'boss'
  moves: Record<string, EnemyMove>
  /** Choose the next move id. Must be deterministic given the context. */
  pickMove: (ctx: MoveContext) => string
  startStatuses?: Statuses
  cv: string
  art: string
  /** Scale of the sprite (1 = normal). */
  size?: number
}

export interface Combatant {
  hp: number
  maxHp: number
  block: number
  statuses: Statuses
}

export interface EnemyState extends Combatant {
  uid: number
  defId: string
  moveId: string | null
  history: string[]
}

export type FxEvent =
  | { type: 'damage'; target: 'player' | number; amount: number; blocked: number }
  | { type: 'block'; target: 'player' | number; amount: number }
  | { type: 'heal'; target: 'player' | number; amount: number }
  | { type: 'status'; target: 'player' | number; status: StatusId; amount: number }
  | { type: 'death'; target: number }
  | { type: 'play'; cardId: string }
  | { type: 'enemyTurn' }

export interface CombatState {
  encounterId: string
  tier: 'normal' | 'elite' | 'boss'
  turn: number
  energy: number
  maxEnergy: number
  player: Combatant
  enemies: EnemyState[]
  drawPile: CardInstance[]
  hand: CardInstance[]
  discardPile: CardInstance[]
  exhaustPile: CardInstance[]
  /** Cards upgraded only for this combat (by uid). */
  tempUpgrades: number[]
  attacksPlayed: number
  cardsPlayedThisTurn: number
  log: string[]
  fx: FxEvent[]
  outcome: 'ongoing' | 'won' | 'lost'
}

export type NodeType = 'monster' | 'elite' | 'event' | 'rest' | 'shop' | 'treasure' | 'boss'

export interface MapNode {
  id: string
  floor: number
  col: number
  type: NodeType
  next: string[]
}

export interface ActMap {
  act: number
  nodes: Record<string, MapNode>
  /** Node ids on floor 0. */
  starts: string[]
  bossId: string
  floors: number
}

export interface CardReward {
  cards: string[]
  taken: boolean
}

export interface RewardState {
  gold: number
  goldTaken: boolean
  potion: string | null
  relic: string | null
  cardRewards: CardReward[]
  bossRelics: string[] | null
}

export interface ShopItem {
  kind: 'card' | 'relic' | 'potion' | 'remove'
  id: string
  price: number
  sold: boolean
}

export interface ShopState {
  items: ShopItem[]
}

export type PickPurpose = 'upgrade' | 'remove'

export interface PickState {
  purpose: PickPurpose
  /** Screen to return to after picking. */
  returnTo: Screen
  source: 'rest' | 'shop' | 'event' | 'onboarding'
}

export type Screen =
  | 'onboarding'
  | 'map'
  | 'combat'
  | 'reward'
  | 'rest'
  | 'shop'
  | 'treasure'
  | 'event'
  | 'actComplete'
  | 'victory'
  | 'defeat'

export interface RunStats {
  floorsClimbed: number
  enemiesSlain: string[]
  elitesSlain: number
  bossesSlain: number
  damageDealt: number
  cardsPlayed: number
  turns: number
  goldEarned: number
}

export interface EventState {
  id: string
  resolved: string | null // result text after a choice
}

export interface RunState {
  version: number
  seed: string
  rng: number
  storyMode: boolean
  hp: number
  maxHp: number
  gold: number
  deck: CardInstance[]
  relics: string[]
  potions: (string | null)[]
  act: number
  map: ActMap
  currentNode: string | null
  visited: string[]
  screen: Screen
  combat: CombatState | null
  reward: RewardState | null
  shop: ShopState | null
  event: EventState | null
  pick: PickState | null
  treasureRelic: string | null
  /** Relics already offered this run, so drops do not repeat. */
  seenRelics: string[]
  seenEvents: string[]
  nextUid: number
  stats: RunStats
  restDone: boolean
  fightsThisAct: number
  lastEncounter: string | null
  lastMessage: string | null
}

export type Action =
  | { type: 'CHOOSE_ONBOARDING'; option: 'diploma' | 'relic' | 'remove' | 'gold' }
  | { type: 'CHOOSE_NODE'; nodeId: string }
  | { type: 'PLAY_CARD'; uid: number; target?: number }
  | { type: 'END_TURN' }
  | { type: 'USE_POTION'; slot: number; target?: number }
  | { type: 'DISCARD_POTION'; slot: number }
  | { type: 'TAKE_GOLD' }
  | { type: 'TAKE_POTION' }
  | { type: 'TAKE_RELIC' }
  | { type: 'TAKE_CARD'; rewardIndex: number; cardId: string }
  | { type: 'SKIP_CARD'; rewardIndex: number }
  | { type: 'TAKE_BOSS_RELIC'; relicId: string }
  | { type: 'LEAVE_REWARD' }
  | { type: 'REST' }
  | { type: 'START_PICK'; purpose: PickPurpose; source: PickState['source'] }
  | { type: 'PICK_CARD'; uid: number }
  | { type: 'CANCEL_PICK' }
  | { type: 'LEAVE_ROOM' }
  | { type: 'BUY'; index: number }
  | { type: 'OPEN_TREASURE' }
  | { type: 'EVENT_CHOICE'; choice: number }
  | { type: 'NEXT_ACT' }
