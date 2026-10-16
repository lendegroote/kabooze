// KABOOZE: tap-only party game. DOM screens, canvas only for avatars, bomb and roulette.
(function () {
  var COL = ['#9cff57', '#6fd13a', '#3a7a22', '#9cff57', '#6fd13a', '#3a7a22', '#9cff57', '#6fd13a'];
  var KEY = 'kabooze.players';
  var $ = function (s) { return document.querySelector(s); };
  var card = $('#card'), over = $('#over');

  var S = {
    players: loadPlayers(), snd: true, paused: false, modal: false, fuseOn: false, left: 0, acc: 0,
    drinks: [], secs: [], photos: [], askSec: false, r3: null, r4: null, dbl: [], rn: 0, total: 1, cur: null, holder: 0, ans: [], r1: null, r2: null, usedQ: [], inGame: false, frozen: false, draft: ''
  };

  // ---------- helpers ----------
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function loadPlayers() {
    try { var p = JSON.parse(localStorage.getItem(KEY)); if (p && p.length) return p; } catch (e) {}
    return [{ name: '', av: '' }, { name: '', av: '' }];
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S.players)); } catch (e) {} }
  function snd(n) { if (S.snd && !MUS.quiet) try { SFX[n](); } catch (e) {} }
  function nm(i) { return S.players[i].name || ('P' + (i + 1)); }
  function setQuiet(q) {
    if (q === !!MUS.quiet) return;
    MUS.quiet = q;
    if (q) MUS.stop(); else MUS.start();
  }
  function show(html) { card.innerHTML = html; S.frozen = false; setQuiet(false); }
  var showR = show;
  // input screens (typing, camera, private votes): the bomb fuse is frozen while someone is answering
  // they are also silent: no music, no SFX, no ticks
  function showF(html) { card.innerHTML = html; S.frozen = true; setQuiet(true); }
  function go(fn) { stopCam(); S.cur = fn; fn(); }

  var initCache = {};
  function avSrc(i) {
    var p = S.players[i];
    if (p.av) return p.av;
    var k = nm(i)[0] + i;
    if (!initCache[k]) {
      var c = document.createElement('canvas'); c.width = c.height = 32;
      var g = c.getContext('2d');
      g.fillStyle = '#3a7a22'; g.fillRect(0, 0, 32, 32);
      drawText(g, nm(i)[0], 6, 2, '#0b140b', 4);
      initCache[k] = c.toDataURL();
    }
    return initCache[k];
  }
  function av(i, cls) { return '<img class="av ' + (cls || 'md') + '" src="' + avSrc(i) + '" alt="">'; }
  function btn(id, label, c, extra) { return '<button class="btn ' + (extra || '') + '" id="' + id + '" style="--c:' + c + '">' + label + '</button>'; }
  function on(id, fn) { var e = document.getElementById(id); if (e) e.addEventListener('click', fn); }
  function pickGrid(idx, cb, cls) {
    var h = '<div class="grid ' + (idx.length > 4 ? 'c3' : 'c2') + '">';
    idx.forEach(function (i) {
      h += '<button class="pick ' + (cls && cls(i) || '') + '" data-i="' + i + '" style="--k:' + COL[i % 8] + '">' + av(i, 'pa') + '<span>' + esc(nm(i)) + '</span></button>';
    });
    h += '</div>';
    return h;
  }
  function bindPicks(cb) {
    card.querySelectorAll('.pick').forEach(function (b) {
      b.addEventListener('click', function () { cb(+b.dataset.i, b); });
    });
  }
  function drink(i, n) {
    if (S.dbl.some(function (d) { return d.p === i && d.rn === S.rn; })) n *= 2;
    S.drinks[i] = (S.drinks[i] || 0) + n;
  }

  // ---------- bomb sprite ----------
  function drawBomb(c, t) {
    var g = c.getContext('2d'), x, y;
    g.clearRect(0, 0, 16, 16);
    for (y = 0; y < 16; y++) for (x = 0; x < 16; x++) {
      var d = Math.sqrt((x - 7.5) * (x - 7.5) + (y - 9.5) * (y - 9.5));
      if (d < 6.2) { g.fillStyle = d > 5 ? '#9cff57' : '#0f2410'; g.fillRect(x, y, 1, 1); }
    }
    g.fillStyle = '#9cff57'; g.fillRect(4, 6, 2, 2); g.fillRect(4, 8, 1, 1);
    g.fillStyle = '#6fd13a'; g.fillRect(6, 2, 4, 2);
    g.fillStyle = '#6fd13a'; g.fillRect(8, 1, 1, 1); g.fillRect(9, 0, 1, 1); g.fillRect(10, 0, 1, 1);
    g.fillStyle = ['#ffd23f', '#ff9f1c', '#ff3b3b', '#ff6a2a'][t % 4];
    g.fillRect(11, 0, 1, 1); g.fillRect(12, 1, 1, 1); g.fillRect(11, 2, 1, 1); g.fillRect(10, 1, 1, 1);
  }
  var INV = ['..#.....#..', '...#...#...', '..#######..', '.##.###.##.', '###########', '#.#######.#', '#.#.....#.#', '...##.##...'];
  function drawInv(c, t) {
    var g = c.getContext('2d'); g.clearRect(0, 0, 11, 8); g.fillStyle = '#9cff57';
    INV.forEach(function (row, y) { for (var x = 0; x < 11; x++) if (row[x] === '#') g.fillRect(x, y + (t % 8 < 4 ? 0 : 0), 1, 1); });
    g.fillStyle = '#0b140b'; if (t % 8 < 4) { g.fillRect(3, 7, 1, 1); g.fillRect(7, 7, 1, 1); } else { g.fillRect(2, 7, 1, 1); g.fillRect(8, 7, 1, 1); }
  }
  var frame = 0;
  setInterval(function () {
    frame++;
    document.querySelectorAll('canvas.bomb').forEach(function (c) { drawBomb(c, frame); });
    document.querySelectorAll('canvas.inv').forEach(function (c) { drawInv(c, frame); });
  }, 140);

  // ---------- fuse ----------
  function resetFuse() { S.total = S.left = (90 + rnd(91)) * 1000; S.acc = 0; }
  var tmr = $('#tmr'), tg = tmr.getContext('2d'), tkey = '';
  function drawTimer() {
    var show = S.fuseOn && S.cur !== title;
    tmr.style.visibility = show ? 'visible' : 'hidden';
    if (!show) { tkey = ''; return; }
    var sec = Math.max(0, Math.ceil(S.left / 1000)), hot = sec <= 10, lit = !hot || (Math.floor(performance.now() / 250) % 2 === 0);
    var k = sec + (hot ? 'h' + lit : '');
    if (k === tkey) return; tkey = k;
    tmr.classList.toggle('hot', hot);
    tg.clearRect(0, 0, 58, 14);
    if (lit) drawText(tg, ('0' + Math.floor(sec / 60)).slice(-2) + ':' + ('0' + sec % 60).slice(-2), 0, 0, hot ? '#ff6a2a' : '#9cff57', 2);
  }
  var last = performance.now();
  setInterval(function () {
    var now = performance.now(), dt = now - last; last = now;
    drawTimer();
    if (!S.fuseOn) MUS.mul = 1;
    if (!S.fuseOn || S.paused || S.modal || S.frozen) return;
    S.left -= dt; S.acc += dt;
    var p = 1 - Math.max(S.left, 0) / S.total; MUS.mul = 1 + 0.25 * p;
    var iv = 1000 * Math.pow(0.12, Math.pow(p, 1.7));
    if (S.acc >= iv) { S.acc = 0; if (S.snd && !MUS.quiet) try { beep(900 + p * 900, 0.04, 0, 0.09); } catch (e) {} }
    $('#tb').classList.toggle('hot', S.left < 10000);
    if (S.left <= 0) explode();
  }, 40);

  function explode() {
    S.modal = true; MUS.hold = true; MUS.stop();
    var who = S.holder;
    snd('boom');
    try { navigator.vibrate && navigator.vibrate([200, 80, 200, 80, 500]); } catch (e) {}
    over.hidden = false; over.className = 'boom';
    over.innerHTML = '<div class="kb">KABOOM.</div><div class="big" style="font-size:15px">SKILL ISSUE, ' + esc(nm(who)) + '.</div>' + av(who, 'lg');
    var done = false;
    function next() { if (done) return; done = true; roulette(who); }
    over.onclick = next; setTimeout(next, 2200);
  }

  // ---------- roulette ----------
  function getWT() { return ROULETTE.reduce(function (t, r) { return t + r.wt; }, 0); }
  function wheelCanvas() {
    var c = document.createElement('canvas'); c.width = c.height = 160;
    var g = c.getContext('2d'), acc = 0, WT = getWT();
    ROULETTE.forEach(function (r, i) {
      var span = r.wt / WT * Math.PI * 2, a0 = -Math.PI / 2 + acc * Math.PI * 2 / WT;
      acc += r.wt;
      g.beginPath(); g.moveTo(80, 80); g.arc(80, 80, 78, a0, a0 + span); g.closePath();
      g.fillStyle = r.k === 'buy' ? '#d8ff9f' : (i % 2 ? '#6fd13a' : '#9cff57'); g.fill();
      g.strokeStyle = '#0b140b'; g.lineWidth = 2; g.stroke();
      g.save(); g.translate(80, 80); g.rotate(a0 + span / 2);
      drawText(g, r.w, 74 - textW(r.w, 1), -3, '#0b140b', 1);
      g.restore();
    });
    g.beginPath(); g.arc(80, 80, 78, 0, Math.PI * 2); g.strokeStyle = '#0b140b'; g.lineWidth = 3; g.stroke();
    return c;
  }
  function pickSlice() {
    var WT = getWT(), x = Math.random() * WT, acc = 0;
    for (var i = 0; i < ROULETTE.length; i++) { acc += ROULETTE[i].wt; if (x < acc) return { i: i, mid: (acc - ROULETTE[i].wt + (x - (acc - ROULETTE[i].wt))) / WT * 360 }; }
  }
  function resultText(r, who) {
    if (r.k === 'truth') return TRUTHS[rnd(TRUTHS.length)];
    if (r.k === 'dare') return DARES[rnd(DARES.length)];
    if (r.k === 'confess') {
      var a = S.ans.filter(function (x) { return x.by === who; })[0];
      return a ? 'VERTEL DE TAFEL WIE JE AANDUIDDE BIJ "' + a.q + '"' : 'VERTEL DE TAFEL EEN GEHEIM.';
    }
    return r.d;
  }
  function roulette(who) {
    over.hidden = true; over.className = ''; over.onclick = null;
    S.modal = true; snd('fanfare');
    show('<div class="scr center"><h2>' + esc(nm(who)) + ' DRAAIT!</h2><div class="wheelwrap"><div class="ptr"></div></div><div id="res" style="width:100%"></div></div>');
    var w = card.querySelector('.wheelwrap'), c = wheelCanvas();
    w.appendChild(c);
    var hub = document.createElement('i'); hub.className = 'hub'; w.appendChild(hub);
    var res = $('#res');
    res.innerHTML = btn('spin', 'TIK OM TE DRAAIEN', '#ff3b3b');
    var spun = false;
    function spin() {
      if (spun) return; spun = true; snd('go');
      var pk = pickSlice(), i = pk.i, deg = 360 * 5 + (360 - pk.mid);
      c.style.transform = 'rotate(' + deg + 'deg)';
      res.innerHTML = '<div class="sub">...</div>';
      var iv = setInterval(function () { snd('tick'); }, 180);
      setTimeout(function () {
        clearInterval(iv); snd('win');
        var r = ROULETTE[i];
        if (r.k === 'drink') drink(who, r.c);
        if (r.k === 'double') S.dbl.push({ p: who, rn: S.rn + 1 });
        res.innerHTML = '<div class="big y" style="margin-bottom:10px">' + r.n + '</div><div class="sub" style="margin-bottom:10px">' + esc(resultText(r, who)) + '</div>' + btn('cont', 'VERDER', '#3bd16f');
        on('cont', function () { S.modal = false; MUS.hold = false; MUS.mul = 1; MUS.start(); resetFuse(); S.cur(); });
      }, 4400);
    }
    on('spin', spin); c.addEventListener('click', spin); card.querySelector('.scr').addEventListener('click', spin);
  }

  // ---------- top bar / menu ----------
  function bar() {
    $('#back').style.visibility = S.cur === title ? 'hidden' : 'visible';
    $('#tb').style.visibility = S.cur === title ? 'hidden' : 'visible';
  }
  $('#back').addEventListener('click', function () {
    if (!over.hidden) return;
    if (S.cam) { var cb = S.cam.back; stopCam(); return cb ? cb() : setup(); }
    if (S.cur === setup) return go(title);
    if (S.inGame) return confirmBox('SPEL STOPPEN?', function () { stopGame(); go(setup); });
    go(title);
  });
  $('#menu').addEventListener('click', function () {
    if (!over.hidden) { var cl = over.querySelector('#m1'); if (cl) cl.click(); return; }
    var was = S.paused; S.paused = true;
    function close() { over.hidden = true; over.className = ''; S.paused = was; }
    over.hidden = false; over.className = '';
    over.innerHTML = '<div class="box"><h2>PAUZE</h2>' + btn('m1', 'DOORGAAN', '#3bd16f') +
      (S.inGame ? btn('m2', 'SPEL HERSTARTEN', '#ff9f1c') : '') + btn('m8', 'OPNIEUW BEGINNEN', '#ff3b3b') + btn('m3', 'TERUG NAAR START', '#3ec6ff') +
      btn('m4', 'GELUID: ' + (S.snd ? 'AAN' : 'UIT'), '#ffd23f') + btn('m5', 'MUZIEK: ' + (MUS.on ? 'AAN' : 'UIT'), '#ffd23f') + btn('m6', 'INHOUD', '#3ec6ff') + btn('m7', 'VOLLEDIG SCHERM', '#3ec6ff') + '</div>';
    on('m1', close);
    on('m2', function () { close(); stopGame(); startGame(); });
    on('m8', function () { close(); askWipe(); });
    on('m3', function () {
      close();
      if (!S.inGame) return go(title);
      confirmBox('ZEKER? JE SPEL IS WEG', function () { stopGame(); go(title); });
    });
    on('m4', function () { S.snd = !S.snd; $('#m4').textContent = 'GELUID: ' + (S.snd ? 'AAN' : 'UIT'); });
    on('m7', function () { close(); $('#fs').click(); });
    on('m6', function () { window.open('content.html', '_blank'); });
    on('m5', function () { MUS.on = !MUS.on; if (MUS.on) MUS.start(); else MUS.stop(); $('#m5').textContent = 'MUZIEK: ' + (MUS.on ? 'AAN' : 'UIT'); });
  });
  $('#fs').addEventListener('click', function () {
    var el = document.documentElement, fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    var req = el.requestFullscreen || el.webkitRequestFullscreen, ex = document.exitFullscreen || document.webkitExitFullscreen;
    if (fsEl) { if (ex) ex.call(document); return; }
    if (req && !/iPhone|iPod/.test(navigator.userAgent)) { try { var p = req.call(el); if (p && p.catch) p.catch(tip); } catch (e) { tip(); } return; }
    tip();
  });
  function tip() {
    over.hidden = false; over.className = '';
    over.innerHTML = '<div class="box"><h2>VOLLEDIG SCHERM</h2><div class="how"><div>ZET HEM OP JE STARTSCHERM VOOR VOLLEDIG SCHERM</div></div>' + btn('tx', 'OK', '#3bd16f') + '</div>';
    on('tx', function () { over.hidden = true; });
  }
  function wipeAll() {
    ['kabooze.players', 'kabooze.secrets', 'kabooze.photos'].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
    stopGame(); stopCam();
    S.players = [{ name: '', av: '' }, { name: '', av: '' }];
    S.secs = []; S.photos = []; S.ans = []; S.drinks = []; S.usedQ = []; S.dbl = []; S.rn = 0; S.draft = '';
    initCache = {};
    go(setup);
  }
  function askWipe() { confirmBox('ALLES WISSEN? SPELERS, ANTWOORDEN EN FOTO\'S', wipeAll); }
  function confirmBox(msg, yes) {
    over.hidden = false; over.className = '';
    over.innerHTML = '<div class="box"><h2>' + msg + '</h2>' + btn('cy', 'JA', '#ff3b3b') + btn('cn', 'NEE', '#3bd16f') + '</div>';
    on('cy', function () { over.hidden = true; yes(); });
    on('cn', function () { over.hidden = true; });
  }
  document.addEventListener('pointerdown', function () { unlock(); MUS.start(); }, { once: true });
  document.addEventListener('pointerdown', function (e) {
    if (e.target.closest && e.target.closest('.btn,.pick,.thumb')) { try { navigator.vibrate && navigator.vibrate(10); } catch (x) {} }
  }, true);
  document.addEventListener('visibilitychange', function () { if (document.hidden) MUS.stop(); else MUS.start(); });


  // ---------- Game Boy controls: D-pad moves a highlight, A confirm, B back, START menu, SELECT sound ----------
  function ctx() { return over.hidden ? card : over; }
  function targets() {
    return [].slice.call(ctx().querySelectorAll('.pick:not(.bad),.btn,input[type=text]')).filter(function (e) { return e.offsetParent; });
  }
  function curFoc() { return ctx().querySelector('.foc'); }
  function setFoc(e) {
    document.querySelectorAll('.foc').forEach(function (x) { x.classList.remove('foc'); });
    if (e && S.kb) { e.classList.add('foc'); try { e.scrollIntoView({ block: 'nearest' }); } catch (x) {} }
  }
  function autoFoc() {
    var c = ctx(), t = targets();
    var f = c.querySelector('.pick:not(.bad),#start') || (c === over ? t[0] : t[t.length - 1]);
    setFoc(f || null);
  }
  var mo = new MutationObserver(function () { setTimeout(autoFoc, 0); });
  mo.observe(card, { childList: true }); mo.observe(over, { childList: true, attributes: true, attributeFilter: ['hidden'] });
  function nav(dir) {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    var cur = curFoc(), list = targets();
    if (!cur) return setFoc(list[0]);
    var r = cur.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, best = null, bs = 1e9;
    list.forEach(function (e) {
      if (e === cur) return;
      var q = e.getBoundingClientRect(), dx = q.left + q.width / 2 - cx, dy = q.top + q.height / 2 - cy, p, s;
      if (dir === 'left') { p = -dx; s = Math.abs(dy); } else if (dir === 'right') { p = dx; s = Math.abs(dy); }
      else if (dir === 'up') { p = -dy; s = Math.abs(dx); } else { p = dy; s = Math.abs(dx); }
      if (p <= 2) return;
      var sc = p + 2 * s; if (sc < bs) { bs = sc; best = e; }
    });
    if (best) { setFoc(best); snd('move'); }
  }
  function press(k) {
    unlock(); MUS.start();
    if (k === 'up' || k === 'down' || k === 'left' || k === 'right') return nav(k);
    if (k === 'a') { var f = curFoc(); if (!f) return autoFoc(); if (f.tagName === 'INPUT') f.focus(); else f.click(); return; }
    if (k === 'b') {
      if (!over.hidden) { var x = over.querySelector('#m1,#cn,#hx'); if (x) x.click(); else if (over.className === 'boom') over.click(); return; }
      return $('#back').click();
    }
    if (k === 'start') { var m = over.querySelector('#m1'); return m ? m.click() : (over.hidden && $('#menu').click()); }
    if (k === 'select') { S.snd = !S.snd; var m4 = $('#m4'); if (m4) m4.textContent = 'GELUID: ' + (S.snd ? 'AAN' : 'UIT'); snd('ok'); }
  }
  document.querySelectorAll('#ctl [data-k]').forEach(function (b) {
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); b.classList.add('dn'); try { navigator.vibrate && navigator.vibrate(10); } catch (x) {} press(b.dataset.k); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function () { b.classList.remove('dn'); }); });
  });
  var KM = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', x: 'a', X: 'a', z: 'b', Z: 'b', Enter: 'start', Shift: 'select' };
  document.addEventListener('keydown', function (e) {
    var a = document.activeElement;
    if (a && a.tagName === 'INPUT') { if (e.key === 'Enter') a.blur(); return; }
    if (KM[e.key]) { e.preventDefault(); S.kb = true; document.body.classList.add('usekey'); if (!curFoc()) autoFoc(); press(KM[e.key]); }
  });

  // ---------- title ----------
  function title() {
    S.cur = title; bar();
    show('<div class="scr center"><div class="logo"><span class="r">K</span><span class="o">A</span><span class="y">B</span><canvas class="bomb" width="16" height="16"></canvas><span class="g">O</span><span class="c">Z</span><span class="p">E</span></div>' +
      '<div class="sub">HET DRINKSPEL MET EEN VERBORGEN BOM</div><div class="grow"></div><div class="inv-row"><canvas class="inv" width="11" height="8"></canvas><canvas class="bomb bigbomb" width="16" height="16"></canvas><canvas class="inv" width="11" height="8"></canvas></div><div class="grow"></div>' +
      '<div style="width:100%">' + btn('start', 'START', '#3bd16f') + btn('how', 'HOE SPEEL JE', '#3ec6ff', 'sm') + btn('wipe', 'OPNIEUW BEGINNEN', '#ff3b3b', 'sm') + '</div></div>');
    card.querySelector('#how').style.width = '100%'; card.querySelector('#wipe').style.width = '100%';
    on('wipe', askWipe);
    on('start', function () { go(setup); });
    on('how', function () {
      over.hidden = false; over.className = '';
      over.innerHTML = '<div class="box"><h2>HOE SPEEL JE</h2><div class="how"><div>1. VOEG IEDEREEN TOE. DUID VOOR ELKE VRAAG IEMAND AAN.</div><div>2. RAAD WIE WAT ZEI. FOUT = DRINKEN.</div><div>3. RAAK = DIE PERSOON DRINKT EN IS DAN AAN BEURT.</div><div>4. DAARNA: HETE PATAT, DIT OF DAT, IK HEB NOG NOOIT, GEBIECHTEN EN FOTOS.</div><div>5. DE BOM IS VERBORGEN. HOU DE GSM NIET VAST ALS HIJ KABOOM GAAT.</div><div class="y">WATER TELT MEE. KEN JE LIMIET.</div></div>' + btn('hx', 'SNAP IK', '#3bd16f') + '</div>';
      on('hx', function () { over.hidden = true; });
    });
  }

  // ---------- setup step A: players ----------
  function setup() {
    S.cur = setup; S.inGame = false; bar();
    var P = S.players, h = '<div class="scr"><h2>WIE SPEELT MEE?</h2><div class="scroll"><div class="grid c2" id="tiles">';
    P.forEach(function (p, i) {
      h += '<div class="pcard" style="--k:' + COL[i % 8] + '"><div class="thumb" data-i="' + i + '">' + av(i, 'lg') + '</div>' +
        '<input type="text" maxlength="8" placeholder="NAAM" value="' + esc(p.name) + '" data-i="' + i + '" autocomplete="off" autocapitalize="characters" spellcheck="false">' +
        '<div class="acts">' + btn('s' + i, 'SELFIE', COL[i % 8], 'sm') + (P.length > 2 ? btn('x' + i, 'X', '#ff3b3b', 'sm') : '') + '</div>' +
        '<input type="file" accept="image/*" capture="user" hidden data-i="' + i + '"></div>';
    });
    h += '</div>' + (P.length < 8 ? btn('add', 'SPELER TOEVOEGEN', '#3ec6ff') : '') + '</div><div class="toast" id="toast"></div>' + btn('go', 'WE GAAN', '#3bd16f') + '</div>';
    showF(h);
    card.querySelectorAll('.pcard').forEach(function (pc) {
      var i = +pc.querySelector('input[type=text]').dataset.i;
      var t = pc.querySelector('input[type=text]'), f = pc.querySelector('input[type=file]');
      t.addEventListener('input', function () { P[i].name = t.value.trim(); save(); if (!P[i].av) { initCache = {}; pc.querySelector('img').src = avSrc(i); } });
      function pic() {
        if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) return f.click();
        camScreen(i);
      }
      pc.querySelector('.thumb').addEventListener('click', pic);
      pc.querySelector('#s' + i).addEventListener('click', pic);
      f.addEventListener('change', function () {
        if (!f.files[0]) return;
        RemiAvatar.fromFile(f.files[0]).then(function (c) { P[i].av = c.toDataURL(); save(); pc.querySelector('img').src = P[i].av; }).catch(function () { $('#toast').textContent = 'FOTO MISLUKT'; });
      });
      var x = pc.querySelector('#x' + i);
      if (x) x.addEventListener('click', function () { P.splice(i, 1); initCache = {}; save(); setup(); });
    });
    on('add', function () { P.push({ name: '', av: '' }); save(); setup(); var s = card.querySelector('.scroll'); s.scrollTop = s.scrollHeight; });
    on('go', function () {
      if (P.some(function (p) { return !p.name; })) { $('#toast').textContent = 'IEDEREEN HEEFT EEN NAAM NODIG'; snd('bad'); return; }
      save(); startGame();
    });
  }


  // ---------- selfie camera (getUserMedia, live green dither preview) ----------
  function stopCam() {
    var c = S.cam; if (!c) return;
    S.cam = null; clearInterval(c.iv);
    if (c.stream) c.stream.getTracks().forEach(function (t) { t.stop(); });
  }
  function camSquare(v, t, flat) {
    var s = Math.min(v.videoWidth, v.videoHeight), g = t.getContext('2d');
    g.save(); if (!flat) { g.translate(t.width, 0); g.scale(-1, 1); }
    g.drawImage(v, (v.videoWidth - s) / 2, (v.videoHeight - s) / 2, s, s, 0, 0, t.width, t.height);
    g.restore(); return t;
  }
  function camFail(i, opt) {
    stopCam();
    showF('<div class="scr center"><div class="grow"></div><h2>GEEN CAMERA</h2><div class="sub">KIES OF MAAK EEN FOTO.</div><div class="grow"></div><input type="file" id="cf" accept="image/*" capture="user" hidden>' + btn('cfb', 'KIES FOTO', '#3bd16f') + btn('cfx', opt ? 'OVERSLAAN' : 'TERUG', '#ff9f1c') + '</div>');
    var f = $('#cf');
    on('cfb', function () { f.click(); });
    on('cfx', function () { if (opt) opt.done(); else setup(); });
    f.addEventListener('change', function () {
      if (!f.files[0]) return;
      if (opt) return fileToPhoto(f.files[0]).then(function (u) { opt.save(u); opt.done(); }).catch(function () { opt.done(); });
      RemiAvatar.fromFile(f.files[0]).then(function (c) { S.players[i].av = c.toDataURL(); save(); setup(); }).catch(function () { setup(); });
    });
  }
  function camScreen(i, opt, facing) {
    stopCam();
    facing = facing || (opt ? 'environment' : 'user');
    var N = opt ? 64 : 32;
    showF('<div class="scr"><h2>' + (opt ? esc(opt.prompt) : 'LACH, ' + esc(nm(i))) + '</h2><div class="grow camwrap"><canvas id="cv" width="' + N + '" height="' + N + '"></canvas></div><div class="toast" id="toast">CAMERA STARTEN...</div><div id="cbtns" style="width:100%"></div></div>');
    var cam = S.cam = { stream: null, iv: 0, back: opt ? opt.done : null };
    function camStart(fm) {
    facing = fm;
    clearInterval(cam.iv); if (cam.stream) cam.stream.getTracks().forEach(function (t) { t.stop(); }); cam.stream = null;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: fm }, audio: false }).then(function (stream) {
      if (S.cam !== cam || facing !== fm) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
      cam.stream = stream;
      var v = document.createElement('video'); v.muted = true; v.setAttribute('playsinline', ''); v.srcObject = stream; v.play();
      var cv = $('#cv'), g = cv.getContext('2d'), small = document.createElement('canvas'), big = document.createElement('canvas');
      small.width = small.height = N * 2; big.width = big.height = 480;
      $('#toast').textContent = '';
      $('#cbtns').innerHTML = btn('snap', 'FOTO!', '#3bd16f') + '<button class="btn sm" id="flip" style="--c:#3ec6ff;display:none">DRAAI CAMERA</button>'; autoFoc();
      var flat = fm !== 'user';
      if (navigator.mediaDevices.enumerateDevices) navigator.mediaDevices.enumerateDevices().then(function (d) {
        var f = $('#flip'); if (f && d.filter(function (x) { return x.kind === 'videoinput'; }).length > 1) { f.style.display = ''; autoFoc(); }
      }).catch(function () {});
      on('flip', function () { camStart(fm === 'user' ? 'environment' : 'user'); });
      cam.iv = setInterval(function () { if (v.videoWidth) g.drawImage(RemiAvatar.fromSource(camSquare(v, small, flat), N), 0, 0); }, 100);
      on('snap', function () {
        if (!v.videoWidth) return;
        var out = RemiAvatar.fromSource(camSquare(v, big, flat), N);
        clearInterval(cam.iv); stream.getTracks().forEach(function (t) { t.stop(); });
        g.drawImage(out, 0, 0); snd('ok');
        $('#cbtns').innerHTML = btn('use', 'GEBRUIK', '#3bd16f') + btn('re', 'OPNIEUW', '#ff9f1c'); autoFoc();
        on('use', function () {
          if (opt) { opt.save(toJpeg(big)); stopCam(); return opt.done(); }
          S.players[i].av = out.toDataURL(); save(); stopCam(); setup();
        });
        on('re', function () { camScreen(i, opt, fm); });
      });
    }).catch(function () { if (S.cam === cam) camFail(i, opt); });
    }
    camStart(facing);
  }

  // ---------- game start ----------
  function stopGame() { S.fuseOn = false; S.inGame = false; S.modal = false; $('#tb').classList.remove('hot'); }
  function startGame() {
    S.drinks = S.players.map(function () { return 0; });
    S.usedQ = []; S.dbl = []; S.rn = 0; S.secs = []; S.photos = []; S.askSec = true; S.inGame = true;
    S.fuseOn = false; S.fresh = true; S.modal = false;
    secrets(0, []);
  }
  function pass(i, next) {
    S.holder = i;
    go(function () {
      S.holder = i;
      show('<div class="scr center"><div class="grow"></div><div class="big">GEEF DE GSM AAN</div><div class="big y">' + esc(nm(i)) + '</div><div class="sub">NIET KIJKEN, LOSER.</div>' + av(i, 'xl') + '<div class="grow"></div>' + btn('ok', 'IK BEN ' + esc(nm(i)) + ', GO', '#3bd16f') + '</div>');
      on('ok', function () { snd('ok'); next(); });
    });
  }

  // ---------- setup step B: secret answers ----------
  function newQ() {
    var pool = QUESTIONS.filter(function (q) { return S.usedQ.indexOf(q) < 0; });
    if (!pool.length) { S.usedQ = []; pool = QUESTIONS; }
    return pool[rnd(pool.length)];
  }
  function secrets(k, list) {
    if (k === 0) S.fuseOn = false;   // no fuse, tick or countdown while answers are being given
    if (k >= S.players.length) { S.ans = list; S.askSec = false; return startCycle(); }
    pass(k, function () {
      var q = newQ();
      go(function () {
        S.holder = k;
        var others = S.players.map(function (p, i) { return i; }).filter(function (i) { return i !== k; });
        showF('<div class="scr"><div class="quote"><div class="aa y">' + esc(q) + '</div></div>' +
          '<div class="sub">DUID IEMAND AAN DE TAFEL AAN. NIEMAND WEET DAT JIJ HET WAS... TOT NU.</div>' +
          '<div class="scroll">' + pickGrid(others) + '</div>' + btn('re', 'ANDERE VRAAG', '#ff9f1c', 'sm') + '</div>');
        on('re', function () { S.usedQ.push(q); q = newQ(); S.cur(); });
        bindPicks(function (i) {
          S.usedQ.push(q); snd('ok');
          list.push({ by: k, q: q, pick: i });
          if (S.askSec) confessScreen(k, function () { photoScreen(k, function () { secrets(k + 1, list); }); }); else secrets(k + 1, list);
        });
        // reroll keeps the new question: S.cur re-reads q via closure
      });
    });
  }

  // ---------- round 1: who said it ----------
  function startR1() {
    S.rn++;
    S.r1 = { lockUntil: 0, left: shuffle(S.ans), g: rnd(S.players.length) };
    nextSecret();
  }
  function nextSecret() {
    var r = S.r1;
    if (!r.left.length) return runNext();
    var k = -1;
    for (var i = 0; i < r.left.length; i++) if (r.left[i].by !== r.g) { k = i; break; }
    if (k < 0) { // only own answers left: hand over to someone else
      var by = r.left[0].by;
      do { r.g = rnd(S.players.length); } while (r.g === by);
      k = 0;
    }
    var a = r.left.splice(k, 1)[0], wrong = [];
    pass(r.g, function () { guess(a, wrong, r, 'q'); });
  }
  function headerFor(a, kind) {
    if (kind === 'conf') return '<div class="quote"><div class="aa y" style="font-size:14px">&quot;' + esc(a.text) + '&quot;</div></div><h2>WIE HEEFT DIT GEBIECHT?</h2>';
    if (kind === 'photo') return '<div class="quote"><div class="qq" style="margin:0">' + esc(a.prompt) + '</div></div><canvas id="pimg" class="pimg" width="64" height="64"></canvas><h2>WIENS FOTO IS DIT?</h2>';
    return '<div class="quote"><div class="qq">' + esc(a.q) + '</div><div class="aa y">&gt; ' + esc(nm(a.pick)) + '</div></div><h2>WIE ZEI DIT?</h2>';
  }
  function drawDither(cv, src, n) {
    var im = new Image();
    im.onload = function () { var t = document.createElement('canvas'); t.width = t.height = 128; t.getContext('2d').drawImage(im, 0, 0, 128, 128); cv.getContext('2d').drawImage(RemiAvatar.fromSource(t, n), 0, 0); };
    im.src = src;
  }
  function guess(a, wrong, L, kind) {
    L = L || S.r1;
    var g = L.g, all = S.players.map(function (p, i) { return i; });
    go(function () {
      S.holder = g;
      showR('<div class="scr">' + headerFor(a, kind) +
        '<div class="scroll">' + pickGrid(all, null, function (i) { return wrong.indexOf(i) >= 0 ? 'bad' : ''; }) + '</div><div class="cd big" id="cd"></div><div class="toast" id="toast"></div></div>');
      var tok = S.lockTok = {};
      function tick() {
        var grid = card.querySelector('.grid'), cd = $('#cd');
        if (S.lockTok !== tok || !grid || !cd) return;
        var left = L.lockUntil - Date.now();
        if (left > 0) { grid.classList.add('lock'); cd.textContent = Math.ceil(left / 1000); setTimeout(tick, 100); }
        else { grid.classList.remove('lock'); cd.textContent = ''; $('#toast').textContent = ''; }
      }
      if (L.lockUntil > Date.now()) { $('#toast').textContent = 'MIS. GE KENT NIEMAND. ' + nm(g) + ' DRINKT.'; tick(); }
      if (kind === 'photo') drawDither($('#pimg'), a.img, 64);
      bindPicks(function (i, b) {
        if (L.lockUntil > Date.now()) return;
        if (i === a.by) {
          if (kind === 'photo') return exposedPhoto(a, L);
          return kind === 'conf' ? exposed(a, L, 2, 'HEEFT DIT GEBIECHT. DRINK 2.', nextConf) : exposed(a, L, 1, 'HEEFT HET GEZEGD. DRINK, KLIKSPAAN.', nextSecret);
        }
        wrong.push(i); drink(g, 1); snd('bad');
        b.classList.add('shake', 'bad');
        L.lockUntil = Date.now() + 3000;
        $('#toast').textContent = 'MIS. GE KENT NIEMAND. ' + nm(g) + ' DRINKT.';
        tick();
      });
    });
  }
  function exposed(a, L, n, msg, next) {
    snd('drink'); drink(a.by, n); L.g = a.by;
    go(function () {
      S.holder = a.by;
      show('<div class="scr center"><div class="grow"></div><div class="big r">GESNAPT!</div>' + av(a.by, 'xl') + '<div class="big y" style="font-size:15px">' + esc(nm(a.by)) + ' ' + msg + '</div><div class="grow"></div>' +
        btn('nx', 'GA NAAR ' + esc(nm(a.by)), '#3bd16f') + '</div>');
      on('nx', next);
    });
  }

  // ---------- round 2: most likely to ----------
  function startR2() {
    S.rn++;
    S.r2 = { prompts: shuffle(PROMPTS).slice(0, 4), p: 0 };
    prompt2();
  }
  function prompt2() {
    var r = S.r2;
    if (r.p >= r.prompts.length) return runNext();
    r.votes = []; vote(0);
  }
  function vote(v) {
    var r = S.r2, all = S.players.map(function (p, i) { return i; });
    if (v >= S.players.length) return reveal();
    pass(v, function () {
      go(function () {
        S.holder = v;
        showF('<div class="scr"><div class="quote"><div class="aa y">' + esc(r.prompts[r.p]) + '</div></div><div class="sub">STEM IN GEHEIM. NIET KIJKEN!</div><div class="scroll">' + pickGrid(all) + '</div></div>');
        bindPicks(function (i) { snd('ok'); r.votes.push(i); vote(v + 1); });
      });
    });
  }
  function reveal() {
    var r = S.r2, n = S.players.length, cnt = S.players.map(function () { return 0; });
    r.votes.forEach(function (i) { cnt[i]++; });
    var max = Math.max.apply(null, cnt), win = [];
    cnt.forEach(function (c, i) { if (c === max && c > 0) { win.push(i); drink(i, c); } });
    snd('drink');
    go(function () {
      var h = '<div class="scr"><div class="quote"><div class="aa y">' + esc(r.prompts[r.p]) + '</div></div><div class="bars">';
      cnt.forEach(function (c, i) {
        h += '<div class="bar' + (win.indexOf(i) >= 0 ? ' win' : '') + '" style="--k:' + COL[i % 8] + '">' + c + av(i, 'sm') + '<div class="col" style="height:' + (max ? Math.max(4, c / max * 120) : 4) + 'px"></div><span style="font-size:8px">' + esc(nm(i)) + '</span></div>';
      });
      h += '</div><div class="big y">' + win.map(function (i) { return esc(nm(i)); }).join(' &amp; ') + (win.length > 1 ? ' DRINKEN ' : ' DRINKT ') + max + '</div><div class="sub">DE TAFEL HEEFT GESPROKEN.</div><div class="grow"></div>' + btn('nx', r.p < r.prompts.length - 1 ? 'VERDER' : 'KLAAR', '#3bd16f') + '</div>';
      show(h);
      on('nx', function () { r.p++; prompt2(); });
    });
  }


  // ---------- WIE HEEFT DIT GEBIECHT + WIENS FOTO IS DIT: typed/taken in setup, only in this phone's localStorage ----------
  var HINTS = ['IK HEB ...', 'IK HEB NOOIT TEGEN IEMAND GEZEGD DAT ...', 'MIJN GROOTSTE LEUGEN IS ...', 'IK BEN STIEKEM ...', 'IK SCHAAM ME NOG ALTIJD VOOR ...'];
  var PHOTO_PROMPTS = ['JE SCHOENEN', 'IETS UIT JE ZAK OF HANDTAS', 'JE LAATSTE FOTO OP JE GSM, HOU HEM VOOR DE CAMERA', 'JE LELIJKSTE GEZICHT', 'JE HAND', 'IETS OP DE TAFEL DAT JOU VOORSTELT'];
  function saveSecs() { try { localStorage.setItem('kabooze.secrets', JSON.stringify(S.secs)); } catch (e) {} }
  function savePhotos() { try { localStorage.setItem('kabooze.photos', JSON.stringify(S.photos)); } catch (e) { /* quota: stay in memory only */ } }
  function confessScreen(k, done) {
    var hint = HINTS[(k + rnd(HINTS.length)) % HINTS.length];
    go(function () {
      S.holder = k;
      showF('<div class="scr"><div class="quote"><div class="aa y" style="font-size:12px">BIECHT IETS DAT NIEMAND HIER WEET.</div></div><div class="sub">BV. ' + hint + '<br>NIEMAND ZIET WIE HET SCHREEF. OVERSLAAN MAG.</div>' +
        '<input type="text" id="conf" maxlength="90" placeholder="' + esc(hint) + '" autocomplete="off" spellcheck="false" value="' + esc(S.draft) + '"><div class="grow"></div>' + btn('psk', 'OVERSLAAN', '#ff9f1c') + btn('pok', 'OK', '#3bd16f') + '</div>');
      var t = $('#conf'); t.addEventListener('input', function () { S.draft = t.value; });
      on('psk', function () { S.draft = ''; done(); });
      on('pok', function () {
        var v = t.value.trim(); S.draft = '';
        if (v) { S.secs.push({ by: k, text: v, used: false }); saveSecs(); }
        snd('ok'); done();
      });
    });
  }
  function toJpeg(src) {
    var c = document.createElement('canvas'); c.width = c.height = 320;
    c.getContext('2d').drawImage(src, 0, 0, 320, 320);
    return c.toDataURL('image/jpeg', 0.7);
  }
  function fileToPhoto(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var s2 = Math.min(im.width, im.height), c = document.createElement('canvas'); c.width = c.height = 320;
        c.getContext('2d').drawImage(im, (im.width - s2) / 2, (im.height - s2) / 2, s2, s2, 0, 0, 320, 320);
        URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.7));
      };
      im.onerror = rej; im.src = url;
    });
  }
  function photoScreen(k, done) {
    var prompt = PHOTO_PROMPTS[rnd(PHOTO_PROMPTS.length)];
    go(function () {
      S.holder = k;
      showF('<div class="scr"><div class="quote"><div class="qq">MAAK 1 FOTO IN HET GEHEIM</div><div class="aa y" style="font-size:13px">' + prompt + '</div></div><div class="sub">NIEMAND ZIET WIE HET IS. OVERSLAAN MAG.</div>' +
        '<input type="file" id="pf" accept="image/*" capture="user" hidden><div class="grow"></div>' + btn('pks', 'OVERSLAAN', '#ff9f1c') + btn('pkc', 'FOTO MAKEN', '#3bd16f') + '</div>');
      var f = $('#pf');
      var opt = { photo: true, prompt: prompt, done: done, save: function (url) { S.photos.push({ by: k, img: url, prompt: prompt, used: false }); savePhotos(); } };
      on('pks', done);
      on('pkc', function () { if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) camScreen(k, opt); else f.click(); });
      f.addEventListener('change', function () {
        if (!f.files[0]) return;
        fileToPhoto(f.files[0]).then(function (u) { opt.save(u); done(); }).catch(done);
      });
    });
  }
  // generic "pick the owner" round over a list of {by,...}
  function nextOwner(R, kind, finish, nextFn) {
    if (!R.left.length) return finish();
    var k = -1, i;
    for (i = 0; i < R.left.length; i++) if (R.left[i].by !== R.g) { k = i; break; }
    if (k < 0) { var by = R.left[0].by; do { R.g = rnd(S.players.length); } while (R.g === by); k = 0; }
    var a = R.left.splice(k, 1)[0], wrong = []; a.used = true;
    pass(R.g, function () { guess(a, wrong, R, kind); });
  }
  function startConf() {
    var avail = S.secs.filter(function (p) { return !p.used; });
    if (!avail.length) return runNext();
    S.rn++; S.r3 = { left: shuffle(avail), g: rnd(S.players.length), lockUntil: 0 }; nextConf();
  }
  function nextConf() { nextOwner(S.r3, 'conf', function () { S.secs = []; saveSecs(); runNext(); }); }
  function startPhoto() {
    var avail = S.photos.filter(function (p) { return !p.used; });
    if (!avail.length) return runNext();
    S.rn++; S.r4 = { left: shuffle(avail), g: rnd(S.players.length), lockUntil: 0 }; nextPhoto();
  }
  function nextPhoto() { nextOwner(S.r4, 'photo', function () { S.photos = []; savePhotos(); runNext(); }); }
  function exposedPhoto(a, L) {
    snd('drink'); drink(a.by, 2); L.g = a.by;
    go(function () {
      S.holder = a.by;
      show('<div class="scr center"><div class="big r" style="font-size:18px">UITGEGEVEN!</div><canvas id="pimg" class="pimg" width="64" height="64"></canvas><img id="pcol" class="pimg col" alt="" hidden>' +
        '<div class="big y" style="font-size:14px">' + esc(nm(a.by)) + ' DRINKT 2. SCHAAMTE.</div><div class="grow"></div><div id="rvw">' + btn('rv', 'TOON ORIGINEEL', '#ff9f1c') + '</div></div>');
      drawDither($('#pimg'), a.img, 64);
      on('rv', function () {
        $('#pimg').hidden = true; var c = $('#pcol'); c.src = a.img; c.hidden = false;
        $('#rvw').innerHTML = btn('nx', 'GA NAAR ' + esc(nm(a.by)), '#3bd16f');
        on('nx', a.by >= 0 ? function () { nextPhoto(); } : null); autoFoc();
      });
    });
  }

  // ---------- round rotation: random order, bomb ticks through all ----------
  var ROUNDS = {
    who: { name: 'WIE ZEI DIT', rule: 'RAAD WIE WIE AANDUIDDE. FOUT = DRINKEN + 3 SECONDEN GEBLOKKEERD.', start: function () { startR1(); } },
    likely: { name: 'WIE ZOU HET EERST', rule: 'STEM IN GEHEIM. DE TAFEL BESLIST.', start: function () { startR2(); } },
    conf: { name: 'WIE HEEFT DIT GEBIECHT', rule: 'EEN GEHEIM OP HET SCHERM. DUID DE BIECHTER AAN. RAAK = HIJ DRINKT 2.', start: function () { startConf(); } },
    photo: { name: 'WIENS FOTO IS DIT', rule: 'EEN FOTO IN GROENE PIXELS. WIE HEEFT ZE GENOMEN? RAAK = HIJ DRINKT 2.', start: function () { startPhoto(); } },
    hot: { name: 'HETE PATAT', rule: 'ZEG ER EEN, TIK, GEEF DOOR. NIKS? DRINKEN.', start: function () { startHot(); } },
    tot: { name: 'DIT OF DAT', rule: 'KIES IN GEHEIM. DE MINDERHEID DRINKT.', start: function () { startTot(); } },
    never: { name: 'IK HEB NOG NOOIT', rule: 'GEDAAN? DRINK. DE HOUDER TIKT OP VERDER.', start: function () { startNever(); } }
  };
  function startCycle() {
    var q = ['who', 'likely', 'hot', 'tot', 'never'];
    if (S.secs.some(function (p) { return !p.used; })) q.push('conf');
    if (S.photos.some(function (p) { return !p.used; })) q.push('photo');
    S.queue = shuffle(q);
    runNext();
  }
  function runNext() {
    if (!S.queue || !S.queue.length) return loopScreen();
    var R = ROUNDS[S.queue.shift()];
    go(function () {
      show('<div class="scr center"><div class="grow"></div><div class="big y" style="font-size:20px">' + R.name + '</div><div class="sub">' + R.rule + '</div><div class="grow"></div>' + btn('go', 'GO', '#3bd16f') + '</div>');
      on('go', function () {
        snd('go');
        if (!S.fuseOn) { if (S.fresh) { resetFuse(); S.fresh = false; } S.fuseOn = true; S.modal = false; }   // fuse starts when the first round begins
        R.start();
      });
    });
  }

  // ---------- HOT POTATO ----------
  function startHot() {
    S.rn++; S.hot = { cats: shuffle(CATEGORIES).slice(0, 5), c: 0, g: rnd(S.players.length) };
    hotTurn();
  }
  function hotTurn() {
    var h = S.hot, n = S.players.length;
    if (h.c >= h.cats.length) return runNext();
    go(function () {
      S.holder = h.g;
      showR('<div class="scr center"><div class="quote"><div class="aa y">' + esc(h.cats[h.c]) + '</div></div>' + av(h.g, 'lg') +
        '<div class="big y" style="font-size:16px">' + esc(nm(h.g)) + ', GO!</div><div class="sub">ZEG ER EEN. TIK. GEEF DOOR.</div><div class="grow"></div>' +
        btn('stk', 'NIKS? DRINK', '#ff9f1c') + btn('got', 'GEZEGD', '#3bd16f') + '</div>');
      on('got', function () { snd('ok'); h.g = (h.g + 1) % n; hotTurn(); });
      on('stk', function () { snd('bad'); drink(h.g, 1); hotStuck(); });
    });
  }
  function hotStuck() {
    var h = S.hot, n = S.players.length, who = h.g;
    go(function () {
      S.holder = who;
      show('<div class="scr center"><div class="grow"></div><div class="big r">NIKS?</div>' + av(who, 'xl') + '<div class="big y" style="font-size:15px">' + esc(nm(who)) + ' DRINKT. SKILL ISSUE.</div><div class="grow"></div>' + btn('nx', 'VERDER', '#3bd16f') + '</div>');
      on('nx', function () { h.c++; h.g = (who + 1) % n; hotTurn(); });
    });
  }

  // ---------- THIS OR THAT ----------
  function startTot() {
    S.rn++; S.tot = { d: shuffle(DILEMMAS).slice(0, 4), votes: [] };
    totPlayer(0);
  }
  function totPlayer(v) {
    if (v >= S.players.length) return totReveal(0);
    pass(v, function () { totAsk(v, 0, []); });
  }
  function totAsk(v, k, ans) {
    var t = S.tot;
    if (k >= t.d.length) { t.votes[v] = ans; return totPlayer(v + 1); }
    go(function () {
      S.holder = v; var d = t.d[k];
      showF('<div class="scr"><h2>DIT OF DAT?</h2><div class="grow"></div><div class="grid c2">' +
        '<button class="pick" data-i="0" style="min-height:170px;font-size:11px;line-height:1.7;justify-content:center">' + esc(d.a) + '</button>' +
        '<button class="pick" data-i="1" style="min-height:170px;font-size:11px;line-height:1.7;justify-content:center">' + esc(d.b) + '</button></div>' +
        '<div class="sub">' + (k + 1) + ' OF ' + t.d.length + '. LEFT OR RIGHT, THEN A.</div><div class="grow"></div></div>');
      bindPicks(function (i) { snd('ok'); ans.push(i); totAsk(v, k + 1, ans); });
    });
  }
  function totReveal(k) {
    var t = S.tot, n = S.players.length;
    if (k >= t.d.length) return runNext();
    var d = t.d[k], side = [[], []], i;
    for (i = 0; i < n; i++) side[t.votes[i][k]].push(i);
    var a = side[0].length, b = side[1].length, msg, losers = [];
    if (a === b) { msg = 'GELIJK. IEDEREEN DRINKT.'; losers = side[0].concat(side[1]); }
    else if (!a || !b) { msg = 'IEDEREEN GELIJK. NIEMAND DRINKT.'; }
    else { losers = a < b ? side[0] : side[1]; msg = 'DE MINDERHEID DRINKT.'; }
    losers.forEach(function (p) { drink(p, 1); });
    snd(losers.length ? 'drink' : 'ok');
    go(function () {
      var col = function (txt, who) {
        return '<div class="tcol"><div class="tt">' + esc(txt) + '</div><div class="big y">' + who.length + '</div><div class="tn">' + who.map(function (p) { return esc(nm(p)); }).join('<br>') + '</div></div>';
      };
      show('<div class="scr"><div class="grid c2">' + col(d.a, side[0]) + col(d.b, side[1]) + '</div><div class="big y" style="font-size:14px;line-height:1.5">' + msg + '</div><div class="grow"></div>' + btn('nx', k < t.d.length - 1 ? 'VERDER' : 'KLAAR', '#3bd16f') + '</div>');
      on('nx', function () { totReveal(k + 1); });
    });
  }

  // ---------- NEVER HAVE I EVER ----------
  function startNever() { S.rn++; S.nv = { l: shuffle(NEVERS).slice(0, 5), i: 0 }; neverShow(); }
  function neverShow() {
    var nv = S.nv;
    if (nv.i >= nv.l.length) return runNext();
    go(function () {
      show('<div class="scr center"><div class="grow"></div><div class="quote"><div class="aa y">' + esc(nv.l[nv.i]) + '</div></div><div class="sub">GEDAAN? DRINK.</div><div class="grow"></div>' + btn('nx', nv.i < nv.l.length - 1 ? 'VERDER' : 'KLAAR', '#3bd16f') + '</div>');
      on('nx', function () { snd('ok'); nv.i++; neverShow(); });
    });
  }

  // ---------- loop / end ----------
  function loopScreen() {
    go(function () {
      show('<div class="scr center"><div class="grow"></div><div class="big y">NOG EEN RONDE?</div><div class="sub">NIEUWE VRAGEN, DEZELFDE BOM.</div><div class="grow"></div>' + btn('again', 'NOG EEN RONDE', '#3bd16f') + btn('end', 'STOPPEN', '#ff3b3b') + '</div>');
      on('again', function () { secrets(0, []); });
      on('end', endScreen);
    });
  }
  function endScreen() {
    stopGame(); S.secs = []; S.photos = []; saveSecs(); savePhotos();
    go(function () {
      bar();
      var ord = S.players.map(function (p, i) { return i; }).sort(function (a, b) { return S.drinks[b] - S.drinks[a]; });
      var h = '<div class="scr"><h2 class="r">EINDE</h2><div class="sub">SLOKKEN</div><div class="scroll"><div class="tally">';
      ord.forEach(function (i) { h += '<div class="row">' + av(i, 'sm') + '<span class="nm">' + esc(nm(i)) + '</span><span class="y">' + S.drinks[i] + '</span></div>'; });
      h += '</div></div>' + btn('pa', 'NOG EENS', '#3bd16f') + '</div>';
      show(h);
      on('pa', startGame);
    });
  }

  (function () {
    var w = ['BOOT', 'LOAD', 'BOMB.SYS', 'FUSE', 'OK', 'READY', 'PLAYER', 'DRINK', 'TICK', 'SYNC'], out = '', i, j, l;
    for (i = 0; i < 90; i++) {
      l = '0x' + (4096 + i * 16).toString(16).toUpperCase();
      for (j = 0; j < 3; j++) l += ' ' + ('0' + rnd(256).toString(16)).slice(-2).toUpperCase();
      out += (i % 5 === 0 ? '> ' + w[rnd(w.length)] + '\n' : l + '\n');
    }
    $('#hexl').textContent = out + out; $('#hexr').textContent = out.split('').reverse().join('') + out;
  })();
  window.KABOOZE = { S: S, roulette: roulette, pickSlice: pickSlice, runNext: runNext };
  title();
})();
