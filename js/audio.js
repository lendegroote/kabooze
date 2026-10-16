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
