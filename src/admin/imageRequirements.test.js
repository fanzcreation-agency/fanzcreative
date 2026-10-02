import assert from 'node:assert/strict';
import test from 'node:test';
import { IMAGE_REQUIREMENTS, gallerySlots, imageRatioError } from './imageRequirements.js';

test('blog editor without gallery data has empty slots', () => {
  assert.deepEqual(gallerySlots(undefined), ['', '', '']);
});

test('gallery slots keep positions when an earlier image is missing', () => {
  assert.deepEqual(gallerySlots('\nsecond-url\nthird-url'), ['', 'second-url', 'third-url']);
});

test('saved gallery arrays remain visible after save and reload', () => {
  assert.deepEqual(gallerySlots(['first-url', 'second-url', 'third-url']), ['first-url', 'second-url', 'third-url']);
  assert.deepEqual(gallerySlots([null, ' second-url ', undefined]), ['', 'second-url', '']);
});

test('upload ratio validation accepts target ratio and rejects a mismatch', () => {
  assert.equal(imageRatioError(IMAGE_REQUIREMENTS.coverUrl, 1600, 900), '');
  assert.match(imageRatioError(IMAGE_REQUIREMENTS.coverUrl, 1200, 800), /16:9/);
});
