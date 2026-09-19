// Release Timeline Automator — stdlib test suite (node:test).
// Run: node --test tests/run-tests.js
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const R = require('../docs/timeline.js');

test('date math: month/year boundary crossing', () => {
  assert.equal(R.fmtISO(R.addDays(R.parseISODate('2026-01-01'), -42)), '2025-11-20');
  assert.equal(R.fmtISO(R.addDays(R.parseISODate('2026-01-01'), 49)), '2026-02-19');
});

test('date math: leap year (Feb 29 exists in 2028)', () => {
  // release 2028-03-01 minus 42 days must cross Feb 29 2028
  assert.equal(R.fmtISO(R.addDays(R.parseISODate('2028-03-01'), -42)), '2028-01-19');
  assert.equal(R.fmtISO(R.addDays(R.parseISODate('2028-03-05'), -6)), '2028-02-28');
  assert.equal(R.weekdayName(R.parseISODate('2028-02-29')), 'TUE');
});

test('date math: invalid dates rejected', () => {
  assert.throws(() => R.parseISODate('2026-02-30'), /invalid/);
  assert.throws(() => R.parseISODate('not-a-date'), /YYYY-MM-DD/);
});

test('weekend shift: business tasks move to preceding Friday', () => {
  // 2026-10-24 is a Saturday; T-42 raw = 2026-09-12 (Saturday)
  const tl = R.generate('2026-10-24', { shiftWeekends: true });
  const master = tl.items.find(i => i.title === 'Lock final audio master');
  assert.equal(master.rawDate, '2026-09-12');
  assert.equal(master.date, '2026-09-11');
  assert.equal(master.weekday, 'FRI');
  assert.equal(master.shifted, true);
  // non-business content task on same raw date is NOT shifted
  const tl2 = R.generate('2026-10-31', { shiftWeekends: true }); // T-42 raw = 2026-09-19 Sat
  const content = tl2.items.find(i => i.title === 'Lock final audio master');
  assert.equal(content.shifted, true);
});

test('weekend shift: disabled toggle keeps raw dates', () => {
  const tl = R.generate('2026-10-24', { shiftWeekends: false });
  const master = tl.items.find(i => i.title === 'Lock final audio master');
  assert.equal(master.date, '2026-09-12');
  assert.equal(master.shifted, false);
});

test('all six phases present with spec ranges', () => {
  const tl = R.generate('2026-12-11'); // Friday
  const byPhase = {};
  tl.items.forEach(i => { byPhase[i.phase] = (byPhase[i.phase] || 0) + 1; });
  const ids = R.PHASES.map(p => p.id);
  assert.deepEqual(Object.keys(byPhase).sort(), ids.sort());
  // release-day content assets within 3–5 spec
  const releaseContent = tl.items.filter(i => i.phase === 'release' && i.platforms.length > 0);
  assert.ok(releaseContent.length >= 3 && releaseContent.length <= 5,
    'release-day assets = ' + releaseContent.length);
  // post-release micro-assets within 20–30 spec
  const micro = tl.items.filter(i => i.phase === 'waterfall' && /^Micro-asset/.test(i.title));
  assert.ok(micro.length >= 20 && micro.length <= 30, 'micro-assets = ' + micro.length);
});

test('deterministic: same input → identical output', () => {
  const a = JSON.stringify(R.generate('2027-02-05'));
  const b = JSON.stringify(R.generate('2027-02-05'));
  assert.equal(a, b);
});

test('peak-hour windows wired to content tasks', () => {
  const tl = R.generate('2026-12-11');
  const withTiktok = tl.items.filter(i => i.platforms.includes('tiktok'));
  assert.ok(withTiktok.length > 10, 'tiktok-wired tasks = ' + withTiktok.length);
  const txt = R.peakText(['tiktok']).join(' ');
  assert.ok(/18:00/.test(txt) && /Metricool/.test(txt));
  // every content task references only known platforms
  tl.items.forEach(i => i.platforms.forEach(p => assert.ok(R.WINDOWS[p], 'unknown platform ' + p)));
});

test('friday-release detection', () => {
  assert.equal(R.generate('2026-12-11').isFridayRelease, true);  // Friday
  assert.equal(R.generate('2026-12-12').isFridayRelease, false); // Saturday
});

test('.ics validity', () => {
  const tl = R.generate('2026-12-11');
  const ics = R.toICS(tl, { title: 'Test Release' });
  const lines = ics.split('\r\n');
  assert.equal(lines[0], 'BEGIN:VCALENDAR');
  assert.equal(lines[lines.length - 2], 'END:VCALENDAR');
  const events = ics.match(/BEGIN:VEVENT/g).length;
  assert.equal(events, tl.items.length);
  assert.ok(ics.includes('VERSION:2.0') && ics.includes('PRODID:'));
  assert.ok(/DTSTAMP:\d{8}T\d{6}Z/.test(ics), 'DTSTAMP present');
  // every event has UID, DTSTART, DTEND, SUMMARY
  const bodies = ics.split('BEGIN:VEVENT').slice(1);
  bodies.forEach(b => {
    assert.ok(/UID:[^\r\n]+/.test(b), 'UID');
    assert.ok(/DTSTART;VALUE=DATE:\d{8}/.test(b), 'DTSTART');
    assert.ok(/DTEND;VALUE=DATE:\d{8}/.test(b), 'DTEND');
    assert.ok(/SUMMARY:[^\r\n]+/.test(b), 'SUMMARY');
  });
  // folding: no physical line over 75 chars; continuation lines start with space
  lines.forEach(l => assert.ok(l.length <= 75, 'line too long: ' + l.length));
});

test('text export contains all phases and task dates', () => {
  const tl = R.generate('2026-12-11');
  const txt = R.toText(tl, { title: 'Test Release' });
  R.PHASES.forEach(p => assert.ok(txt.includes(p.name), 'missing phase ' + p.id));
  assert.ok(txt.includes('Release date:'));
  assert.ok(txt.includes(R.RESEARCH_NOTE));
  assert.ok(txt.length > 5000);
});
