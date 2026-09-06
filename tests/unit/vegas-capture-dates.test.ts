import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { createStoryPlan, sortStoryPhotosByDate } from '../../src/utils/story-layout-plan.ts';

const directory = new URL('../../src/content/photos/las-vegas-2026/', import.meta.url);
const photos = readdirSync(directory).filter(name => name.endsWith('.md')).map(name => {
  const text = readFileSync(new URL(name, directory), 'utf8');
  const timestamp = text.match(/^date: (.+)$/m)![1];
  return {
    id: name.replace(/\.md$/, ''),
    timestamp,
    data: {
      filename: text.match(/^filename: "(.+)"$/m)![1],
      date: new Date(timestamp),
      featured: /^featured: true$/m.test(text)
    }
  };
});

test('every Vegas photograph retains a full capture timestamp with its recorded timezone', () => {
  assert.equal(photos.length, 169);
  for (const photo of photos) {
    assert.match(photo.timestamp, /^2026-08-\d{2}T\d{2}:\d{2}:\d{2}-07:00$/, photo.id);
    assert.ok(Number.isFinite(photo.data.date.getTime()), photo.id);
  }
});

test('Hoover Dam precedes the evening casino across the camera counter rollover', () => {
  assert.equal(photos.find(p => p.id === '20260807-_AR59782')?.timestamp, '2026-08-07T10:30:19-07:00');
  assert.equal(photos.find(p => p.id === '20260807-_AR50233')?.timestamp, '2026-08-07T19:35:33-07:00');
  const sorted = sortStoryPhotosByDate(photos);
  const plan = createStoryPlan(sorted, { random: () => 0 });
  for (const sequence of [sorted, plan.orderedPhotos]) {
    const ids = sequence.map(p => p.id);
    assert.ok(ids.indexOf('20260807-_AR59782') < ids.indexOf('20260807-_AR50233'));
    assert.ok(ids.indexOf('20260807-_AR59979') < ids.indexOf('20260807-_AR50003'));
  }
});
