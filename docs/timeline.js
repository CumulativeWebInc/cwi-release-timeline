/* Release Timeline Automator — engine (zero deps, deterministic, no network).
 * Shared by docs/app.js (browser) and tests/run-tests.js (node).
 * Timing guidance: 2026 platform research, compiled 2026-09-18 (see WINDOWS notes).
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.ReleaseTimeline = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------- date math (UTC, no DST surprises) ----------
  function parseISODate(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
    if (!m) throw new Error('date must be YYYY-MM-DD, got: ' + s);
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    if (isNaN(d.getTime()) || fmtISO(d) !== String(s).trim()) throw new Error('invalid calendar date: ' + s);
    return d;
  }
  function fmtISO(d) { return d.toISOString().slice(0, 10); }
  function addDays(d, n) { return new Date(d.getTime() + n * 86400000); }
  function weekdayName(d) { return ['SUN','MON','TUE','WED','THU','FRI','SAT'][d.getUTCDay()]; }
  function prettyDate(d) {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return days[d.getUTCDay()] + ', ' + months[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear();
  }

  // ---------- peak-hour windows (2026 research, compiled 2026-09-18) ----------
  // Every window carries its source + confidence — shown to the user verbatim.
  const WINDOWS = {
    tiktok:          { platform: 'TikTok',            windows: ['18:00–21:00 ET daily (high — Metricool 2026, 2.3M posts)', 'Sun 20:00–21:00 (med — NealSchaffer 2026 synthesis)'] },
    instagram_reels: { platform: 'Instagram Reels',  windows: ['Tue–Thu 18:00–21:00 ET (high — Metricool 2026)', 'Tue–Thu 08:00–12:00 ET (med — Sendible/Iconosquare 2026)'] },
    instagram_feed:  { platform: 'Instagram feed',   windows: ['Mon/Tue/Wed/Fri/Sat/Sun 18:00–23:00 ET (high — Buffer 9.6M + Metricool 24.3M posts)', 'Thu 07:00–09:00 ET (high — Buffer 2026)', 'Wed 12:00–13:00 ET (high — Buffer 2026)'] },
    youtube_shorts:  { platform: 'YouTube Shorts',   windows: ['Weekdays 12:00–15:00 ET (med — RecurPost 2026)', 'Weekdays 19:00–22:00 ET (med — RecurPost 2026)'] },
    youtube_long:    { platform: 'YouTube long-form',windows: ['Weekdays 14:00–16:00 ET, upload 1–2h before peak (med — PostLinkApp/PostEverywhere 2026)'] },
    threads:         { platform: 'Threads',          windows: ['Weekday mornings 07:00–09:00 ET (high — Buffer 2026, 2.5M posts)', 'Tue–Thu 12:00–13:00 ET (med — Replia 2026)'] },
    x:               { platform: 'X (Twitter)',      windows: ['Tue–Thu 08:00–11:00 ET (high — Buffer 8.7M + OpenTweet 50K)', 'Tue–Thu 12:00–14:00 ET for media-rich posts (med — OpenTweet 2026)'] },
    facebook:        { platform: 'Facebook Pages',   windows: ['Tue–Wed 12:00–20:00 ET (high — Sendible 2026)', 'Weekdays 09:00–15:00 ET (med — SocialPilot 2026)'] },
    bluesky:         { platform: 'Bluesky',          windows: ['Tue–Thu 09:00–13:00 local (low — RecurPost 2026 agency guide, heuristic)'] }
  };
  const RESEARCH_NOTE = 'Timing guidance: 2026 platform research compiled 2026-09-18. Confidence varies per platform — tune against your own analytics. Hours in US Eastern (ET).';

  // ---------- phase/task spec ----------
  // offset: days relative to release day (0 = release, negative = after).
  // business: true → weekend dates shift to the preceding Friday (distributors, editors, press work business hours).
  function T(phase, offset, title, detail, platforms, business) {
    return { phase, offset, title, detail, platforms: platforms || [], business: !!business };
  }

  const PHASES = [
    { id: 'freeze',   name: 'T-6 weeks — Distributor freeze', range: '42–38 days out' },
    { id: 'pitch',    name: 'T-4 weeks — Editorial pitch',   range: '28–25 days out' },
    { id: 'tease',    name: 'T-2 weeks — Tease',              range: '14–7 days out' },
    { id: 'push',     name: 'T-1 week — Push',                range: '7–1 days out' },
    { id: 'release',  name: 'Release day',                   range: 'day 0' },
    { id: 'waterfall',name: 'Post-release waterfall',         range: '+1 to +28 days' }
  ];

  const TASKS = [
    // ---- T-6wk: distributor freeze ----
    T('freeze', -42, 'Lock final audio master', 'Final WAV (44.1 kHz / 16-bit minimum) approved by artist + engineer. No mix changes after this point.', [], true),
    T('freeze', -42, 'Claim ISRC & register barcode/UPC', 'ISRC per track, UPC per release. Register splits: songwriters, publishers, producers — shares agreed in writing.', [], true),
    T('freeze', -42, 'Freeze metadata', 'Title, artist + featured credits, version spelling (e.g. "sped up"), label name, copyright ℗/© lines. Dashboard values are authoritative over any public source.', [], true),
    T('freeze', -41, 'Finalize artwork', '3000×3000 px JPEG/PNG, sharp text, no pixelation. Check thumbnail legibility at 60 px.', [], true),
    T('freeze', -41, 'Lyrics + rights lock', 'Full lyrics filed with distributor; samples cleared in writing; cover licenses filed if applicable.', [], true),
    T('freeze', -40, 'Confirm territories & delivery', 'Release territories set, price tier set, delivery accepted by distributor. Keep the acceptance receipt.', [], true),
    T('freeze', -38, 'Pre-save / presell live', 'Pre-save (Spotify/Apple) and presell links live once distributor delivery is confirmed. Link goes in bio everywhere.', ['threads','x','instagram_feed'], true),

    // ---- T-4wk: editorial pitch ----
    T('pitch', -28, 'Spotify for Artists editorial pitch submitted', 'Platform rule: pitch at least 7 days before release — submit now for a 3-week buffer. Include: genre, moods, instruments, BPM, language, similar artists, promo plan.', [], true),
    T('pitch', -28, 'Playlist curator shortlist researched', '20–40 curator contacts (independent + algorithmic-feeder lists). Log contact, list, follower count, last-updated date.', [], true),
    T('pitch', -27, 'One-sheet / EPK built', 'Bio, artwork, ISRC, lyrics, sonic descriptors (BPM, key, moods, scene use-cases), credits, rights holder contact. Machine-readable copy + PDF.', [], true),
    T('pitch', -27, 'Premiere partner + radio servicing', 'Pitch premiere partner; service college/community + specialist shows with clean + explicit versions, intro/outro liners.', [], true),
    T('pitch', -26, 'Press list + embargoed advance mailout', 'Press/blog list finalized; send private streaming link under embargo (no downloads). Follow up once, then move on.', [], true),
    T('pitch', -25, 'Submit to curator pitching portals', 'Audiartist-style pitching portals, SubmitHub/Groover lanes if budget allows ($0 first). Track submission IDs and outcomes.', [], true),

    // ---- T-2wk: tease (snippet window: 2–4 weeks out) ----
    T('tease', -14, 'Snippet #1 — the hook (15s)', 'Hook or chorus, 15s vertical. Say the song title + artist name aloud (caption + spoken = ranking factor on TikTok).', ['tiktok','instagram_reels','youtube_shorts'], false),
    T('tease', -13, 'Countdown + cover reveal', 'Cover art reveal + countdown date. Thread on X/Threads: why this record exists, 3 posts max.', ['threads','x','instagram_feed'], false),
    T('tease', -12, 'Snippet #2 — different section (15–30s)', 'A different moment (verse drop, bridge). 15–30s is the discovery sweet spot for Reels.', ['tiktok','instagram_reels','youtube_shorts'], false),
    T('tease', -11, 'Behind-the-scenes clip', 'Studio/recording story in 30s. Raw phone footage outperforms polished edits for BTS.', ['tiktok','instagram_reels'], false),
    T('tease', -10, 'Snippet #3 — fan-picked moment', 'Poll your audience on their favorite part, then post the winning clip the same day.', ['tiktok','instagram_reels','youtube_shorts'], false),
    T('tease', -9, 'Lyric teaser card', 'One standout lyric as a designed card. Alt text on the image for accessibility.', ['instagram_feed','facebook'], false),
    T('tease', -8, 'Creator/collab outreach', 'Brief 5–10 creators with the official sound once it is live in the audio library. No engagement pods — 2026’s #1 suppression trigger.', ['tiktok','instagram_reels'], false),
    T('tease', -7, 'Pre-save push #2', 'Second pre-save push with a new creative angle. Pre-saves convert to first-day algorithmic velocity.', ['threads','x','instagram_feed'], false),

    // ---- T-1wk: push ----
    T('push', -7, 'Heavy cadence begins: 1–3 posts/day', 'TikTok/Reels/Shorts cadence up. Mix ~60% your own sound / 30% trending formats / 10% experimental.', ['tiktok','instagram_reels','youtube_shorts'], false),
    T('push', -6, 'Premiere announcement', 'Announce premiere time + watch-party details. Set reminders on every platform that supports them.', ['youtube_long','threads','x'], false),
    T('push', -5, 'UGC prompt: template drop', 'Drop a duet/stitch-friendly template: the hook with a pause, a caption template, or a dance. Make participation frictionless.', ['tiktok','instagram_reels'], false),
    T('push', -4, 'Daily countdown stories', 'Countdown sticker stories every day. Reshare fan countdowns to Stories.', ['instagram_feed'], false),
    T('push', -3, 'Street team / community rally', 'Rally your community: early listeners get the private link + first-comment duty on release day.', ['threads','x','facebook'], false),
    T('push', -2, 'Final pre-save push + drop time', 'Final pre-save post. State the exact drop time in ET + one more timezone. Update bio link to the presave page.', ['threads','x','instagram_feed'], false),
    T('push', -1, 'Release-eve hype post', '"Tomorrow." Keep it short. Post inside a peak window; schedule the rest for the morning drop.', ['tiktok','instagram_reels','youtube_shorts'], false),

    // ---- Release day: 3–5 core assets + engagement ----
    T('release', 0, 'Asset 1 — official announcement (pinned)', 'The record is out. Pin it. Short caption, title + artist, one CTA.', ['threads','x','instagram_feed','facebook'], false),
    T('release', 0, 'Asset 2 — streaming-link hub post', 'All-platform links in bio + one link post per platform native format (link in reply on X — link posts get 0.13% vs 0.48% text-only).', ['x','instagram_feed','bluesky'], false),
    T('release', 0, 'Asset 3 — visualizer or official video', 'Full visualizer or official video to YouTube. Upload 1–2h before the afternoon peak; set a Shorts cut as the Related Video.', ['youtube_long','youtube_shorts'], false),
    T('release', 0, 'Asset 4 — vertical stories pack', '3 vertical cuts (hook, verse, outro) to Stories/Reels/Shorts inside the evening peak window.', ['tiktok','instagram_reels','youtube_shorts'], false),
    T('release', 0, 'Engagement shift: first 2 hours', 'Stay online 30 min after every post; reply to 100% of comments. Early engagement velocity gates distribution (X: 10 likes in 15 min ≫ 10 likes in 3h).', ['threads','x','tiktok'], false),
    T('release', 0, 'Distributor double-check', 'Verify the release is live on all stores. Screenshot confirmations. Fix takedowns/delivery errors immediately.', [], true),

    // ---- Post-release waterfall: 24 micro-assets across 4 weeks ----
    T('waterfall', 1,  'Micro-asset 1 — performance cut', 'One-take performance of the hook, vertical.', ['tiktok','instagram_reels','youtube_shorts'], false),
    T('waterfall', 3,  'Micro-asset 2 — lyric snippet video', 'Lyric-on-screen clip of the catchiest 8 bars.', ['tiktok','instagram_reels'], false),
    T('waterfall', 5,  'Micro-asset 3 — alternate hook edit', 'Sped-up or slowed version teaser (48h window to ride the trend).', ['tiktok','youtube_shorts'], false),
    T('waterfall', 7,  'Micro-asset 4 — fan reaction repost', 'Repost the best fan video with credit + comment. Social proof compounds.', ['tiktok','instagram_reels'], false),
    T('waterfall', 7,  'Week-1 analytics review', 'Pull per-platform analytics: completion rate, saves, shares, follower adds. Kill what failed; double what worked.', [], true),
    T('waterfall', 9,  'Micro-asset 5 — acoustic / unplugged take', 'Stripped version. New audio = new algorithmic surface.', ['youtube_long','instagram_reels'], false),
    T('waterfall', 11, 'Micro-asset 6 — "song meaning" talking head', '60s on what the record is about. Talking heads convert followers, not just views.', ['tiktok','instagram_reels'], false),
    T('waterfall', 13, 'Micro-asset 7 — duet/stitch prompt v2', 'Fresh template with the second-best moment of the song.', ['tiktok'], false),
    T('waterfall', 15, 'Micro-asset 8 — BTS outtakes', 'Funniest studio outtake. Humanity is the retention hook.', ['tiktok','instagram_reels','youtube_shorts'], false),
    T('waterfall', 17, 'Micro-asset 9 — subtitled lyric clip', 'Lyric video-style clip with on-screen text (50% of Reels watched muted).', ['instagram_reels','youtube_shorts'], false),
    T('waterfall', 19, 'Micro-asset 10 — producer spotlight', 'Producer/engineer explains one sound choice in 30s.', ['tiktok','youtube_shorts'], false),
    T('waterfall', 21, 'Micro-asset 11 — playlist thank-you', 'Thank every playlist add publicly; tag curators. Gratitude converts to re-adds.', ['threads','x','instagram_feed'], false),
    T('waterfall', 23, 'Micro-asset 12 — alternate vertical cut', 'Recut the visualizer into a new vertical edit.', ['instagram_reels','youtube_shorts'], false),
    T('waterfall', 25, 'Micro-asset 13 — live performance clip', 'Best 30s from a live set or live-room take.', ['tiktok','instagram_reels'], false),
    T('waterfall', 27, 'Micro-asset 14 — fan-cover feature', 'Feature the best fan cover with credit.', ['tiktok','instagram_reels'], false),
    T('waterfall', 29, 'Micro-asset 15 — behind-the-beat teaser', 'Strip it to drums/vox for 15s. Producers share these; shares beat likes.', ['tiktok','youtube_shorts'], false),
    T('waterfall', 31, 'Micro-asset 16 — quote-card carousel', 'Press/curator quotes as a swipe carousel.', ['instagram_feed','facebook'], false),
    T('waterfall', 33, 'Micro-asset 17 — remix tease', '8 bars of a remix or VIP edit. Announce the date.', ['tiktok','instagram_reels'], false),
    T('waterfall', 35, 'Micro-asset 18 — recording-story throwback', 'Where the song was written/recorded, then-and-now.', ['tiktok','instagram_feed'], false),
    T('waterfall', 37, 'Micro-asset 19 — milestone thank-you', 'Streams/views milestone post. Numbers are content when they are real — never fabricate.', ['threads','x','instagram_feed'], false),
    T('waterfall', 39, 'Micro-asset 20 — slowed + reverb edit', 'Full slowed/reverb edit as its own upload.', ['youtube_long','tiktok'], false),
    T('waterfall', 41, 'Micro-asset 21 — fan-video compilation', '60s supercut of the best fan content with credits.', ['youtube_shorts','instagram_reels'], false),
    T('waterfall', 43, 'Micro-asset 22 — Q&A clip', 'Answer the 3 most-asked questions about the record in one clip.', ['tiktok','instagram_reels'], false),
    T('waterfall', 45, 'Micro-asset 23 — next-release tease', 'Bridge the waterfall into the next cycle: 10s of what is coming.', ['tiktok','instagram_reels','youtube_shorts'], false),
    T('waterfall', 47, 'Micro-asset 24 — final cut', 'Last waterfall asset: the strongest unreleased angle from the session.', ['tiktok','instagram_reels'], false),
    T('waterfall', 49, 'Full-cycle retro + kill-rule check', '28-day retro: streams, saves, playlist adds, follower growth, revenue. Numeric verdict: did this release earn its follow-up budget? Anything at zero gets reworked or killed — never reported as a win.', [], true)
  ];

  // ---------- timeline generation ----------
  function generate(releaseISO, opts) {
    opts = opts || {};
    const release = parseISODate(releaseISO);
    const shiftWeekends = opts.shiftWeekends !== false;
    const items = TASKS.map(function (t, i) {
      const raw = addDays(release, t.offset);
      let date = raw, shifted = false;
      if (t.business && shiftWeekends) {
        const wd = raw.getUTCDay();
        if (wd === 6) { date = addDays(raw, -1); shifted = true; }
        else if (wd === 0) { date = addDays(raw, -2); shifted = true; }
      }
      return {
        id: 't' + String(i + 1).padStart(2, '0'),
        phase: t.phase,
        offset: t.offset,
        title: t.title,
        detail: t.detail,
        business: t.business,
        platforms: t.platforms,
        date: fmtISO(date),
        rawDate: fmtISO(raw),
        weekday: weekdayName(date),
        shifted: shifted
      };
    });
    items.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.id < b.id ? -1 : 1); });
    return {
      releaseDate: fmtISO(release),
      releaseWeekday: weekdayName(release),
      isFridayRelease: release.getUTCDay() === 5,
      shiftWeekends: shiftWeekends,
      researchNote: RESEARCH_NOTE,
      windows: WINDOWS,
      items: items
    };
  }

  function peakText(platforms) {
    return platforms.map(function (p) {
      const w = WINDOWS[p];
      return w ? w.platform + ': ' + w.windows.join(' | ') : p;
    });
  }

  // ---------- copy-paste text export ----------
  function toText(tl, meta) {
    meta = meta || {};
    const lines = [];
    lines.push('RELEASE TIMELINE — ' + (meta.title || 'Untitled release'));
    lines.push('Release date: ' + prettyDate(parseISODate(tl.releaseDate)) + (tl.isFridayRelease ? '' : '  ⚠ not a Friday (Global Release Day)'));
    lines.push('');
    lines.push(RESEARCH_NOTE);
    lines.push('');
    PHASES.forEach(function (ph) {
      const items = tl.items.filter(function (i) { return i.phase === ph.id; });
      if (!items.length) return;
      lines.push('== ' + ph.name + ' (' + ph.range + ') ==');
      items.forEach(function (it) {
        lines.push('- ' + prettyDate(parseISODate(it.date)) +
          ' [' + (it.offset < 0 ? 'T' + it.offset + 'd' : it.offset === 0 ? 'T-0' : 'T+' + it.offset + 'd') + ']' +
          (it.shifted ? ' (moved from ' + prettyDate(parseISODate(it.rawDate)) + ' — weekend)' : '') +
          ' — ' + it.title);
        lines.push('    ' + it.detail);
        if (it.platforms.length) {
          lines.push('    Best windows: ' + peakText(it.platforms).join(' / '));
        }
      });
      lines.push('');
    });
    return lines.join('\n');
  }

  // ---------- .ics export ----------
  function icsEscape(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }
  function icsFold(line) {
    const out = [];
    let rest = line;
    while (rest.length > 74) { out.push(rest.slice(0, 74)); rest = ' ' + rest.slice(74); }
    out.push(rest);
    return out;
  }
  function toICS(tl, meta) {
    meta = meta || {};
    const dtstamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '') + 'Z';
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CumulativeWebInc//ReleaseTimeline//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    tl.items.forEach(function (it, idx) {
      const start = it.date.replace(/-/g, '');
      const end = fmtISO(addDays(parseISODate(it.date), 1)).replace(/-/g, '');
      const summary = (meta.title ? meta.title + ': ' : '') + it.title + ' (' + (it.offset < 0 ? 'T' + it.offset : it.offset === 0 ? 'T-0' : 'T+' + it.offset) + ')';
      let desc = it.detail;
      if (it.platforms.length) desc += '\\n\\nBest posting windows (2026 research): ' + peakText(it.platforms).join(' | ');
      if (it.shifted) desc += '\\n\\nNote: moved from ' + it.rawDate + ' to keep business hours.';
      const ev = [
        'BEGIN:VEVENT',
        'UID:reltime-' + it.date + '-' + it.id + '-' + idx + '@cwi-release-timeline',
        'DTSTAMP:' + dtstamp,
        'DTSTART;VALUE=DATE:' + start,
        'DTEND;VALUE=DATE:' + end,
        'SUMMARY:' + icsEscape(summary),
        'DESCRIPTION:' + icsEscape(desc),
        'END:VEVENT'
      ];
      ev.forEach(function (l) { icsFold(l).forEach(function (f) { lines.push(f); }); });
    });
    lines.push('END:VCALENDAR');
    return lines.join('\r\n') + '\r\n';
  }

  return {
    generate, toText, toICS, peakText,
    WINDOWS, PHASES, TASKS, RESEARCH_NOTE,
    parseISODate, fmtISO, addDays, weekdayName, prettyDate, icsEscape, icsFold
  };
});
