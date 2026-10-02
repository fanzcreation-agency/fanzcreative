import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { buildDemoRecords, demoTargets, ownsDemoRecord } from './layout-demo.mjs';

const media = JSON.parse(await readFile(new URL('../src/cloudinary-media.json', import.meta.url), 'utf8'));

test('demo contains 20 published blogs and 20 valid projects with Cloudinary images', () => {
  const records = buildDemoRecords(media);
  assert.equal(records.length, 40);
  assert.equal(new Set(records.map((record) => `${record.type}/${record.slug}`)).size, 40);
  assert.equal(records.filter((record) => record.type === 'posts').length, 20);
  const projects = records.filter((record) => record.type === 'projects');
  assert.equal(projects.length, 20);
  assert.equal(projects.filter((record) => record.data.featured).length, 4);
  for (const record of records) {
    assert.equal(record.data.status, 'published');
    assert.match(record.data.coverUrl, /^https:\/\/res\.cloudinary\.com\//);
    assert.equal(ownsDemoRecord(record.type, record.slug, record.data), true);
    if (record.type === 'projects') assert.equal(record.data.galleryUrls.length, 3);
  }
  assert.equal(new Set(projects.map((record) => record.data.industry)).size, 4);
  assert.equal(new Set(projects.map((record) => record.data.projectType)).size, 3);
});

test('cleanup requires exact ownership and an expected collection and document ID', () => {
  const { type, slug, data } = buildDemoRecords(media)[0];
  assert.equal(ownsDemoRecord(type, slug, {}), false);
  assert.equal(ownsDemoRecord(type, slug, { ...data, dummyOwner: 'another-tool' }), false);
  assert.equal(ownsDemoRecord(type, slug, { ...data, dummyBatch: 'another-batch' }), false);
  assert.equal(ownsDemoRecord('projects', slug, data), false);
  assert.equal(ownsDemoRecord(type, 'real-blog', data), false);
  assert.equal(ownsDemoRecord(type, 'dummy-layout-v1-blog-21', data), false);
  assert.equal(demoTargets().length, 40);
});

test('missing media fails before any records can be uploaded', () => {
  assert.throws(() => buildDemoRecords({}), /Missing Cloudinary image/);
});
