// Public CV data, transcribed from ~/Downloads/NguyenDucNhan_Profile_SSOT.md.
// The SSOT is the master record: edit it first, then update this file.
// Privacy: phone, date of birth and street address are deliberately left out.

export interface Role {
  title: string
  period: string
}

export interface Project {
  name: string
  period: string
  role: string
  summary: string
  highlights: string[]
  tech: string[]
}

export interface Job {
  company: string
  location: string
  period: string
  client?: string
  roles: Role[]
  projects: Project[]
}

export const profile = {
  name: 'Nguyen Duc Nhan',
  westernName: 'Nhan Nguyen Duc',
  headline: 'Senior Software Engineer — Frontend / Full-stack (React · Next.js · GraphQL)',
  location: 'Hanoi, Viet Nam',
  email: 'nhannd213@gmail.com',
  linkedin: 'https://www.linkedin.com/in/nhannd213/',
  linkedinLabel: 'linkedin.com/in/nhannd213',
  cvPdf: 'CV_NguyenDucNhan_2026.pdf',
  summary:
    "Senior Software Engineer with 6 years building production web apps in React, Next.js and TypeScript. For 4+ years at NashTech I have worked on DuluxGroup's AU/NZ consumer and trade platforms, across the front end, GraphQL microservices, Firebase and CI/CD. I am the top contributor by commits to the Dulux consumer website (470+ merged pull requests) and a senior engineer on its 2026 Contentful → Optimizely CMS migration. Certified PSM I and AWS Cloud Practitioner, and growing toward SM/PM and technical lead roles.",
  lookingFor:
    'Senior front-end or full-stack roles with end-to-end project ownership, and a path toward SM/PM roles.',
  stats: [
    { value: '6', label: 'years building web apps' },
    { value: '470+', label: 'merged PRs on dulux.com.au' },
    { value: '#1', label: 'committer on the consumer site' },
    { value: '4', label: 'Dulux repos shipped to' },
  ],
}

export const skills: { area: string; items: string[] }[] = [
  {
    area: 'Frontend',
    items: ['React', 'Next.js (Pages & App Router)', 'TypeScript', 'JavaScript', 'Vue', 'Tailwind CSS', 'SCSS', 'Redux', 'MobX', 'Material UI', 'Styled Components', 'Ant Design', 'Bootstrap'],
  },
  { area: 'Mobile', items: ['React Native / Expo', 'Flutter', 'SwiftUI', 'Ionic'] },
  {
    area: 'Backend & data',
    items: ['Node.js', 'NestJS', 'Express', 'Python (Django)', 'Apollo GraphQL & Federation', 'REST', 'Elasticsearch', 'Firebase (Cloud Functions, Realtime DB)', 'SQL Server', 'MySQL', 'PostgreSQL', 'MongoDB', 'DynamoDB'],
  },
  {
    area: 'CMS & integrations',
    items: ['Optimizely CMS & Graph', 'Contentful', 'Umbraco', 'Strapi', 'Azure AD B2C / NextAuth', 'Bynder', 'HubSpot', 'OneTrust', 'Segment', 'Stripe', 'Google Maps'],
  },
  {
    area: 'Quality',
    items: ['Jest', 'React Testing Library', 'Cypress', 'Lighthouse / Core Web Vitals', 'Technical SEO', 'Accessibility (WCAG)'],
  },
  {
    area: 'DevOps, cloud & monitoring',
    items: ['Azure Pipelines', 'GitHub Actions', 'Azure Key Vault', 'Application Insights', 'Google Analytics', 'Netlify', 'AWS', 'Docker (basic)', 'Git'],
  },
  {
    area: 'AI tools',
    items: ['Claude Code', 'Codex', 'Cursor', 'GitHub Copilot', 'Windsurf', 'Antigravity', 'Ollama', 'OpenClaw', 'Orca', 'Pi & Oh My Pi (omp)'],
  },
  { area: 'AI practices', items: ['AI-assisted SDLC workflow', 'Building my own agents and agent harnesses'] },
  { area: 'Ways of working', items: ['Agile / Scrum', 'Jira', 'Confluence', 'Figma', 'Postman'] },
  { area: 'Also familiar', items: ['Angular', 'Java / Spring Boot'] },
]

export const experience: Job[] = [
  {
    company: 'NashTech Vietnam',
    location: 'Hanoi (hybrid)',
    period: 'Aug 2022 – Present',
    client: 'DuluxGroup (Australia & New Zealand)',
    roles: [
      { title: 'Senior Software Engineer', period: 'Jan 2026 – Present' },
      { title: 'Software Engineer', period: 'Aug 2022 – Dec 2025' },
    ],
    projects: [
      {
        name: 'Optimizely CMS Migration',
        period: 'Apr 2026 – Sep 2026',
        role: 'Senior Software Engineer',
        summary:
          'Moved Dulux Consumer Web, Trade Web and Trade App (AU/NZ) from Contentful to Optimizely CMS before the September 2026 Contentful renewal, to cut licence cost and enable personalisation and experimentation.',
        highlights: [
          'Moved the GraphQL Image subgraph to Optimizely Graph: client, typed code generation per environment, repositories, mocks and tests, Bynder images and hierarchical page links.',
          'Fixed Core Web Vitals and Content Security Policy issues on the consumer and trade sites; added Lighthouse audit scripts and an llms.txt route.',
          'Turned off the OneTrust consent popup in CMS preview mode, and fixed Bynder SVG and image-slider issues.',
          'Patched about 18 dependency vulnerabilities (CVEs) in the Firebase backend, including express, jws, qs, uuid and tar.',
          'Wrote detailed designs and task breakdowns, reviewed and refactored code, and mentored new and junior developers.',
        ],
        tech: ['Next.js', 'React', 'Optimizely CMS', 'GraphQL', 'Elasticsearch', 'SAP Commerce', 'Bynder', 'Segment'],
      },
      {
        name: 'GTM Consumer — Dulux Consumer Website',
        period: 'Aug 2022 – Mar 2026',
        role: 'Software Engineer (Aug 2022 – Dec 2025), Senior Software Engineer (from Jan 2026)',
        summary:
          'New development and BAU for dulux.com.au and dulux.co.nz, where customers explore colours and products, read painting guides, and buy samples and paint.',
        highlights: [
          'Top contributor by commits to the website, with 470+ merged pull requests.',
          'Built the new sign-up flow on Azure AD B2C and Firebase: API endpoints with API-key and host checks, secrets from Azure Key Vault, an hourly Cloud Function for data clean-up, and deploy pipelines with gitleaks scanning.',
          'Built an HMAC-signed BIM link that adds colour samples to the cart, plus a test-link generator for UAT.',
          'Delivered the product page redesign, Product Select Wizard, Colour Detail Page (carousel, zoom, Roomvo visualiser), Store Locator filters, and product filtering and sorting on Elasticsearch and GraphQL.',
          'Built HubSpot forms, mega menu hover timing, the case-study image gallery slider, and Most Loved Colours (swatches, add to cart).',
          'Improved SEO and speed: server-side rendering for listing pages, server-rendering and caching fixes (ISR store pages, App Router crashes, hydration errors), schema.org data and sitemap fixes.',
          'Fixed WCAG accessibility issues: heading order, form labels, ARIA roles and link names.',
          'Modernised the codebase: Tailwind v3, Next.js Image and Font, Enzyme to React Testing Library (56 files), and shared Anchor and Button components (109 files).',
          'Wrote Contentful migrations and data scripts and added fields to GraphQL Federation services.',
          'Clarified requirements and wrote acceptance criteria, estimated and broke down tasks, contributed to architecture, and reported risks and status.',
        ],
        tech: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Apollo GraphQL', 'Node.js', 'Elasticsearch', 'Contentful', 'Firebase', 'Azure', 'Netlify', 'Jest'],
      },
    ],
  },
  {
    company: 'NCCPLUS Vietnam',
    location: 'Hanoi',
    period: 'Jan 2021 – Jul 2022',
    roles: [
      { title: 'Scrum Master (full-time)', period: 'Jun 2022 – Jul 2022' },
      { title: 'Frontend Web Developer (part-time)', period: 'Jan 2021 – May 2022' },
    ],
    projects: [
      {
        name: 'Fintech Control Tower',
        period: 'Mar 2021 – Jul 2022',
        role: 'React Developer',
        summary: 'A platform for exploring the FinTech landscape, growth trends and partnerships.',
        highlights: ['Built new modules, refactored earlier code, fixed bugs and updated components to new designs and business rules.'],
        tech: ['React', 'TypeScript', 'Redux', 'Material UI', 'Apollo GraphQL', 'D3.js'],
      },
      {
        name: 'Timesheet',
        period: 'Jan 2021 – Mar 2021',
        role: 'Angular Developer',
        summary: 'An internal app for logging hours and leave.',
        highlights: ['Redesigned Manage Users and Tasks and built a new Manage Projects feature.'],
        tech: ['Angular', 'TypeScript', 'MobX', 'Ant Design'],
      },
    ],
  },
]

export const personalProjects: Project[] = [
  {
    name: 'Rooms For Rent',
    period: 'Oct 2020 – Dec 2020',
    role: 'Software Engineer',
    summary: 'A room-rental web app built with a friend.',
    highlights: ['Designed the layout and built the whole front end.'],
    tech: ['Java', 'Spring Boot', 'JSP', 'MySQL'],
  },
]

export const education = [
  {
    school: 'Posts and Telecommunications Institute of Technology (PTIT)',
    detail: 'Engineer of Information Technology',
    period: '2017 – 2022',
  },
  { school: 'Soc Son High School, Ha Noi', detail: '', period: '2014 – 2017' },
]

export const certifications = [
  { name: 'Gemini Certified Educator', issuer: 'Google for Education', issued: 'Dec 2025' },
  { name: 'Google Certified Educator, Levels 1 & 2', issuer: 'Google for Education', issued: 'Dec 2025' },
  { name: 'Google AI for K12 Educators', issuer: 'Google', issued: 'Dec 2025' },
  { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', issued: 'May 2024' },
  { name: 'AWS Cloud Quest: Cloud Practitioner', issuer: 'Amazon Web Services', issued: 'Apr 2024' },
  { name: 'Professional Scrum Master I (PSM I)', issuer: 'Scrum.org', issued: 'Jul 2022' },
  { name: 'Agile Methodologies skill badge', issuer: 'LinkedIn', issued: '—' },
]

export const languages = 'English (full professional proficiency), Vietnamese (native)'

export const strengths =
  'Clear communicator and team player; organised and disciplined; quick to learn new technologies; comfortable leading tasks and supporting juniors.'
