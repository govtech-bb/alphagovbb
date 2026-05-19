import type { MdaEntry } from '../lib/mda-types'
import type { MinistryPageProps } from '../components/MinistryPage'
import { MINISTRIES, type Ministry } from './ministries'
import { DEPARTMENTS } from './departments'
import { STATE_BODIES } from './state-bodies'

export type OrgKind = 'ministry' | 'department' | 'state-body'

const MINISTRY_BY_SLUG = new Map(MINISTRIES.map((m) => [m.slug, m]))
const DEPARTMENT_BY_SLUG = new Map(DEPARTMENTS.map((d) => [d.slug, d]))
const STATE_BODY_BY_SLUG = new Map(STATE_BODIES.map((s) => [s.slug, s]))

export const ORG_PREFIXES: ReadonlyArray<readonly [string, OrgKind]> = [
  ['ministries/', 'ministry'],
  ['departments/', 'department'],
  ['state-bodies/', 'state-body'],
]

export const orgHref = (slug: string): string =>
  `/government/organisations/${slug}`

/** Strips a leading slash so callers can pass either a slug or a pathname. */
export function resolveOrgPath(
  pathOrSlug: string,
): { kind: OrgKind; orgSlug: string } | null {
  const normalised = pathOrSlug.replace(/^\/+|\/+$/g, '')
  for (const [prefix, kind] of ORG_PREFIXES) {
    if (normalised.startsWith(prefix)) {
      return { kind, orgSlug: normalised.slice(prefix.length) }
    }
  }
  return null
}

function getEntry(kind: OrgKind, slug: string): Ministry | MdaEntry | undefined {
  if (kind === 'ministry') return MINISTRY_BY_SLUG.get(slug)
  if (kind === 'department') return DEPARTMENT_BY_SLUG.get(slug)
  return STATE_BODY_BY_SLUG.get(slug)
}

/** Cheap check that avoids allocating a full MinistryPageProps. */
export function hasMigratedSource(kind: OrgKind, slug: string): boolean {
  return Boolean(getEntry(kind, slug)?.originalSource)
}

function ministryToProps(m: Ministry): MinistryPageProps {
  return {
    title: m.name,
    featured: m.featured,
    services: m.services,
    onlineServices: m.onlineServices,
    minister: m.minister,
    leadershipLabel: 'Our Minister',
    contact: m.contact,
    associatedDepartments: m.associatedDepartments,
    originalSource: m.originalSource,
  }
}

function mdaToProps(
  entry: MdaEntry,
  leadershipLabel: string,
): MinistryPageProps {
  return {
    title: entry.name,
    minister: entry.head,
    leadershipLabel,
    contact: entry.contact,
    originalSource: entry.originalSource,
  }
}

/**
 * Returns fully-resolved MinistryPageProps. When the slug has no structured
 * entry, the fallback supplies title + originalSource so the page still renders
 * the hero shell around the page's markdown body.
 */
export function resolveOrgProps(
  kind: OrgKind,
  slug: string,
  fallback: { title: string; originalSource?: string },
): MinistryPageProps {
  const entry = getEntry(kind, slug)
  if (!entry) return fallback
  if (kind === 'ministry') return ministryToProps(entry as Ministry)
  return mdaToProps(
    entry as MdaEntry,
    kind === 'department' ? 'Head of Department' : 'Head',
  )
}
