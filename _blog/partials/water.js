/* Moving water in the top band; same code as home, /sea-suite/ and /about/. */
document.querySelectorAll('canvas.water').forEach(function (cv) {
  if (!cv.getContext) return;
  var ctx = cv.getContext('2d');
  var W = 200, H = 100;                       /* low-resolution field, scaled up soft */
  var off = document.createElement('canvas'); off.width = W; off.height = H;
  var octx = off.getContext('2d');
  var img = octx.createImageData(W, H), d = img.data;
  var base = [38, 79, 134], lift = [58, 104, 160]; /* #264f86 to #3a68a0 at most */
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visible = true, raf = 0, t0 = performance.now();
  function size() {
    var r = cv.getBoundingClientRect();
    cv.width = Math.max(1, Math.round(r.width)); cv.height = Math.max(1, Math.round(r.height));
    W = Math.max(80, Math.round(cv.width / 7)); H = Math.max(40, Math.round(cv.height / 7));
    off.width = W; off.height = H; img = octx.createImageData(W, H); d = img.data;
  }
  function frame(now) {
    var t = (now - t0) / 1000 * 0.35, i = 0;
    for (var y = 0; y < H; y++) {
      var v = y / H;
      for (var x = 0; x < W; x++) {
        var u = x / H;
        var a = Math.sin(u * 7.0 + t * 1.1 + Math.sin(v * 5.0 - t * 0.7) * 1.6);
        var b = Math.sin(v * 9.0 - t * 0.9 + Math.sin(u * 4.0 + t * 0.5) * 1.8);
        var c = Math.sin((u + v) * 6.0 + t * 0.6);
        var n = 1 - Math.abs(a + b + c) / 3;   /* bright where the ripples cross */
        n = n * n * n * n;
        var k = n * (0.55 + 0.45 * v);         /* a little more light toward the shore */
        d[i++] = base[0] + (lift[0] - base[0]) * k;
        d[i++] = base[1] + (lift[1] - base[1]) * k;
        d[i++] = base[2] + (lift[2] - base[2]) * k;
        d[i++] = 255;
      }
    }
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, 0, 0, cv.width, cv.height);
  }
  function loop(now) { frame(now); raf = (visible && !still) ? requestAnimationFrame(loop) : 0; }
  function start() { if (!raf) raf = requestAnimationFrame(loop); }
  size(); frame(t0 + 4000);
  if (!still) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) start(); }).observe(cv);
    }
    document.addEventListener('visibilitychange', function () { visible = !document.hidden; if (visible) start(); });
    start();
  }
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { size(); frame(performance.now()); }, 150); });
});
