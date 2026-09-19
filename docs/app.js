/* UI wiring — browser only. */
(function () {
  'use strict';
  var R = window.ReleaseTimeline;
  var el = function (id) { return document.getElementById(id); };
  var last = null;

  el('gen').addEventListener('click', function () {
    var date = el('date').value, title = el('title').value.trim();
    if (!date) { el('warn').innerHTML = '<div class="warn">Pick a release date first.</div>'; return; }
    try { last = { tl: R.generate(date, { shiftWeekends: el('shift').checked }), title: title }; }
    catch (e) { el('warn').innerHTML = '<div class="warn">' + esc(e.message) + '</div>'; return; }
    render(last); el('copy').disabled = false; el('ics').disabled = false;
  });

  el('copy').addEventListener('click', function () {
    if (!last) return;
    var txt = R.toText(last.tl, { title: last.title || 'Untitled release' });
    navigator.clipboard.writeText(txt).then(function () {
      el('copy').textContent = 'Copied ✓'; setTimeout(function(){ el('copy').textContent = 'Copy as text'; }, 1500);
    });
  });

  el('ics').addEventListener('click', function () {
    if (!last) return;
    var blob = new Blob([R.toICS(last.tl, { title: last.title || 'Untitled release' })], { type: 'text/calendar' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'release-timeline.ics'; a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 5000);
  });

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function render(last) {
    var tl = last.tl, out = '';
    if (!tl.isFridayRelease) {
      out += '<div class="warn">⚠ ' + esc(R.prettyDate(R.parseISODate(tl.releaseDate))) + ' is not a Friday. Global Release Day is Friday — consider moving the date.</div>';
    }
    R.PHASES.forEach(function (ph) {
      var items = tl.items.filter(function (i) { return i.phase === ph.id; });
      if (!items.length) return;
      out += '<div class="phase"><h2>' + esc(ph.name) + '</h2><div class="range">' + esc(ph.range) + ' · ' + items.length + ' tasks</div>';
      items.forEach(function (it) {
        var off = it.offset < 0 ? 'T' + it.offset + 'd' : it.offset === 0 ? 'T-0' : 'T+' + it.offset + 'd';
        out += '<div class="task"><div class="d">' + esc(R.prettyDate(R.parseISODate(it.date))) + ' · ' + esc(off) +
          (it.shifted ? ' <span class="moved">moved from ' + esc(R.prettyDate(R.parseISODate(it.rawDate))) + ' (weekend)</span>' : '') + '</div>' +
          '<div class="t">' + esc(it.title) + '</div><div class="x">' + esc(it.detail) + '</div>';
        if (it.platforms.length) {
          out += '<div class="w">📡 ' + esc(R.peakText(it.platforms).join(' &nbsp;·&nbsp; ')) + '</div>';
        }
        out += '</div>';
      });
      out += '</div>';
    });
    el('out').innerHTML = out; el('warn').innerHTML = '';
  }
})();
