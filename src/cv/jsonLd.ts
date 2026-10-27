import { profile } from '../content/profile'

/** schema.org Person data for search engines. */
export function personJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    alternateName: profile.westernName,
    jobTitle: 'Senior Software Engineer',
    email: `mailto:${profile.email}`,
    url: siteUrl,
    sameAs: [profile.linkedin],
    address: { '@type': 'PostalAddress', addressLocality: 'Hanoi', addressCountry: 'VN' },
    worksFor: { '@type': 'Organization', name: 'NashTech' },
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'Posts and Telecommunications Institute of Technology' },
    knowsAbout: ['React', 'Next.js', 'TypeScript', 'GraphQL', 'Node.js', 'Elasticsearch', 'Optimizely CMS', 'Scrum'],
  }
}
