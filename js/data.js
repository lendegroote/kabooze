// Content loader. Source of truth: data/content.json (stable ids). js/content-fallback.js is a generated inline copy
// used until/unless the fetch works. Items whose id is in localStorage "kabooze_removed" are skipped on this device.
var QUESTIONS = [], PROMPTS = [], TRUTHS = [], DARES = [], ROULETTE = [], CATEGORIES = [], DILEMMAS = [], NEVERS = [];
var REMOVED_KEY = 'kabooze_removed', CUSTOM_KEY = 'kabooze_custom';
var CUSTOM_POSTS = [];   // {author, text}, matched to player names at game start
function getCustom() { try { return JSON.parse(localStorage.getItem(CUSTOM_KEY)) || []; } catch (e) { return []; } }
function getRemoved() { try { return JSON.parse(localStorage.getItem(REMOVED_KEY)) || []; } catch (e) { return []; } }
function applyContent(items) {
  var rm = getRemoved();
  var map = [
    ['who', QUESTIONS, function (x) { return x.text; }], ['likely', PROMPTS, function (x) { return x.text; }],
    ['truth', TRUTHS, function (x) { return x.text; }], ['dare', DARES, function (x) { return x.text; }],
    ['roulette', ROULETTE, function (x) { return x; }], ['category', CATEGORIES, function (x) { return x.text; }],
    ['tot', DILEMMAS, function (x) { return { a: x.a, b: x.b }; }], ['never', NEVERS, function (x) { return x.text; }]
  ];
  map.forEach(function (m) {
    var all = items.filter(function (x) { return x.type === m[0]; });
    var keep = all.filter(function (x) { return rm.indexOf(x.id) < 0; });
    if (!keep.length) keep = all;               // never leave a type empty
    m[1].length = 0;
    keep.forEach(function (x) { m[1].push(m[2](x)); });
    getCustom().forEach(function (x) { if (x.type === m[0] && (x.text || x.a)) m[1].push(m[2](x)); });
  });
  CUSTOM_POSTS.length = 0;
  getCustom().forEach(function (x) { if (x.type === 'post' && x.text) CUSTOM_POSTS.push({ author: x.author || '', text: x.text }); });
}
applyContent(FALLBACK_CONTENT);
try {
  fetch('data/content.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (j) { if (Array.isArray(j) && j.length) applyContent(j); }).catch(function () {});
} catch (e) {}
