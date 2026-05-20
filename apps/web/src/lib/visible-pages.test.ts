import { describe, it, expect } from 'vitest'
import type { ContentPage } from '../content/registry'
import { filterVisiblePages, findVisiblePage } from './visible-pages'

function page(slug: string, draft?: boolean): ContentPage {
  return {
    slug,
    url: slug,
    body: '',
    frontmatter: {
      title: slug,
      categories: [],
      ...(draft === undefined ? {} : { draft }),
    },
  }
}

const PAGES: Array<ContentPage> = [
  page('public-one'),
  page('public-two', false),
  page('hidden-one', true),
]

describe('filterVisiblePages', () => {
  it('excludes drafts for the public', () => {
    const visible = filterVisiblePages(PAGES, false)
    expect(visible.map((p) => p.slug)).toEqual(['public-one', 'public-two'])
  })

  it('includes drafts in preview mode', () => {
    const visible = filterVisiblePages(PAGES, true)
    expect(visible.map((p) => p.slug)).toEqual([
      'public-one',
      'public-two',
      'hidden-one',
    ])
  })

  it('treats absent draft field as published', () => {
    const visible = filterVisiblePages([page('no-field')], false)
    expect(visible).toHaveLength(1)
  })
})

describe('findVisiblePage', () => {
  it('returns a published page', () => {
    expect(findVisiblePage(PAGES, 'public-one', false)?.slug).toBe('public-one')
  })

  it('returns undefined for a draft to the public', () => {
    expect(findVisiblePage(PAGES, 'hidden-one', false)).toBeUndefined()
  })

  it('returns a draft in preview mode', () => {
    expect(findVisiblePage(PAGES, 'hidden-one', true)?.slug).toBe('hidden-one')
  })

  it('returns undefined for an unknown url', () => {
    expect(findVisiblePage(PAGES, 'nope', true)).toBeUndefined()
  })
})
