import type { EnemyDef, EnemyMove, MoveContext } from '../engine/types'

// Enemies are real bugs, tickets and deadlines from the CV. Move patterns are
// small pure functions of (turn, history, hp, roll) so runs stay deterministic.

const atk = (name: string, amount: number, times?: number): EnemyMove => ({
  name,
  intent: 'attack',
  actions: [{ kind: 'attack', amount, times }],
})

/** Repeat a fixed sequence of moves. */
const cycle =
  (...ids: string[]) =>
  (ctx: MoveContext) =>
    ids[(ctx.turn - 1) % ids.length]

/** Weighted random, never the same move three times in a row. */
const random =
  (weights: Record<string, number>) =>
  (ctx: MoveContext): string => {
    const last2 = ctx.history.slice(-2)
    const banned = last2.length === 2 && last2[0] === last2[1] ? last2[0] : null
    const entries = Object.entries(weights).filter(([id]) => id !== banned)
    const total = entries.reduce((s, [, w]) => s + w, 0)
    let roll = ctx.roll * total
    for (const [id, w] of entries) {
      roll -= w
      if (roll < 0) return id
    }
    return entries[entries.length - 1][0]
  }

/** Start with a fixed opener, then fall back to another picker. */
const opener =
  (first: string, then: (ctx: MoveContext) => string) =>
  (ctx: MoveContext) =>
    ctx.turn === 1 ? first : then(ctx)

export const ENEMIES: EnemyDef[] = [
  // ======================= ACT 1 — The Freelance Floors =======================
  {
    id: 'console-error',
    name: 'Console Error',
    hp: [12, 16],
    tier: 'normal',
    art: 'console',
    cv: 'The first enemy of every junior: red text in DevTools. Met daily on the Timesheet app in early 2021.',
    moves: {
      throw: atk('Uncaught TypeError', 6),
      spam: atk('Log Spam', 3, 2),
    },
    pickMove: random({ throw: 60, spam: 40 }),
  },
  {
    id: 'timezone-bug',
    name: 'Timezone Bug',
    hp: [20, 24],
    tier: 'normal',
    art: 'clock',
    cv: 'Timesheet (Jan–Mar 2021): an internal Angular app for logging hours and leave. Moment.js and timezones.',
    moves: {
      offByOne: atk('Off-by-One Hour', 7),
      dst: {
        name: 'Daylight Saving',
        intent: 'attackDebuff',
        actions: [
          { kind: 'attack', amount: 4 },
          { kind: 'debuff', status: 'weak', amount: 1 },
        ],
      },
    },
    pickMove: cycle('dst', 'offByOne', 'offByOne'),
  },
  {
    id: 'untyped-pr',
    name: 'Untyped Intern PR',
    hp: [22, 26],
    tier: 'normal',
    art: 'scroll',
    cv: "Fintech Control Tower (2021–2022): refactored former interns' code into typed React + Redux modules.",
    moves: {
      any: atk(': any', 6),
      tangle: {
        name: 'Copy-Paste',
        intent: 'defend',
        actions: [
          { kind: 'block', amount: 5 },
          { kind: 'addCards', cardId: 'spaghetti', count: 1, pile: 'discard' },
        ],
      },
    },
    pickMove: random({ any: 55, tangle: 45 }),
  },
  {
    id: 'd3-hairball',
    name: 'D3 Hairball',
    hp: [26, 30],
    tier: 'normal',
    art: 'hairball',
    cv: 'Force-directed graphs of FinTech players and partnerships in D3.js. Tangled until tamed.',
    moves: {
      lash: atk('Edge Lash', 5, 2),
      grow: { name: 'Add Nodes', intent: 'buff', actions: [{ kind: 'buff', status: 'strength', amount: 2 }] },
    },
    pickMove: opener('grow', random({ lash: 70, grow: 30 })),
  },
  {
    id: 'jsp-scriptlet',
    name: 'JSP Scriptlet',
    hp: [24, 28],
    tier: 'normal',
    art: 'cup',
    cv: 'Rooms For Rent (2020): a Java + Spring Boot side project where Nhan converted the whole front end to JSP.',
    moves: {
      bean: atk('<%= bean %>', 9),
      servlet: {
        name: 'Servlet Wall',
        intent: 'attackDefend',
        actions: [
          { kind: 'attack', amount: 5 },
          { kind: 'block', amount: 5 },
        ],
      },
    },
    pickMove: random({ bean: 50, servlet: 50 }),
  },
  // Act 1 elites
  {
    id: 'scope-creep',
    name: 'Scope Creep',
    hp: [58, 62],
    tier: 'elite',
    art: 'creep',
    size: 1.25,
    cv: 'Fintech Control Tower: components kept updating to new designs and business rules. It grows every sprint.',
    startStatuses: { ritual: 1 },
    moves: {
      ask: atk('"Just One More Thing"', 9),
      flurry: atk('Change Requests', 4, 3),
      pivot: {
        name: 'Pivot',
        intent: 'debuff',
        actions: [
          { kind: 'debuff', status: 'vulnerable', amount: 2 },
          { kind: 'block', amount: 6 },
        ],
      },
    },
    pickMove: cycle('pivot', 'ask', 'flurry'),
  },
  {
    id: 'redux-boilerplate',
    name: 'Redux Boilerplate',
    hp: [48, 52],
    tier: 'elite',
    art: 'boxes',
    size: 1.2,
    cv: 'Actions, reducers, selectors, sagas… Redux and MobX across the Fintech and Timesheet apps.',
    moves: {
      dispatch: atk('Dispatch ×3', 4, 3),
      boilerplate: {
        name: 'Generate Boilerplate',
        intent: 'debuff',
        actions: [{ kind: 'addCards', cardId: 'spaghetti', count: 2, pile: 'discard' }],
      },
      reduce: atk('Reduce', 12),
    },
    pickMove: cycle('boilerplate', 'dispatch', 'reduce'),
  },
  // Act 1 boss
  {
    id: 'legacy-codebase',
    name: 'The Legacy Intern Codebase',
    hp: [120, 120],
    tier: 'boss',
    art: 'legacy',
    size: 1.55,
    cv: "Boss of Act 1. NCCPLUS, 2021–2022: refactor former interns' code, write new modules, fix bugs, update to new designs.",
    moves: {
      conflict: atk('Merge Conflict', 13),
      spill: {
        name: 'Spaghetti Spill',
        intent: 'defend',
        actions: [
          { kind: 'block', amount: 12 },
          { kind: 'addCards', cardId: 'spaghetti', count: 2, pile: 'discard' },
        ],
      },
      branches: atk('Untested Branches', 5, 3),
      rewrite: {
        name: '"Let\'s Rewrite It"',
        intent: 'buff',
        actions: [{ kind: 'buff', status: 'strength', amount: 3 }],
      },
    },
    pickMove: cycle('spill', 'conflict', 'branches', 'rewrite', 'conflict', 'branches'),
  },

  // ========================= ACT 2 — The Dulux Depths =========================
  {
    id: 'wcag-gremlin',
    name: 'WCAG Gremlin',
    hp: [12, 15],
    tier: 'normal',
    art: 'gremlin',
    size: 0.8,
    cv: 'CWE-2154 to 2157 (Oct 2022): roles outside parents, missing labels, nameless links, heading order. All fixed.',
    moves: {
      label: atk('Missing Label', 5),
      heading: {
        name: 'Skip a Heading',
        intent: 'debuff',
        actions: [{ kind: 'debuff', status: 'vulnerable', amount: 1 }],
      },
    },
    pickMove: random({ label: 65, heading: 35 }),
  },
  {
    id: 'flickity-slime',
    name: 'Flickity Slime',
    hp: [32, 36],
    tier: 'normal',
    art: 'slime',
    cv: 'CWE-2450 (Dec 2022): Flickity carousel scrollbar and style bugs, then many sliders after it.',
    moves: {
      swipe: atk('Swipe', 9),
      ooze: {
        name: 'Scrollbar Ooze',
        intent: 'attackDebuff',
        actions: [
          { kind: 'attack', amount: 6 },
          { kind: 'addCards', cardId: 'bug', count: 1, pile: 'discard' },
        ],
      },
    },
    pickMove: random({ swipe: 55, ooze: 45 }),
  },
  {
    id: 'mega-menu-wraith',
    name: 'Mega-Menu Wraith',
    hp: [34, 38],
    tier: 'normal',
    art: 'wraith',
    cv: 'CWE-2985 and CWE-3942: mega menu rollover timing and diagonal mouse movement. It vanishes when you cross it.',
    moves: {
      drift: atk('Diagonal Drift', 6, 2),
      flicker: {
        name: 'Hover Flicker',
        intent: 'debuff',
        actions: [
          { kind: 'debuff', status: 'weak', amount: 2 },
          { kind: 'block', amount: 6 },
        ],
      },
    },
    pickMove: opener('flicker', random({ drift: 65, flicker: 35 })),
  },
  {
    id: 'hydration-error',
    name: 'Hydration Mismatch',
    hp: [36, 40],
    tier: 'normal',
    art: 'droplet',
    cv: 'Fixed hydration errors and App Router SSR crashes on dulux.com.au (2026).',
    moves: {
      mismatch: atk('Text Did Not Match', 12),
      rerender: {
        name: 'Client Re-render',
        intent: 'attackDebuff',
        actions: [
          { kind: 'attack', amount: 7 },
          { kind: 'addCards', cardId: 'bug', count: 1, pile: 'draw' },
        ],
      },
    },
    pickMove: cycle('rerender', 'mismatch'),
  },
  {
    id: 'store-pin',
    name: 'Store Locator Pin',
    hp: [13, 16],
    tier: 'normal',
    art: 'pin',
    size: 0.8,
    cv: 'Store Locator (2023): brand filters, logos, map/listing heights, NZ login fix (CWE-3157 to 3268).',
    moves: {
      poke: atk('Wrong Region', 5),
      cluster: { name: 'Cluster', intent: 'defend', actions: [{ kind: 'blockAll', amount: 4 }] },
    },
    pickMove: random({ poke: 70, cluster: 30 }),
  },
  {
    id: 'es-golem',
    name: 'Elasticsearch Golem',
    hp: [46, 50],
    tier: 'normal',
    art: 'golem',
    size: 1.15,
    cv: 'Custom Elasticsearch for product collections, sorting by recommended, and replacing deprecated ES packages.',
    moves: {
      reindex: {
        name: 'Reindex',
        intent: 'buff',
        actions: [
          { kind: 'block', amount: 10 },
          { kind: 'buff', status: 'strength', amount: 2 },
        ],
      },
      slam: atk('Query DSL Slam', 15),
    },
    pickMove: cycle('reindex', 'slam', 'slam'),
  },
  // Act 2 elites
  {
    id: 'enzyme-horde',
    name: 'The Enzyme Horde',
    hp: [74, 78],
    tier: 'elite',
    art: 'horde',
    size: 1.3,
    cv: 'Migrated 56 test files from Enzyme to React Testing Library on the consumer site (2026).',
    moves: {
      shallow: atk('Shallow Render', 6, 3),
      deprecate: {
        name: 'Deprecated API',
        intent: 'buff',
        actions: [
          { kind: 'buff', status: 'strength', amount: 3 },
          { kind: 'block', amount: 10 },
        ],
      },
      mount: atk('Full Mount', 18),
    },
    pickMove: cycle('deprecate', 'shallow', 'mount'),
  },
  {
    id: 'rogue-button',
    name: 'Rogue Button',
    hp: [24, 27],
    tier: 'elite',
    art: 'button',
    size: 0.9,
    cv: 'Standardised shared Anchor and Button components across 109 files.',
    moves: {
      click: atk('Inconsistent Click', 7),
      variant: {
        name: 'Yet Another Variant',
        intent: 'buff',
        actions: [{ kind: 'buffAll', status: 'strength', amount: 1 }],
      },
    },
    pickMove: random({ click: 70, variant: 30 }),
  },
  // Act 2 boss: the Sign-up Hydra (three heads)
  {
    id: 'hydra-b2c',
    name: 'Azure AD B2C Head',
    hp: [64, 64],
    tier: 'boss',
    art: 'hydra-b2c',
    size: 1.25,
    cv: 'Boss of Act 2. Built the new sign-up flow on Azure AD B2C: API-key and host checks on every endpoint.',
    moves: {
      redirect: atk('Redirect Loop', 11),
      token: {
        name: 'Expired Token',
        intent: 'attackDebuff',
        actions: [
          { kind: 'attack', amount: 6 },
          { kind: 'debuff', status: 'weak', amount: 2 },
        ],
      },
    },
    pickMove: cycle('token', 'redirect', 'redirect'),
  },
  {
    id: 'hydra-firebase',
    name: 'Firebase Head',
    hp: [56, 56],
    tier: 'boss',
    art: 'hydra-firebase',
    size: 1.15,
    cv: 'Firebase Cloud Functions + Realtime DB behind the sign-up flow, deployed by Azure Pipelines and GitHub Actions.',
    moves: {
      burst: atk('Cold Start Burst', 5, 2),
      sync: { name: 'Realtime Sync', intent: 'buff', actions: [{ kind: 'heal', amount: 10 }, { kind: 'blockAll', amount: 5 }] },
    },
    pickMove: cycle('burst', 'sync', 'burst'),
  },
  {
    id: 'hydra-keyvault',
    name: 'Key Vault Head',
    hp: [50, 50],
    tier: 'boss',
    art: 'hydra-keyvault',
    size: 1.1,
    cv: 'Secrets moved into Azure Key Vault, with gitleaks scanning in every deploy pipeline.',
    moves: {
      seal: { name: 'Seal Secrets', intent: 'defend', actions: [{ kind: 'blockAll', amount: 9 }] },
      rotate: { name: 'Rotate Keys', intent: 'buff', actions: [{ kind: 'buffAll', status: 'strength', amount: 2 }] },
      leak: atk('Leaked Secret', 9),
    },
    pickMove: cycle('seal', 'leak', 'rotate', 'leak'),
  },

  // ======================== ACT 3 — The Migration Spire ========================
  {
    id: 'csp-violation',
    name: 'CSP Violation',
    hp: [42, 46],
    tier: 'normal',
    art: 'shieldx',
    cv: 'Fixed Content Security Policy violations on the consumer and trade sites, plus a Sep 2026 CSP hotfix.',
    startStatuses: { thorns: 3 },
    moves: {
      block: atk('Refused to Load', 11),
      harden: {
        name: 'Harden Policy',
        intent: 'buff',
        actions: [
          { kind: 'buff', status: 'thorns', amount: 2 },
          { kind: 'block', amount: 10 },
        ],
      },
    },
    pickMove: cycle('block', 'harden', 'block'),
  },
  {
    id: 'onetrust-popup',
    name: 'OneTrust Popup',
    hp: [40, 44],
    tier: 'normal',
    art: 'popup',
    cv: 'Added OneTrust cookie consent for AU/NZ (2025), then turned it off in CMS preview mode (2026).',
    moves: {
      modal: {
        name: 'Accept All?',
        intent: 'debuff',
        actions: [
          { kind: 'debuff', status: 'weak', amount: 2 },
          { kind: 'debuff', status: 'vulnerable', amount: 2 },
        ],
      },
      overlay: atk('Modal Overlay', 13),
    },
    pickMove: opener('modal', random({ overlay: 70, modal: 30 })),
  },
  {
    id: 'cwv-lcp',
    name: 'LCP',
    hp: [30, 33],
    tier: 'normal',
    art: 'snail',
    size: 0.9,
    cv: 'Core Web Vitals — Largest Contentful Paint. Fixed with Next.js Image, preloading and SSR (2026).',
    moves: {
      load: { name: 'Loading…', intent: 'defend', actions: [{ kind: 'block', amount: 8 }] },
      paint: atk('Slow Hero Image', 16),
    },
    pickMove: cycle('load', 'paint'),
  },
  {
    id: 'cwv-cls',
    name: 'CLS',
    hp: [28, 31],
    tier: 'normal',
    art: 'shift',
    size: 0.9,
    cv: 'Core Web Vitals — Cumulative Layout Shift. Fixed with sized images, fonts and skeletons.',
    moves: {
      shift: {
        name: 'Layout Shift',
        intent: 'attackDebuff',
        actions: [
          { kind: 'attack', amount: 5 },
          { kind: 'debuff', status: 'vulnerable', amount: 1 },
        ],
      },
    },
    pickMove: () => 'shift',
  },
  {
    id: 'cwv-inp',
    name: 'INP',
    hp: [28, 31],
    tier: 'normal',
    art: 'cursor',
    size: 0.9,
    cv: 'Core Web Vitals — Interaction to Next Paint. Long tasks split, heavy imports made dynamic.',
    moves: {
      lag: atk('Input Lag', 4, 2),
    },
    pickMove: () => 'lag',
  },
  {
    id: 'bynder-svg',
    name: 'Broken Bynder SVG',
    hp: [38, 42],
    tier: 'normal',
    art: 'image',
    cv: 'Fixed Bynder SVG images (use the original URL) and image-slider issues during the migration.',
    moves: {
      broken: {
        name: '404 Image',
        intent: 'attackDebuff',
        actions: [
          { kind: 'attack', amount: 8 },
          { kind: 'addCards', cardId: 'bug', count: 1, pile: 'discard' },
        ],
      },
      stretch: atk('Aspect Ratio Stretch', 12),
    },
    pickMove: random({ broken: 50, stretch: 50 }),
  },
  {
    id: 'stale-codegen',
    name: 'Stale Codegen Types',
    hp: [44, 48],
    tier: 'normal',
    art: 'scroll',
    cv: 'Typed GraphQL code generation per environment for the Optimizely Graph client.',
    moves: {
      mismatch: atk('Schema Drift', 10),
      regen: {
        name: 'Regenerate',
        intent: 'buff',
        actions: [
          { kind: 'buff', status: 'strength', amount: 2 },
          { kind: 'block', amount: 8 },
        ],
      },
    },
    pickMove: cycle('regen', 'mismatch', 'mismatch'),
  },
  // Act 3 elites
  ...['express', 'jws', 'qs', 'uuid', 'tar'].map(
    (pkg): EnemyDef => ({
      id: `cve-${pkg}`,
      name: `CVE: ${pkg}`,
      hp: [17, 20],
      tier: 'elite',
      art: 'cve',
      size: 0.75,
      cv: 'One of ~18 dependency vulnerabilities patched in the Firebase backend in September 2026.',
      moves: {
        exploit: atk('Exploit', 6),
        chain: {
          name: 'Dependency Chain',
          intent: 'buff',
          actions: [{ kind: 'buffAll', status: 'strength', amount: 1 }],
        },
      },
      pickMove: random({ exploit: 75, chain: 25 }),
    }),
  ),
  {
    id: 'app-router-crash',
    name: 'App Router Crash',
    hp: [96, 100],
    tier: 'elite',
    art: 'crash',
    size: 1.35,
    cv: 'Fixed App Router SSR crashes (e.g. dynamic import of @react-pdf/renderer) and missing menus on account pages.',
    moves: {
      boundary: {
        name: 'Error Boundary',
        intent: 'defend',
        actions: [
          { kind: 'block', amount: 15 },
          { kind: 'buff', status: 'strength', amount: 2 },
        ],
      },
      crash: atk('500 Internal Error', 20),
      cascade: atk('Cascade', 7, 3),
    },
    pickMove: cycle('boundary', 'crash', 'cascade'),
  },
  // Act 3 boss
  {
    id: 'contentful-deadline',
    name: 'The Contentful Renewal Deadline',
    hp: [230, 230],
    tier: 'boss',
    art: 'deadline',
    size: 1.6,
    cv: 'Final boss. Migrate Consumer Web, Trade Web and Trade App from Contentful to Optimizely before 30 Sep 2026.',
    startStatuses: { ritual: 1 },
    moves: {
      notice: {
        name: 'Renewal Notice',
        intent: 'debuff',
        actions: [
          { kind: 'debuff', status: 'weak', amount: 2 },
          { kind: 'debuff', status: 'vulnerable', amount: 2 },
        ],
      },
      invoice: atk('Licence Invoice', 14),
      countdown: {
        name: 'Countdown',
        intent: 'attackDefend',
        actions: [
          { kind: 'attack', amount: 8 },
          { kind: 'block', amount: 14 },
        ],
      },
      sep30: atk('September 30th', 4, 4),
    },
    pickMove: cycle('notice', 'invoice', 'countdown', 'sep30', 'invoice', 'countdown'),
  },
]

export const ENEMY_BY_ID: Record<string, EnemyDef> = Object.fromEntries(ENEMIES.map((e) => [e.id, e]))
