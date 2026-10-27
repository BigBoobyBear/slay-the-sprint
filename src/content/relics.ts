// Relics are certifications, degrees and milestones. Effects are applied by
// id in engine/relics.ts.

export interface RelicDef {
  id: string
  name: string
  tier: 'starter' | 'common' | 'boss' | 'special'
  description: string
  cv: string
  art: string
}

export const RELICS: RelicDef[] = [
  {
    id: 'vscode',
    name: 'VS Code',
    tier: 'starter',
    description: 'At the end of combat, heal 6 Morale.',
    cv: 'Visual Studio Code (Advanced). The editor behind every project since 2020.',
    art: 'editor',
  },
  {
    id: 'ptit-diploma',
    name: 'PTIT Diploma',
    tier: 'special',
    description: 'Gain 10 Max Morale.',
    cv: 'Engineer of Information Technology, Posts and Telecommunications Institute of Technology, Hanoi (2017–2022).',
    art: 'scroll',
  },
  {
    id: 'psm-1',
    name: 'PSM I',
    tier: 'special',
    description: 'Gain 1 extra Focus on the first turn of each combat.',
    cv: 'Professional Scrum Master I, Scrum.org, issued 1 Jul 2022. Never expires.',
    art: 'badge',
  },
  {
    id: 'aws-ccp',
    name: 'AWS Cloud Practitioner',
    tier: 'common',
    description: 'Start each combat with 8 Block.',
    cv: 'AWS Certified Cloud Practitioner, issued 25 May 2024, valid to May 2027.',
    art: 'cloud',
  },
  {
    id: 'aws-cloud-quest',
    name: 'AWS Cloud Quest',
    tier: 'common',
    description: 'Draw 2 extra cards on the first turn of each combat.',
    cv: 'AWS Cloud Quest: Cloud Practitioner, Apr 2024.',
    art: 'cloud',
  },
  {
    id: 'google-educator-1',
    name: 'Google Educator L1',
    tier: 'common',
    description: 'Gain 7 Max Morale and heal 7.',
    cv: 'Google Certified Educator Level 1, Dec 2025.',
    art: 'apple',
  },
  {
    id: 'google-educator-2',
    name: 'Google Educator L2',
    tier: 'common',
    description: 'Start each combat with 1 Discipline.',
    cv: 'Google Certified Educator Level 2, Dec 2025.',
    art: 'apple',
  },
  {
    id: 'gemini-educator',
    name: 'Gemini Educator',
    tier: 'common',
    description: 'Start each combat with 1 Experience.',
    cv: 'Gemini Certified Educator, Google for Education, Dec 2025.',
    art: 'spark',
  },
  {
    id: 'ai-k12',
    name: 'AI for K12 Educators',
    tier: 'common',
    description: 'Whenever you use a potion, heal 5 Morale.',
    cv: 'Google AI for K12 Educators, Dec 2025.',
    art: 'spark',
  },
  {
    id: 'agile-badge',
    name: 'Agile Methodologies Badge',
    tier: 'common',
    description: 'At the start of your 3rd turn, gain 2 Focus.',
    cv: 'LinkedIn Agile Methodologies skill badge.',
    art: 'badge',
  },
  {
    id: 'gitleaks',
    name: 'gitleaks',
    tier: 'common',
    description: 'The first time you would lose Morale in each combat, lose none instead.',
    cv: 'Added gitleaks secret scanning to the Firebase deploy pipelines.',
    art: 'lock',
  },
  {
    id: 'lighthouse-script',
    name: 'Lighthouse Script',
    tier: 'common',
    description: 'At the start of each combat, apply 1 Tech Debt to ALL enemies.',
    cv: 'Lighthouse audit scripts for the consumer and trade sites (Core Web Vitals turns 1 & 2).',
    art: 'lighthouse',
  },
  {
    id: 'llms-txt',
    name: 'llms.txt',
    tier: 'common',
    description: 'Card rewards offer 1 extra choice.',
    cv: 'Added an llms.txt route to the Dulux sites in 2026, so AI agents can read them well.',
    art: 'scroll',
  },
  {
    id: 'key-vault',
    name: 'Azure Key Vault',
    tier: 'common',
    description: 'Shop prices are 20% lower.',
    cv: 'Moved sign-up secrets into Azure Key Vault (renamed and rotated).',
    art: 'key',
  },
  {
    id: 'app-insights',
    name: 'Application Insights',
    tier: 'common',
    description: 'Gain 15 extra Commits after each elite or boss.',
    cv: 'Application Insights monitoring for the Next.js app (config moved to secretEnv in 2026).',
    art: 'chart',
  },
  // Boss relics
  {
    id: 'merged-prs',
    name: '470 Merged PRs',
    tier: 'boss',
    description: 'Gain 1 Focus at the start of each turn.',
    cv: '470 merged pull requests on dulux-consumer-website (Sep 2022 – Sep 2026).',
    art: 'git',
  },
  {
    id: 'top-committer',
    name: 'Top Committer Crown',
    tier: 'boss',
    description: 'Draw 1 extra card each turn.',
    cv: '#1 committer in the Dulux consumer website repo (983 commits including merges and branches).',
    art: 'crown',
  },
  {
    id: 'optimizely-graph',
    name: 'Optimizely Graph',
    tier: 'boss',
    description: 'At the start of each combat, apply 2 Tech Debt and 1 Burnout to ALL enemies.',
    cv: 'Moved the GraphQL Image subgraph to Optimizely Graph: client, typed codegen, repositories, mocks and tests.',
    art: 'graphql',
  },
  {
    id: 'rtl-56',
    name: '56 RTL Files',
    tier: 'boss',
    description: 'Start each combat with 2 Discipline and 12 Block.',
    cv: 'Migrated 56 test files from Enzyme to React Testing Library.',
    art: 'shield',
  },
]

export const RELIC_BY_ID: Record<string, RelicDef> = Object.fromEntries(RELICS.map((r) => [r.id, r]))
