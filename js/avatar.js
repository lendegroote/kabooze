// RemiAvatar: selfie -> 32x32 canvas in 4 phosphor greens (Bayer 4x4 dither).
// RemiAvatar.fromFile(file) -> Promise<HTMLCanvasElement>
// RemiAvatar.fallback(i)    -> HTMLCanvasElement (32x32), i = 1..8 (wraps), sprite fills in once the svg loads
(function () {
  var SIZE = 32;
  var PAL = [[11, 20, 11], [58, 122, 34], [111, 209, 58], [156, 255, 87]];
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  var CONTRAST = 1.25;

  function loadSource(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file).catch(function () { return loadImg(file); });
    }
    return loadImg(file);
  }

  function loadImg(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('bad image')); };
      img.src = url;
    });
  }

  function newCanvas() {
    var c = document.createElement('canvas');
    c.width = c.height = SIZE;
    return c;
  }

  function fromFile(file) { return loadSource(file).then(process); }
  // src = canvas/img/bitmap, returns the 32x32 dithered canvas (sync, cheap enough for a live preview)
  function process(src) {
      var w = src.width, h = src.height, s = Math.min(w, h);
      // centre-crop square, downscale in halving steps for a clean average
      var cur = document.createElement('canvas');
      cur.width = cur.height = s;
      cur.getContext('2d').drawImage(src, (w - s) / 2, (h - s) / 2, s, s, 0, 0, s, s);
      while (cur.width > SIZE * 2) {
        var n = document.createElement('canvas');
        n.width = n.height = Math.max(SIZE, cur.width >> 1);
        var nx = n.getContext('2d');
        nx.imageSmoothingQuality = 'high';
        nx.drawImage(cur, 0, 0, n.width, n.height);
        cur = n;
      }
      var small = newCanvas();
      var sx = small.getContext('2d');
      sx.imageSmoothingQuality = 'high';
      sx.drawImage(cur, 0, 0, SIZE, SIZE);
      var data = sx.getImageData(0, 0, SIZE, SIZE);
      var px = data.data, lum = new Float32Array(SIZE * SIZE), i;
      for (i = 0; i < lum.length; i++) {
        lum[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
      }
      // auto-levels on 5th..95th percentile, then contrast boost
      var sorted = Array.prototype.slice.call(lum).sort(function (a, b) { return a - b; });
      var lo = sorted[Math.floor(sorted.length * 0.05)];
      var hi = sorted[Math.floor(sorted.length * 0.95)];
      var span = Math.max(hi - lo, 1);
      for (i = 0; i < lum.length; i++) {
        var v = Math.min(1, Math.max(0, (lum[i] - lo) / span));
        lum[i] = Math.min(1, Math.max(0, (v - 0.5) * CONTRAST + 0.5));
      }
      // Bayer 4x4 ordered dither to 4 levels
      for (var y = 0; y < SIZE; y++) {
        for (var x = 0; x < SIZE; x++) {
          var k = y * SIZE + x;
          var t = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
          var lvl = Math.min(3, Math.floor(lum[k] * 3 + t));
          var c = PAL[lvl];
          px[k * 4] = c[0]; px[k * 4 + 1] = c[1]; px[k * 4 + 2] = c[2]; px[k * 4 + 3] = 255;
        }
      }
      sx.putImageData(data, 0, 0);
      return small;
  }

  function fallback(i) {
    var n = ((((i | 0) - 1) % 8) + 8) % 8 + 1;
    var c = newCanvas();
    var x = c.getContext('2d');
    x.fillStyle = '#9bbc0f';
    x.fillRect(0, 0, SIZE, SIZE);
    var img = new Image();
    img.onload = function () {
      x.imageSmoothingEnabled = false;
      x.drawImage(img, 0, 0, SIZE, SIZE);
    };
    img.src = 'assets/sprites/player-' + n + '.svg';
    return c;
  }

  window.RemiAvatar = { fromFile: fromFile, fromSource: process, fallback: fallback, SIZE: SIZE };
})();
