// KABOOZE: tap-only party game. DOM screens, canvas only for avatars, bomb and roulette.
(function () {
  var COL = ['#9cff57', '#6fd13a', '#3a7a22', '#9cff57', '#6fd13a', '#3a7a22', '#9cff57', '#6fd13a'];
  var KEY = 'kabooze.players';
  var $ = function (s) { return document.querySelector(s); };
  var card = $('#card'), over = $('#over');

  var S = {
    players: loadPlayers(), snd: true, paused: false, modal: false, fuseOn: false, left: 0, acc: 0,
    drinks: [], dbl: [], rn: 0, total: 1, cur: null, holder: 0, ans: [], r1: null, r2: null, usedQ: [], inGame: false, draft: ''
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
  function snd(n) { if (S.snd) try { SFX[n](); } catch (e) {} }
  function nm(i) { return S.players[i].name || ('P' + (i + 1)); }
  function show(html) { card.innerHTML = html; }
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
  function resetFuse() { S.total = S.left = (45 + rnd(76)) * 1000; S.acc = 0; }
  var last = performance.now();
  setInterval(function () {
    var now = performance.now(), dt = now - last; last = now;
    if (!S.fuseOn || S.paused || S.modal) return;
    S.left -= dt; S.acc += dt;
    var p = 1 - Math.max(S.left, 0) / S.total, iv = 1000 * Math.pow(0.12, Math.pow(p, 1.7));
    if (S.acc >= iv) { S.acc = 0; if (S.snd) try { beep(900 + p * 900, 0.04, 0, 0.09); } catch (e) {} }
    $('#tb').classList.toggle('hot', S.left < 10000);
    if (S.left <= 0) explode();
  }, 40);

  function explode() {
    S.modal = true;
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
  var WT = ROULETTE.reduce(function (t, r) { return t + r.wt; }, 0);
  function wheelCanvas() {
    var c = document.createElement('canvas'); c.width = c.height = 160;
    var g = c.getContext('2d'), acc = 0;
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
    var x = Math.random() * WT, acc = 0;
    for (var i = 0; i < ROULETTE.length; i++) { acc += ROULETTE[i].wt; if (x < acc) return { i: i, mid: (acc - ROULETTE[i].wt + (x - (acc - ROULETTE[i].wt))) / WT * 360 }; }
  }
  function resultText(r, who) {
    if (r.k === 'truth') return TRUTHS[rnd(TRUTHS.length)];
    if (r.k === 'dare') return DARES[rnd(DARES.length)];
    if (r.k === 'confess') {
      var a = S.ans.filter(function (x) { return x.by === who; })[0];
      return a ? 'TELL THE TABLE WHO YOU PICKED FOR "' + a.q + '"' : 'TELL THE TABLE A SECRET.';
    }
    return r.d;
  }
  function roulette(who) {
    over.hidden = true; over.className = ''; over.onclick = null;
    S.modal = true;
    show('<div class="scr center"><h2>' + esc(nm(who)) + ' SPINS!</h2><div class="wheelwrap"><div class="ptr"></div></div><div id="res" style="width:100%"></div></div>');
    var w = card.querySelector('.wheelwrap'), c = wheelCanvas();
    w.appendChild(c);
    var hub = document.createElement('i'); hub.className = 'hub'; w.appendChild(hub);
    var res = $('#res');
    res.innerHTML = btn('spin', 'TAP TO SPIN', '#ff3b3b');
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
        res.innerHTML = '<div class="big y" style="margin-bottom:10px">' + r.n + '</div><div class="sub" style="margin-bottom:10px">' + esc(resultText(r, who)) + '</div>' + btn('cont', 'CONTINUE', '#3bd16f');
        on('cont', function () { S.modal = false; resetFuse(); S.cur(); });
      }, 4400);
    }
    on('spin', spin); c.addEventListener('click', spin);
  }

  // ---------- top bar / menu ----------
  function bar() {
    $('#back').style.visibility = S.cur === title ? 'hidden' : 'visible';
    $('#tb').style.visibility = S.cur === title ? 'hidden' : 'visible';
  }
  $('#back').addEventListener('click', function () {
    if (S.cam) { stopCam(); return setup(); }
    if (S.cur === setup) return go(title);
    if (S.inGame) return confirmBox('QUIT THE GAME?', function () { stopGame(); go(setup); });
    go(title);
  });
  $('#menu').addEventListener('click', function () {
    var was = S.paused; S.paused = true;
    function close() { over.hidden = true; over.className = ''; S.paused = was; }
    over.hidden = false; over.className = '';
    over.innerHTML = '<div class="box"><h2>PAUSED</h2>' + btn('m1', 'RESUME', '#3bd16f') +
      (S.inGame ? btn('m2', 'RESTART', '#ff9f1c') : '') + btn('m3', 'EDIT PLAYERS', '#3ec6ff') +
      btn('m4', 'SOUND: ' + (S.snd ? 'ON' : 'OFF'), '#ffd23f') + '</div>';
    on('m1', close);
    on('m2', function () { close(); stopGame(); startGame(); });
    on('m3', function () { close(); stopGame(); go(setup); });
    on('m4', function () { S.snd = !S.snd; $('#m4').textContent = 'SOUND: ' + (S.snd ? 'ON' : 'OFF'); });
  });
  function confirmBox(msg, yes) {
    over.hidden = false; over.className = '';
    over.innerHTML = '<div class="box"><h2>' + msg + '</h2>' + btn('cy', 'YES', '#ff3b3b') + btn('cn', 'NO', '#3bd16f') + '</div>';
    on('cy', function () { over.hidden = true; yes(); });
    on('cn', function () { over.hidden = true; });
  }
  document.addEventListener('pointerdown', function () { unlock(); }, { once: true });


  // ---------- Game Boy controls: D-pad moves a highlight, A confirm, B back, START menu, SELECT sound ----------
  function ctx() { return over.hidden ? card : over; }
  function targets() {
    return [].slice.call(ctx().querySelectorAll('.pick:not(.bad),.btn,input[type=text]')).filter(function (e) { return e.offsetParent; });
  }
  function curFoc() { return ctx().querySelector('.foc'); }
  function setFoc(e) {
    document.querySelectorAll('.foc').forEach(function (x) { x.classList.remove('foc'); });
    if (e) { e.classList.add('foc'); try { e.scrollIntoView({ block: 'nearest' }); } catch (x) {} }
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
    unlock();
    if (k === 'up' || k === 'down' || k === 'left' || k === 'right') return nav(k);
    if (k === 'a') { var f = curFoc(); if (!f) return autoFoc(); if (f.tagName === 'INPUT') f.focus(); else f.click(); return; }
    if (k === 'b') {
      if (!over.hidden) { var x = over.querySelector('#m1,#cn,#hx'); if (x) x.click(); else if (over.className === 'boom') over.click(); return; }
      return $('#back').click();
    }
    if (k === 'start') { var m = over.querySelector('#m1'); return m ? m.click() : (over.hidden && $('#menu').click()); }
    if (k === 'select') { S.snd = !S.snd; var m4 = $('#m4'); if (m4) m4.textContent = 'SOUND: ' + (S.snd ? 'ON' : 'OFF'); snd('ok'); }
  }
  document.querySelectorAll('#ctl [data-k]').forEach(function (b) {
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); b.classList.add('dn'); press(b.dataset.k); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function () { b.classList.remove('dn'); }); });
  });
  var KM = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', x: 'a', X: 'a', z: 'b', Z: 'b', Enter: 'start', Shift: 'select' };
  document.addEventListener('keydown', function (e) {
    var a = document.activeElement;
    if (a && a.tagName === 'INPUT') { if (e.key === 'Enter') a.blur(); return; }
    if (KM[e.key]) { e.preventDefault(); press(KM[e.key]); }
  });

  // ---------- title ----------
  function title() {
    S.cur = title; bar();
    show('<div class="scr center"><div class="logo"><span class="r">K</span><span class="o">A</span><span class="y">B</span><canvas class="bomb" width="16" height="16"></canvas><span class="g">O</span><span class="c">Z</span><span class="p">E</span></div>' +
      '<div class="sub">THE PARTY GAME WITH A HIDDEN BOMB</div><div class="grow"></div><div class="inv-row"><canvas class="inv" width="11" height="8"></canvas><canvas class="bomb bigbomb" width="16" height="16"></canvas><canvas class="inv" width="11" height="8"></canvas></div><div class="grow"></div>' +
      '<div style="width:100%">' + btn('start', 'START', '#3bd16f') + btn('how', 'HOW TO PLAY', '#3ec6ff', 'sm') + '</div></div>');
    card.querySelector('#how').style.width = '100%';
    on('start', function () { go(setup); });
    on('how', function () {
      over.hidden = false; over.className = '';
      over.innerHTML = '<div class="box"><h2>HOW TO PLAY</h2><div class="how"><div>1. ADD EVERYONE. TAP SOMEONE FOR EACH QUESTION.</div><div>2. GUESS WHO PICKED WHO. WRONG GUESS = DRINK.</div><div>3. RIGHT GUESS = THAT PERSON DRINKS AND PLAYS NEXT.</div><div>4. THEN VOTE: WHO IS MOST LIKELY TO...</div><div>5. THE BOMB IS HIDDEN. DO NOT HOLD THE PHONE WHEN IT GOES KABOOM.</div><div class="y">WATER COUNTS. KNOW YOUR LIMIT.</div></div>' + btn('hx', 'GOT IT', '#3bd16f') + '</div>';
      on('hx', function () { over.hidden = true; });
    });
  }

  // ---------- setup step A: players ----------
  function setup() {
    S.cur = setup; S.inGame = false; bar();
    var P = S.players, h = '<div class="scr"><h2>WHO IS PLAYING?</h2><div class="scroll"><div class="grid c2" id="tiles">';
    P.forEach(function (p, i) {
      h += '<div class="pcard" style="--k:' + COL[i % 8] + '"><div class="thumb" data-i="' + i + '">' + av(i, 'lg') + '</div>' +
        '<input type="text" maxlength="8" placeholder="NAME" value="' + esc(p.name) + '" data-i="' + i + '" autocomplete="off" autocapitalize="characters" spellcheck="false">' +
        '<div class="acts">' + btn('s' + i, 'SELFIE', COL[i % 8], 'sm') + (P.length > 2 ? btn('x' + i, 'X', '#ff3b3b', 'sm') : '') + '</div>' +
        '<input type="file" accept="image/*" capture="user" hidden data-i="' + i + '"></div>';
    });
    h += '</div>' + (P.length < 8 ? btn('add', 'ADD PLAYER', '#3ec6ff') : '') + '</div><div class="toast" id="toast"></div>' + btn('go', "NEXT", '#3bd16f') + '</div>';
    show(h);
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
        RemiAvatar.fromFile(f.files[0]).then(function (c) { P[i].av = c.toDataURL(); save(); pc.querySelector('img').src = P[i].av; }).catch(function () { $('#toast').textContent = 'PHOTO FAILED'; });
      });
      var x = pc.querySelector('#x' + i);
      if (x) x.addEventListener('click', function () { P.splice(i, 1); initCache = {}; save(); setup(); });
    });
    on('add', function () { P.push({ name: '', av: '' }); save(); setup(); var s = card.querySelector('.scroll'); s.scrollTop = s.scrollHeight; });
    on('go', function () {
      if (P.some(function (p) { return !p.name; })) { $('#toast').textContent = 'EVERYONE NEEDS A NAME'; snd('bad'); return; }
      save(); startGame();
    });
  }


  // ---------- selfie camera (getUserMedia, live green dither preview) ----------
  function stopCam() {
    var c = S.cam; if (!c) return;
    S.cam = null; clearInterval(c.iv);
    if (c.stream) c.stream.getTracks().forEach(function (t) { t.stop(); });
  }
  function camSquare(v, t) {
    var s = Math.min(v.videoWidth, v.videoHeight), g = t.getContext('2d');
    g.save(); g.translate(t.width, 0); g.scale(-1, 1);
    g.drawImage(v, (v.videoWidth - s) / 2, (v.videoHeight - s) / 2, s, s, 0, 0, t.width, t.height);
    g.restore(); return t;
  }
  function camFail(i) {
    stopCam();
    show('<div class="scr center"><div class="grow"></div><h2>NO CAMERA</h2><div class="sub">PICK OR TAKE A PHOTO INSTEAD.</div><div class="grow"></div><input type="file" id="cf" accept="image/*" capture="user" hidden>' + btn('cfb', 'CHOOSE PHOTO', '#3bd16f') + btn('cfx', 'BACK', '#ff9f1c') + '</div>');
    var f = $('#cf');
    on('cfb', function () { f.click(); });
    on('cfx', setup);
    f.addEventListener('change', function () {
      if (!f.files[0]) return;
      RemiAvatar.fromFile(f.files[0]).then(function (c) { S.players[i].av = c.toDataURL(); save(); setup(); }).catch(function () { setup(); });
    });
  }
  function camScreen(i) {
    stopCam();
    show('<div class="scr"><h2>SMILE, ' + esc(nm(i)) + '</h2><div class="grow camwrap"><canvas id="cv" width="32" height="32"></canvas></div><div class="toast" id="toast">STARTING CAMERA...</div><div id="cbtns" style="width:100%"></div></div>');
    var cam = S.cam = { stream: null, iv: 0 };
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false }).then(function (stream) {
      if (S.cam !== cam) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
      cam.stream = stream;
      var v = document.createElement('video'); v.muted = true; v.setAttribute('playsinline', ''); v.srcObject = stream; v.play();
      var cv = $('#cv'), g = cv.getContext('2d'), small = document.createElement('canvas'), big = document.createElement('canvas');
      small.width = small.height = 64; big.width = big.height = 480;
      $('#toast').textContent = '';
      $('#cbtns').innerHTML = btn('snap', 'SNAP', '#3bd16f'); autoFoc();
      cam.iv = setInterval(function () { if (v.videoWidth) g.drawImage(RemiAvatar.fromSource(camSquare(v, small)), 0, 0); }, 100);
      on('snap', function () {
        if (!v.videoWidth) return;
        var out = RemiAvatar.fromSource(camSquare(v, big));
        clearInterval(cam.iv); stream.getTracks().forEach(function (t) { t.stop(); });
        g.drawImage(out, 0, 0); snd('ok');
        $('#cbtns').innerHTML = btn('use', 'USE IT', '#3bd16f') + btn('re', 'RETAKE', '#ff9f1c'); autoFoc();
        on('use', function () { S.players[i].av = out.toDataURL(); save(); stopCam(); setup(); });
        on('re', function () { camScreen(i); });
      });
    }).catch(function () { if (S.cam === cam) camFail(i); });
  }

  // ---------- game start ----------
  function stopGame() { S.fuseOn = false; S.inGame = false; S.modal = false; $('#tb').classList.remove('hot'); }
  function startGame() {
    S.drinks = S.players.map(function () { return 0; });
    S.usedQ = []; S.dbl = []; S.rn = 0; S.inGame = true; S.fuseOn = true; S.modal = false; resetFuse();
    secrets(0, []);
  }
  function pass(i, next) {
    S.holder = i;
    go(function () {
      S.holder = i;
      show('<div class="scr center"><div class="grow"></div><div class="big">PASS TO</div><div class="big y">' + esc(nm(i)) + '</div><div class="sub">DON\'T PEEK, LOSER.</div>' + av(i, 'xl') + '<div class="grow"></div>' + btn('ok', "I'M " + esc(nm(i)) + ', GO', '#3bd16f') + '</div>');
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
    if (k >= S.players.length) { S.ans = list; return startR1(); }
    pass(k, function () {
      var q = newQ();
      go(function () {
        S.holder = k;
        var others = S.players.map(function (p, i) { return i; }).filter(function (i) { return i !== k; });
        show('<div class="scr"><div class="quote"><div class="aa y">' + esc(q) + '</div></div>' +
          '<div class="sub">PICK SOMEONE AT THE TABLE. NOBODY WILL KNOW IT WAS YOU... YET.</div>' +
          '<div class="scroll">' + pickGrid(others) + '</div>' + btn('re', 'NEW QUESTION', '#ff9f1c', 'sm') + '</div>');
        on('re', function () { S.usedQ.push(q); q = newQ(); S.cur(); });
        bindPicks(function (i) {
          S.usedQ.push(q); snd('ok');
          list.push({ by: k, q: q, pick: i });
          secrets(k + 1, list);
        });
        // reroll keeps the new question: S.cur re-reads q via closure
      });
    });
  }

  // ---------- round 1: who said it ----------
  function startR1() {
    S.rn++;
    S.r1 = { left: shuffle(S.ans), g: rnd(S.players.length) };
    nextSecret();
  }
  function nextSecret() {
    var r = S.r1;
    if (!r.left.length) return startR2();
    var k = -1;
    for (var i = 0; i < r.left.length; i++) if (r.left[i].by !== r.g) { k = i; break; }
    if (k < 0) { // only own answers left: hand over to someone else
      var by = r.left[0].by;
      do { r.g = rnd(S.players.length); } while (r.g === by);
      k = 0;
    }
    var a = r.left.splice(k, 1)[0], wrong = [];
    pass(r.g, function () { guess(a, wrong); });
  }
  function guess(a, wrong) {
    var g = S.r1.g, all = S.players.map(function (p, i) { return i; });
    go(function () {
      S.holder = g;
      show('<div class="scr"><div class="quote"><div class="qq">' + esc(a.q) + '</div><div class="aa y">&gt; ' + esc(nm(a.pick)) + '</div></div>' +
        '<h2>WHO SAID IT?</h2><div class="scroll">' + pickGrid(all, null, function (i) { return wrong.indexOf(i) >= 0 ? 'bad' : ''; }) + '</div><div class="toast" id="toast"></div></div>');
      bindPicks(function (i, b) {
        if (i === a.by) return exposed(a);
        wrong.push(i); drink(g, 1); snd('bad');
        b.classList.add('shake', 'bad');
        $('#toast').textContent = 'NOPE. YOU KNOW NOBODY. ' + nm(g) + ' DRINK.';
      });
    });
  }
  function exposed(a) {
    snd('drink'); drink(a.by, 1); S.r1.g = a.by;
    go(function () {
      S.holder = a.by;
      show('<div class="scr center"><div class="grow"></div><div class="big r">EXPOSED!</div>' + av(a.by, 'xl') + '<div class="big y" style="font-size:15px">' + esc(nm(a.by)) + ' SAID IT. DRINK, SNITCH.</div><div class="grow"></div>' +
        btn('nx', 'GO TO ' + esc(nm(a.by)), '#3bd16f') + '</div>');
      on('nx', nextSecret);
    });
  }

  // ---------- round 2: most likely to ----------
  function startR2() {
    S.rn++;
    S.r2 = { prompts: shuffle(PROMPTS).slice(0, 3), p: 0 };
    prompt2();
  }
  function prompt2() {
    var r = S.r2;
    if (r.p >= r.prompts.length) return loopScreen();
    r.votes = []; vote(0);
  }
  function vote(v) {
    var r = S.r2, all = S.players.map(function (p, i) { return i; });
    if (v >= S.players.length) return reveal();
    pass(v, function () {
      go(function () {
        S.holder = v;
        show('<div class="scr"><div class="quote"><div class="aa y">' + esc(r.prompts[r.p]) + '</div></div><div class="sub">TAP YOUR VOTE. SECRET!</div><div class="scroll">' + pickGrid(all) + '</div></div>');
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
      h += '</div><div class="big y">' + win.map(function (i) { return esc(nm(i)); }).join(' &amp; ') + ' DRINK' + (win.length > 1 ? '' : 'S') + ' ' + max + '</div><div class="sub">THE TABLE HAS SPOKEN.</div><div class="grow"></div>' + btn('nx', r.p < 2 ? 'NEXT' : 'DONE', '#3bd16f') + '</div>';
      show(h);
      on('nx', function () { r.p++; prompt2(); });
    });
  }

  // ---------- loop / end ----------
  function loopScreen() {
    go(function () {
      show('<div class="scr center"><div class="grow"></div><div class="big y">ANOTHER ROUND?</div><div class="sub">NEW QUESTIONS, SAME BOMB.</div><div class="grow"></div>' + btn('again', 'ANOTHER ROUND', '#3bd16f') + btn('end', 'FINISH', '#ff3b3b') + '</div>');
      on('again', function () { secrets(0, []); });
      on('end', endScreen);
    });
  }
  function endScreen() {
    stopGame();
    go(function () {
      bar();
      var ord = S.players.map(function (p, i) { return i; }).sort(function (a, b) { return S.drinks[b] - S.drinks[a]; });
      var h = '<div class="scr"><h2 class="r">GAME OVER</h2><div class="sub">SIPS TAKEN</div><div class="scroll"><div class="tally">';
      ord.forEach(function (i) { h += '<div class="row">' + av(i, 'sm') + '<span class="nm">' + esc(nm(i)) + '</span><span class="y">' + S.drinks[i] + '</span></div>'; });
      h += '</div></div>' + btn('pa', 'PLAY AGAIN', '#3bd16f') + '</div>';
      show(h);
      on('pa', startGame);
    });
  }

  window.KABOOZE = { S: S, roulette: roulette, pickSlice: pickSlice };
  title();
})();
