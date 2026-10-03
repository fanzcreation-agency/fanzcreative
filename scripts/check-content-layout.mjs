import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '../server/firebase-admin.js';
import { prepareContent } from '../shared/content.js';
import { signInAdminTest } from './admin-test-login.mjs';

const base = process.env.LAYOUT_TEST_URL || 'http://127.0.0.1:5180';
const email = process.argv[2];
const media = JSON.parse(await readFile('src/cloudinary-media.json', 'utf8'));
const posts = Array.from({ length: 100 }, (_, index) => ({
  slug: `layout-blog-${index}`, title: `Layout article ${index}`, excerpt: 'Design and development insights.',
  category: 'Design', body: 'Article content.', coverUrl: media['/assets/images/blog/blog_ui_ux.webp'].url,
  status: 'published', publishedAt: { seconds: 1800000000 + index },
}));
const projects = Array.from({ length: 100 }, (_, index) => ({
  slug: `layout-project-${index}`, title: `Layout project ${index}`, summary: 'A considered digital experience.',
  details: 'Project details.', industry: index % 2 ? 'Fashion' : 'Beauty',
  services: index % 3 ? ['Design'] : ['Development'], projectType: 'Website', deliverables: ['Design', 'Development'],
  featured: index < 6, sortOrder: index === 0 ? 10 : index, status: 'published',
  coverUrl: media['/assets/images/section/cora-beauty-ecommerce-mockup.webp'].url,
  galleryUrls: [1, 2, 3].map((index) => media[`/assets/images/section/cora-beauty-${index}.webp`].url), publishedAt: { seconds: 1800000000 + index },
}));
const content = { posts, projects };
const builtInPosts = ['future-of-ui-ux', 'ai-automation-game-changer', 'scalable-web-platforms', 'brand-identity-that-scales', 'website-performance-design', 'motion-design-with-purpose'];
const builtInProjects = ['cora-beauty-skincare', 'revolution-fashion-store', 'marble-fashion-ecommerce', 'mojave-clothing-store'];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
const errors = [];
await context.route('**/api/content?**', async (route) => {
  const type = new URL(route.request().url()).searchParams.get('type');
  await route.fulfill({ json: { items: content[type], managedSlugs: [...content[type].map((item) => item.slug), ...(type === 'posts' ? builtInPosts : builtInProjects)] } });
});
await context.route('**/api/admin-content', async (route) => {
  if (route.request().method() === 'GET') return route.fulfill({ json: { content } });
  const { type, slug, data } = route.request().postDataJSON();
  try {
    const prepared = prepareContent(type, data);
    const index = content[type].findIndex((item) => item.slug === slug);
    const item = { ...content[type][index], ...prepared, slug };
    content[type][index] = item;
    return route.fulfill({ json: { item } });
  } catch (error) {
    return route.fulfill({ status: 400, json: { error: error.message } });
  }
});
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(error.message));
const more = () => page.getByRole('button', { name: 'Load More', exact: true });
const assertNoOverflow = async () => assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth + 1), false);
const screenshot = async (path) => {
  await page.waitForTimeout(1000);
  await page.screenshot({ path, animations: 'disabled' });
};
try {
  await mkdir('scratch', { recursive: true });
  await page.goto(`${base}/blog`);
  await expect(page.locator('.article-blog')).toHaveCount(12);
  assert.equal(await page.locator('.article-blog h6').first().innerText(), 'Layout article 99');
  assert.equal(await page.locator('.article-blog img').count(), 12);
  await more().click();
  await expect(page.locator('.article-blog')).toHaveCount(24);
  await page.locator('.article-blog').nth(12).scrollIntoViewIfNeeded();
  await expect(page.locator('.article-blog').nth(12)).toHaveClass(/is-visible/);
  while (await more().count()) await more().click();
  await expect(page.locator('.article-blog')).toHaveCount(100);
  await expect(more()).toHaveCount(0);
  assert.equal(new Set(await page.locator('.article-blog h6 a').allTextContents()).size, 100);
  console.log('PASS 100 blogs: latest 12, 12 more per click, all 100 once, new cards visible');
  await page.goto(`${base}/blog`);
  await page.locator('.section-blog').scrollIntoViewIfNeeded();
  await screenshot('scratch/content-blog-desktop.png');

  await page.goto(`${base}/works`);
  await expect(page.locator('.featured-works-item')).toHaveCount(12);
  await page.getByRole('button', { name: 'Grid View' }).click();
  await more().click();
  await expect(page.locator('.featured-works-item')).toHaveCount(24);
  await page.getByLabel('Industry', { exact: true }).selectOption('Beauty');
  await expect(page.locator('.featured-works-item')).toHaveCount(12);
  await page.getByLabel('Service', { exact: true }).selectOption('Development');
  await expect(page.getByRole('status').filter({ hasText: '12 of 17 projects' })).toHaveCount(1);
  await more().click();
  await expect(page.locator('.featured-works-item')).toHaveCount(17);
  await page.getByLabel('Type', { exact: true }).selectOption('Website');
  await expect(page.locator('.featured-works-item')).toHaveCount(12);
  await page.getByLabel('Industry', { exact: true }).selectOption('');
  await page.getByLabel('Service', { exact: true }).selectOption('');
  await page.getByLabel('Type', { exact: true }).selectOption('');
  await page.locator('.content-filters').scrollIntoViewIfNeeded();
  await assertNoOverflow();
  assert.equal(await page.locator('.content-filter').evaluateAll((labels) => labels.every((label) => label.querySelector('select').getBoundingClientRect().right <= label.getBoundingClientRect().right + 1)), true);
  await screenshot('scratch/content-projects-desktop.png');
  console.log('PASS projects: pagination, combined filters, reset to 12, grid/list controls');

  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.locator('.content-filters').scrollIntoViewIfNeeded();
    await assertNoOverflow();
    await screenshot(`scratch/content-projects-${width}.png`);
    await page.goto(`${base}/blog`);
    await expect(page.locator('.article-blog')).toHaveCount(12);
    await page.locator('.section-blog').scrollIntoViewIfNeeded();
    await assertNoOverflow();
    await screenshot(`scratch/content-blog-${width}.png`);
    await page.goto(`${base}/works`);
    await expect(page.locator('.featured-works-item')).toHaveCount(12);
  }
  console.log('PASS mobile/tablet layouts without horizontal overflow');

  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto(base);
  await expect(page.locator('.sticky-works-card')).toHaveCount(4);
  await expect(page.locator('.rw-card-wrapper')).toHaveCount(4);
  const homeSlugs = await page.locator('.sticky-works-card .image').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  assert.deepEqual(homeSlugs, [1, 2, 3, 4].map((index) => `/project/layout-project-${index}`));
  console.log('PASS both home sections use the same four selected projects in custom order');

  if (email) {
    process.loadEnvFile('.env.local');
    const auth = getAuth(getAdminApp());
    const user = await auth.getUserByEmail(email);
    assert.equal(user.customClaims?.admin, true);
    const token = await auth.createCustomToken(user.uid);
    await page.goto(`${base}/admin`);
    await expect(page.getByRole('heading', { name: 'Admin sign in' })).toBeVisible();
    await signInAdminTest(page, { base, email, customToken: token });
    await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
    await page.locator('.admin-sidebar').getByRole('button', { name: /^Projects/ }).click();
    await expect(page.locator('.admin-table tbody tr')).toHaveCount(20);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Page 2 of 5');
    await page.getByRole('textbox', { name: 'Search projects' }).fill('Layout project 0');
    await expect(page.locator('.admin-table tbody tr')).toHaveCount(1);
    await page.getByRole('button', { name: 'Layout project 0', exact: true }).click();
    await expect(page.getByLabel('Featured on home')).toBeChecked();
    await page.getByLabel('Featured on home').uncheck();
    await page.getByLabel('Sort order', { exact: true }).fill('7');
    await page.getByLabel('Services', { exact: true }).fill('Branding, Design');
    await page.getByLabel('Project type', { exact: true }).fill('Brand identity');
    await page.getByRole('button', { name: 'Update', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Published successfully.');
    await page.reload();
    await expect(page.getByLabel('Featured on home')).not.toBeChecked();
    await expect(page.getByLabel('Sort order', { exact: true })).toHaveValue('7');
    await expect(page.getByLabel('Services', { exact: true })).toHaveValue('Branding, Design');
    await expect(page.getByLabel('Project type', { exact: true })).toHaveValue('Brand identity');
    await page.getByLabel('Featured on home').check();
    await page.getByLabel('Sort order', { exact: true }).fill('0');
    await page.getByRole('button', { name: 'Update', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Published successfully.');
    await page.goto(base);
    await expect(page.locator('.sticky-works-card .image').first()).toHaveAttribute('href', '/project/layout-project-0');
    await expect(page.locator('.rw-card-image-link').first()).toHaveAttribute('href', '/project/layout-project-0');
    await page.goto(`${base}/admin/projects/layout-project-0`);
    await expect(page.getByLabel('Featured on home')).toBeChecked();
    await page.getByLabel('Featured on home').uncheck();
    await page.getByRole('button', { name: 'Update', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Published successfully.');
    await screenshot('scratch/content-admin-desktop.png');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.admin-placement').scrollIntoViewIfNeeded();
    await assertNoOverflow();
    await screenshot('scratch/content-admin-mobile.png');
    await page.goto(`${base}/works`);
    await expect(page.getByLabel('Type', { exact: true }).locator('option', { hasText: 'Brand identity' })).toHaveCount(1);
    await page.getByLabel('Type', { exact: true }).selectOption('Brand identity');
    await expect(page.locator('.featured-works-item')).toHaveCount(1);
    await expect(more()).toHaveCount(0);
    await page.getByLabel('Industry', { exact: true }).selectOption('Fashion');
    await expect(page.getByRole('status')).toHaveText('No projects match these filters.');
    await page.goto(base);
    await expect(page.locator('.sticky-works-card')).toHaveCount(4);
    assert.equal(await page.locator('.sticky-works-card .image[href="/project/layout-project-0"]').count(), 0);
    console.log('PASS admin: 20/page, search reset, placement/taxonomy save and reload, public filters updated');
  }
  projects.forEach((project) => { project.featured = false; });
  await page.goto(base);
  await expect(page.locator('.sticky-works-section')).toHaveCount(0);
  await expect(page.locator('.recent-works-section')).toHaveCount(0);
  console.log('PASS no featured selections leaves no empty home project sections');
  assert.deepEqual(errors, []);
  console.log('PASS no browser runtime errors; all test content stayed in mocked APIs');
} finally {
  await browser.close();
}
