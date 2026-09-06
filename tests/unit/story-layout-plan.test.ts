import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createStoryPlan,
  sortStoryPhotosByDate
} from '../../src/utils/story-layout-plan.ts';

type TestPhoto = {
  id: string;
  data: { featured: boolean };
};

const photo = (id: string, featured = false): TestPhoto => ({
  id,
  data: { featured }
});

test('featured anchors borrow the nearest supporting photos instead of appearing back to back', () => {
  const plan = createStoryPlan([
    photo('feature-1', true),
    photo('feature-2', true),
    photo('support-1'),
    photo('support-2'),
    photo('support-3')
  ], { random: () => 0 });

  assert.deepEqual(
    plan.orderedPhotos.map(item => item.id),
    ['feature-1', 'support-1', 'support-2', 'feature-2', 'support-3']
  );
  assert.deepEqual(
    plan.rows.map(row => ({ kind: row.kind, ids: row.photos.map(item => item.id) })),
    [
      { kind: 'anchor', ids: ['feature-1'] },
      { kind: 'support', ids: ['support-1', 'support-2'] },
      { kind: 'anchor', ids: ['feature-2'] },
      { kind: 'support', ids: ['support-3'] }
    ]
  );
});

test('featured anchors near the end borrow earlier supports instead of being demoted', () => {
  const plan = createStoryPlan([
    photo('support-1'),
    photo('support-2'),
    photo('support-3'),
    photo('support-4'),
    photo('feature-1', true),
    photo('feature-2', true)
  ], { random: () => 0 });

  assert.deepEqual(
    plan.orderedPhotos.map(item => item.id),
    ['support-1', 'support-2', 'feature-1', 'support-3', 'support-4', 'feature-2']
  );
  assert.deepEqual(
    plan.rows.map(row => ({ kind: row.kind, ids: row.photos.map(item => item.id) })),
    [
      { kind: 'support', ids: ['support-1', 'support-2'] },
      { kind: 'anchor', ids: ['feature-1'] },
      { kind: 'support', ids: ['support-3', 'support-4'] },
      { kind: 'anchor', ids: ['feature-2'] }
    ]
  );
});

test('supporting runs vary their row rhythm without changing photo order or creating a solo row', () => {
  const photos = [
    photo('support-1'),
    photo('support-2'),
    photo('support-3'),
    photo('support-4'),
    photo('support-5')
  ];

  const firstPlan = createStoryPlan(photos, { random: () => 0 });
  const secondPlan = createStoryPlan(photos, { random: () => 0.999 });

  assert.deepEqual(firstPlan.rows.map(row => row.photos.length), [2, 3]);
  assert.deepEqual(secondPlan.rows.map(row => row.photos.length), [3, 2]);
  assert.deepEqual(
    secondPlan.orderedPhotos.map(item => item.id),
    photos.map(item => item.id)
  );
});

test('equal-date stories follow filename order independently of input order and album folder', () => {
  const photos = [
    { id: 'ten', data: { date: new Date('2026-08-01'), filename: 'a/DSC10.jpg' } },
    { id: 'next-day', data: { date: new Date('2026-08-02'), filename: 'a/DSC1.jpg' } },
    { id: 'two', data: { date: new Date('2026-08-01'), filename: 'z/DSC2.jpg' } }
  ];
  assert.deepEqual(sortStoryPhotosByDate(photos).map(p => p.id), ['two', 'ten', 'next-day']);
  assert.deepEqual(sortStoryPhotosByDate(photos, 'desc').map(p => p.id), ['next-day', 'ten', 'two']);
  assert.deepEqual(photos.map(p => p.id), ['ten', 'next-day', 'two']);
});

test('story source order follows date instead of importance score', () => {
  const photos = [
    { id: 'late-important', data: { featured: true, order_score: 25, date: new Date('2025-01-03') } },
    { id: 'early-support', data: { featured: false, order_score: 0, date: new Date('2025-01-01') } },
    { id: 'middle-support', data: { featured: false, order_score: 0, date: new Date('2025-01-02') } }
  ];

  assert.deepEqual(
    sortStoryPhotosByDate(photos, 'asc').map(item => item.id),
    ['early-support', 'middle-support', 'late-important']
  );
});
