// KABOOZE content browser: list, search, delete/undo (stored in localStorage "kabooze_removed"), copy removed ids.
(function () {
  var KEY = 'kabooze_removed';
  var TYPES = [['who', 'WIE-VRAGEN'], ['likely', 'WIE ZOU HET EERST'], ['truth', 'WAARHEDEN'], ['dare', 'DURFTEN'], ['category', 'HETE PATAT CATEGORIEEN'],
    ['tot', 'DIT OF DAT'], ['never', 'IK HEB NOG NOOIT'], ['roulette', 'ROULETTE']];
  var items = FALLBACK_CONTENT, removed = load(), list = document.getElementById('list'), q = document.getElementById('q');
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(removed)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function label(x) { return x.type === 'roulette' ? x.n + ' (' + x.wt + '% VAN HET WIEL)' : x.text; }
  function render() {
    var f = q.value.trim().toLowerCase(), h = '';
    TYPES.forEach(function (t) {
      var all = items.filter(function (x) { return x.type === t[0]; });
      var shown = all.filter(function (x) { return !f || (label(x) + ' ' + x.id).toLowerCase().indexOf(f) >= 0; });
      var active = all.filter(function (x) { return removed.indexOf(x.id) < 0; }).length;
      h += '<h2>' + t[1] + ' (' + active + '/' + all.length + ')</h2>';
      shown.forEach(function (x) {
        var gone = removed.indexOf(x.id) >= 0;
        h += '<div class="it' + (gone ? ' gone' : '') + '"><span>' + esc(label(x)) + '<small>' + x.id + '</small></span><button data-id="' + x.id + '">' + (gone ? 'ONGEDAAN' : 'VERWIJDER') + '</button></div>';
      });
      if (!shown.length) h += '<div class="it"><span>NIKS GEVONDEN</span></div>';
    });
    list.innerHTML = h;
    document.getElementById('rc').textContent = removed.length + ' VERWIJDERD';
  }
  list.addEventListener('click', function (e) {
    var id = e.target.getAttribute && e.target.getAttribute('data-id'); if (!id) return;
    var i = removed.indexOf(id);
    if (i >= 0) removed.splice(i, 1); else removed.push(id);
    save(); var y = window.scrollY; render(); window.scrollTo(0, y);
  });
  q.addEventListener('input', render);
  document.getElementById('copy').addEventListener('click', function () {
    var txt = removed.join('\n'), b = this;
    function done() { b.textContent = 'GEKOPIEERD!'; setTimeout(function () { b.textContent = 'KOPIEER VERWIJDERDE LIJST'; }, 1500); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done).catch(fallback); else fallback();
    function fallback() { var t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) {} t.remove(); }
  });
  fetch('data/content.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (j) { if (Array.isArray(j) && j.length) { items = j; render(); } }).catch(function () {});
  render();
})();
