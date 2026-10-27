// The three Acts are the three chapters of the career. Each act lists its
// encounters (arrays of enemy ids) and a "chapter" summary shown after its boss.

export interface ActDef {
  act: number
  name: string
  years: string
  subtitle: string
  easy: string[][]
  hard: string[][]
  elites: string[][]
  boss: { id: string; name: string; enemies: string[] }
  chapter: { heading: string; lines: string[] }
}

export const ACTS: ActDef[] = [
  {
    act: 1,
    name: 'The Freelance Floors',
    years: '2020 – 2022',
    subtitle: 'PTIT, a side project, and NCCPLUS Vietnam',
    easy: [['console-error', 'console-error'], ['timezone-bug'], ['untyped-pr']],
    hard: [['d3-hairball'], ['jsp-scriptlet', 'console-error'], ['untyped-pr', 'timezone-bug'], ['d3-hairball', 'console-error']],
    elites: [['scope-creep'], ['redux-boilerplate']],
    boss: { id: 'legacy-codebase', name: 'The Legacy Intern Codebase', enemies: ['legacy-codebase'] },
    chapter: {
      heading: 'Chapter 1 · NCCPLUS Vietnam (Jan 2021 – Jul 2022)',
      lines: [
        'Rooms For Rent (2020): a side project with a friend. Designed the layout and built the whole front end (Java, Spring Boot, JSP).',
        'Timesheet (2021): an Angular + MobX app for hours and leave. Redesigned Manage Users and Tasks and built Manage Projects.',
        'Fintech Control Tower (2021–2022): React, Redux, Apollo GraphQL and D3.js. New modules, refactors and redesigns.',
        'Scrum Master (Jun–Jul 2022) and Professional Scrum Master I certification.',
      ],
    },
  },
  {
    act: 2,
    name: 'The Dulux Depths',
    years: '2022 – 2026',
    subtitle: 'NashTech Vietnam → DuluxGroup, GTM Consumer',
    easy: [['wcag-gremlin', 'wcag-gremlin'], ['flickity-slime'], ['store-pin', 'store-pin', 'store-pin']],
    hard: [['mega-menu-wraith'], ['hydration-error'], ['es-golem'], ['wcag-gremlin', 'flickity-slime'], ['mega-menu-wraith', 'store-pin']],
    elites: [['enzyme-horde'], ['rogue-button', 'rogue-button', 'rogue-button']],
    boss: { id: 'signup-hydra', name: 'The Sign-up Hydra', enemies: ['hydra-keyvault', 'hydra-b2c', 'hydra-firebase'] },
    chapter: {
      heading: 'Chapter 2 · NashTech → DuluxGroup, GTM Consumer (Aug 2022 – Mar 2026)',
      lines: [
        'Top contributor by commits to dulux.com.au / dulux.co.nz, with 470+ merged pull requests.',
        'Built the Azure AD B2C + Firebase sign-up flow: Key Vault secrets, an hourly clean-up function and gitleaks pipelines.',
        'Delivered the product page redesign, Product Select Wizard, Colour Detail Page, Store Locator filters and ES-powered filtering.',
        'Improved SEO, SSR and accessibility (WCAG), and modernised the codebase: Tailwind v3, RTL (56 files), shared Buttons (109 files).',
        'Promoted to Senior Software Engineer in January 2026.',
      ],
    },
  },
  {
    act: 3,
    name: 'The Migration Spire',
    years: '2026',
    subtitle: 'Contentful → Optimizely CMS migration',
    easy: [['cwv-lcp', 'cwv-cls'], ['bynder-svg'], ['cwv-inp', 'cwv-cls']],
    hard: [['csp-violation'], ['onetrust-popup'], ['stale-codegen'], ['cwv-lcp', 'cwv-cls', 'cwv-inp'], ['bynder-svg', 'cwv-inp']],
    elites: [['cve-express', 'cve-jws', 'cve-qs', 'cve-uuid'], ['app-router-crash']],
    boss: { id: 'contentful-deadline', name: 'The Contentful Renewal Deadline', enemies: ['contentful-deadline'] },
    chapter: {
      heading: 'Chapter 3 · Optimizely CMS Migration (Apr – Sep 2026)',
      lines: [
        'Moved Consumer Web, Trade Web and Trade App (AU/NZ) from Contentful to Optimizely before the Sep 2026 renewal.',
        'Moved the GraphQL Image subgraph to Optimizely Graph with typed codegen, repositories, mocks and tests.',
        'Fixed Core Web Vitals and CSP issues; added Lighthouse audit scripts and an llms.txt route.',
        'Patched ~18 CVEs in the Firebase backend; wrote detailed designs and mentored junior developers.',
      ],
    },
  },
]

export const ACT_COUNT = ACTS.length
