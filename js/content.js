// KABOOZE content browser: list, search, delete/undo (stored in localStorage "kabooze_removed"), copy removed ids.
(function () {
  var KEY = 'kabooze_removed';
  var TYPES = [['who', 'WHO QUESTIONS'], ['likely', 'MOST LIKELY TO'], ['truth', 'TRUTHS'], ['dare', 'DARES'], ['category', 'HOT POTATO CATEGORIES'],
    ['tot', 'THIS OR THAT'], ['never', 'NEVER HAVE I EVER'], ['roulette', 'ROULETTE SLICES']];
  var CKEY = 'kabooze_custom';
  var items = FALLBACK_CONTENT, removed = load(), list = document.getElementById('list'), q = document.getElementById('q');
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(removed)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function loadC() { try { return JSON.parse(localStorage.getItem(CKEY)) || []; } catch (e) { return []; } }
  function saveC(a) { try { localStorage.setItem(CKEY, JSON.stringify(a)); } catch (e) {} }
  var ALIAS = { who: 'who', likely: 'likely', mostlikely: 'likely', mostlikelyto: 'likely', post: 'post', posted: 'post', whoposted: 'post', whoposted_this: 'post', whopostedthis: 'post',
    truth: 'truth', dare: 'dare', category: 'category', hotpotato: 'category', tot: 'tot', thisorthat: 'tot', never: 'never', neveriever: 'never' };
  function mkItem(type, text, author) {
    type = ALIAS[String(type || '').toLowerCase().replace(/[^a-z_]/g, '')]; text = String(text || '').trim().toUpperCase().slice(0, 120);
    if (!type || !text) return null;
    var it = { id: 'c-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), type: type, text: text };
    if (type === 'post') { it.author = String(author || '').trim().slice(0, 12); if (!it.author) return null; }
    if (type === 'tot') { var p = text.split('|'); if (p.length < 2) p = text.split(' OR '); if (p.length < 2) return null; it.a = p[0].trim(); it.b = p.slice(1).join(' OR ').trim(); it.text = it.a + ' OR ' + it.b; }
    return it;
  }
  function label(x) { return x.type === 'roulette' ? x.n + ' (' + x.wt + '% OF THE WHEEL)' : x.text; }
  function render() {
    var f = q.value.trim().toLowerCase(), h = '';
    TYPES.forEach(function (t) {
      var all = items.filter(function (x) { return x.type === t[0]; });
      var shown = all.filter(function (x) { return !f || (label(x) + ' ' + x.id).toLowerCase().indexOf(f) >= 0; });
      var active = all.filter(function (x) { return removed.indexOf(x.id) < 0; }).length;
      h += '<h2>' + t[1] + ' (' + active + '/' + all.length + ')</h2>';
      shown.forEach(function (x) {
        var gone = removed.indexOf(x.id) >= 0;
        h += '<div class="it' + (gone ? ' gone' : '') + '"><span>' + esc(label(x)) + '<small>' + x.id + '</small></span><button data-id="' + x.id + '">' + (gone ? 'UNDO' : 'DELETE') + '</button></div>';
      });
      if (!shown.length) h += '<div class="it"><span>NOTHING FOUND</span></div>';
    });
    var cu = loadC();
    if (cu.length) {
      h = '<h2>YOUR CUSTOM (' + cu.length + ')</h2>' + cu.map(function (x) {
        return '<div class="it"><span>' + esc(x.text) + '<small>' + x.type + (x.author ? ' / ' + esc(x.author) : '') + '</small></span><button data-cid="' + x.id + '">DELETE</button></div>';
      }).join('') + h;
    }
    list.innerHTML = h;
    document.getElementById('rc').textContent = removed.length + ' REMOVED';
  }
  list.addEventListener('click', function (e) {
    var cid = e.target.getAttribute && e.target.getAttribute('data-cid');
    if (cid) { saveC(loadC().filter(function (x) { return x.id !== cid; })); var y0 = window.scrollY; render(); window.scrollTo(0, y0); return; }
    var id = e.target.getAttribute && e.target.getAttribute('data-id'); if (!id) return;
    var i = removed.indexOf(id);
    if (i >= 0) removed.splice(i, 1); else removed.push(id);
    save(); var y = window.scrollY; render(); window.scrollTo(0, y);
  });
  q.addEventListener('input', render);
  var ct = document.getElementById('ctype'), ctx = document.getElementById('ctext'), cau = document.getElementById('cauthor');
  ct.addEventListener('change', function () { cau.hidden = ct.value !== 'post'; });
  document.getElementById('cadd').addEventListener('click', function () {
    var it = mkItem(ct.value, ctx.value, cau.value), m = document.getElementById('cmsg');
    if (!it) { m.textContent = ct.value === 'post' ? 'NEED TEXT AND A PLAYER NAME' : ct.value === 'tot' ? 'USE: THIS | THAT' : 'NEED TEXT'; return; }
    var a = loadC(); a.push(it); saveC(a); ctx.value = ''; m.textContent = 'ADDED'; render();
  });
  document.getElementById('pimp').addEventListener('click', function () {
    var m = document.getElementById('pmsg'), arr;
    try { arr = JSON.parse(document.getElementById('pack').value); } catch (e) { m.textContent = 'NOT VALID JSON'; return; }
    if (!Array.isArray(arr)) { m.textContent = 'NEEDS AN ARRAY'; return; }
    var a = loadC(), n = 0;
    arr.forEach(function (x) { var it = x && mkItem(x.type, x.text, x.author); if (it) { a.push(it); n++; } });
    saveC(a); m.textContent = n + ' OF ' + arr.length + ' IMPORTED'; if (n) document.getElementById('pack').value = ''; render();
  });
  document.getElementById('copy').addEventListener('click', function () {
    var txt = removed.join('\n'), b = this;
    function done() { b.textContent = 'COPIED!'; setTimeout(function () { b.textContent = 'COPY REMOVED LIST'; }, 1500); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done).catch(fallback); else fallback();
    function fallback() { var t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) {} t.remove(); }
  });
  fetch('data/content.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (j) { if (Array.isArray(j) && j.length) { items = j; render(); } }).catch(function () {});
  render();
})();
