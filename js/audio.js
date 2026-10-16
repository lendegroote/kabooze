// Web Audio square-wave beeps. unlock() must run from a user gesture.
var AC = null;
function unlock() {
  if (!AC) {
    var A = window.AudioContext || window.webkitAudioContext;
    if (A) AC = new A();
  }
  if (AC && AC.state === 'suspended') AC.resume();
}
function beep(f, d, delay, vol, slide) {
  if (!AC) return;
  var t0 = AC.currentTime + (delay || 0), v = vol || 0.07;
  var o = AC.createOscillator(), gn = AC.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(f, t0);
  if (slide) o.frequency.linearRampToValueAtTime(slide, t0 + d);
  gn.gain.setValueAtTime(v, t0);
  gn.gain.setValueAtTime(v, t0 + d * 0.7);
  gn.gain.linearRampToValueAtTime(0.0001, t0 + d);
  o.connect(gn); gn.connect(AC.destination);
  o.start(t0); o.stop(t0 + d + 0.03);
}
function seq(notes, step, d) { notes.forEach(function (f, i) { beep(f, d || step, i * step); }); }
var SFX = {
  move: function () { beep(440, 0.05); },
  ok: function () { beep(660, 0.06); beep(880, 0.1, 0.06); },
  tick: function () { beep(1300, 0.025, 0, 0.05); },
  ding: function () { beep(1047, 0.08); beep(2093, 0.5, 0.08); },
  drink: function () { seq([523, 659, 784, 1047, 784, 1047], 0.11, 0.1); },
  win: function () { seq([784, 988, 1319], 0.09, 0.09); },
  bad: function () { beep(220, 0.3, 0, 0.09, 110); },
  boom: function () { beep(220, 0.7, 0, 0.12, 35); },
  go: function () { beep(1568, 0.25, 0, 0.09); }
};

// ---------- background music: original oompah/polka chiptune, 16 bars, ~130 BPM, Web Audio only ----------
var SFXfan = function () { seq([523, 659, 784, 1047, 784, 1047, 1319], 0.1, 0.12); };
SFX.fanfare = SFXfan;
var MUS = { on: true, run: false, hold: false, mul: 1, step: 0, next: 0, timer: 0, gain: null, noise: null };
(function () {
  var mf = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
  // chord per bar: [bass root, bass fifth, stab notes]
  var C = [48, 43, [60, 64, 67]], F = [41, 48, [60, 65, 69]], G = [43, 50, [59, 62, 67]];
  var CH = [C, C, F, C, G, G, C, C, F, F, C, C, G, G, C, C];
  var LEAD = [
    [76, 79, 76, 72], [74, 76, 79, 0], [77, 81, 77, 72], [76, 72, 76, 79], [74, 79, 74, 71], [71, 74, 77, 74], [76, 79, 84, 79], [72, 76, 79, 0],
    [81, 77, 81, 84], [81, 79, 77, 72], [79, 76, 79, 84], [79, 76, 72, 0], [83, 79, 74, 79], [77, 74, 71, 74], [76, 79, 84, 79], [84, 79, 76, 72]
  ];
  function tone(type, f, t, d, v) {
    var o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(MUS.gain); o.start(t); o.stop(t + d + 0.02);
  }
  function hat(t, v) {
    var s = AC.createBufferSource(), g = AC.createGain(), hp = AC.createBiquadFilter();
    s.buffer = MUS.noise; hp.type = 'highpass'; hp.frequency.value = 6000;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    s.connect(hp); hp.connect(g); g.connect(MUS.gain); s.start(t); s.stop(t + 0.05);
  }
  function play(step, t, sd) {
    var bar = step >> 3, s = step & 7, c = CH[bar];
    if (s === 0) tone('triangle', mf(c[0]), t, sd * 3.2, 0.11);
    if (s === 4) tone('triangle', mf(c[1]), t, sd * 3.2, 0.11);
    if (s === 2 || s === 6) c[2].forEach(function (m) { tone('square', mf(m), t, sd * 1.6, 0.012); });
    if (!(s & 1)) hat(t, s === 2 || s === 6 ? 0.05 : 0.025);
    if (!(s & 1)) { var n = LEAD[bar][s >> 1]; if (n) tone('square', mf(n), t, sd * 1.7, 0.03); }
  }
  function pump() {
    if (!AC || !MUS.run) return;
    while (MUS.next < AC.currentTime + 0.15) {
      var sd = 60 / (130 * MUS.mul) / 4;
      play(MUS.step, MUS.next, sd);
      MUS.next += sd; MUS.step = (MUS.step + 1) % 128;
    }
  }
  MUS.start = function () {
    if (!AC || !MUS.on || MUS.run || MUS.hold) return;
    if (AC.state === 'suspended') AC.resume();
    if (!MUS.gain) { MUS.gain = AC.createGain(); MUS.gain.connect(AC.destination); }
    if (!MUS.noise) { MUS.noise = AC.createBuffer(1, 2205, 44100); var d = MUS.noise.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    MUS.gain.gain.cancelScheduledValues(0); MUS.gain.gain.setValueAtTime(1, AC.currentTime);
    MUS.run = true; MUS.next = AC.currentTime + 0.05;
    MUS.timer = setInterval(pump, 30);
  };
  MUS.stop = function () {
    MUS.run = false; clearInterval(MUS.timer);
    if (MUS.gain && AC) { MUS.gain.gain.cancelScheduledValues(0); MUS.gain.gain.setValueAtTime(0, AC.currentTime); }
  };
})();
