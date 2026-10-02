import assert from 'node:assert/strict';
import test from 'node:test';
import { filterOptions, filterProjects, homeProjects, latestContent, orderedProjects, PAGE_SIZE, projectServices } from './content-layout.js';

const projects = Array.from({ length: 100 }, (_, index) => ({
  slug: `project-${index}`, featured: index < 6, sortOrder: index === 0 ? 10 : index,
  publishedAt: { seconds: index + 1 }, industry: index % 2 ? 'Fashion' : 'Beauty',
  services: index % 3 ? ['Design'] : ['Development'], projectType: 'Website',
}));

test('100 articles remain latest first and 12-item batches include every article once', () => {
  const articles = latestContent(projects);
  assert.equal(articles[0].slug, 'project-99');
  assert.equal(articles.slice(0, PAGE_SIZE).length, 12);
  const pages = [];
  for (let index = 0; index < articles.length; index += PAGE_SIZE) pages.push(...articles.slice(index, index + PAGE_SIZE));
  assert.equal(pages.length, 100);
  assert.equal(new Set(pages.map((item) => item.slug)).size, 100);
  assert.equal(projects[0].slug, 'project-0');
});

test('featured projects respect custom order and home is limited to four selected items', () => {
  assert.deepEqual(homeProjects(projects).map((item) => item.slug), ['project-1', 'project-2', 'project-3', 'project-4']);
  assert.equal(orderedProjects(projects)[6].featured, false);
  assert.deepEqual(homeProjects(projects.map((item) => ({ ...item, featured: false }))), []);
  assert.equal(homeProjects(projects.slice(0, 2)).length, 2);
});

test('filters combine industry, service and type before pagination', () => {
  const matches = filterProjects(projects, { industry: ' beauty ', service: 'Development', projectType: 'website' });
  assert.equal(matches.length, 17);
  assert.ok(matches.every((item) => item.industry === 'Beauty' && item.services.includes('Development')));
  assert.equal(matches.slice(0, PAGE_SIZE).length, 12);
  assert.deepEqual(filterProjects(projects, { industry: 'Unknown' }), []);
});

test('legacy projects keep selection and derive services from existing deliverables', () => {
  assert.equal(homeProjects([{ slug: 'legacy', deliverables: 'UI/UX Design, E-commerce\nStorefront', industry: 'Beauty' }]).length, 1);
  assert.deepEqual(projectServices({ deliverables: 'UI/UX Design, E-commerce\nStorefront' }), ['UI/UX Design', 'E-commerce Storefront']);
  assert.deepEqual(filterOptions([' Beauty ', 'beauty', '', 'Fashion']), ['Beauty', 'Fashion']);
});

test('same-order projects use publication date and local fallback dates sort correctly', () => {
  const items = [{ slug: 'old', featured: true, publishedAt: { _seconds: 1 } }, { slug: 'new', featured: true, publishedAt: { seconds: 2 } }];
  assert.deepEqual(orderedProjects(items).map((item) => item.slug), ['new', 'old']);
  assert.equal(latestContent([{ slug: 'fallback', date: 'Sep 30, 2026' }, { slug: 'new', publishedAt: { seconds: 1790899200 } }])[0].slug, 'new');
});
