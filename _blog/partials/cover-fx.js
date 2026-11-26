/* Ship's Log cover motion (Designer, preview 7Cv1kueeaQQzXCDPPJLDSx v1795668761), verbatim. Each post calls initCover(fig, GEO, SANDMASK) from _blog/fx/<slug>.js. */
/* Ship's Log cover, alive: sun shafts sway, light shimmers on the sand, bubbles rise, the pearl glints.
   Drawn over the still painting; holds still with reduced motion. */
function initCover(fig, GEO, SANDMASK) {
  var cv = fig.querySelector('canvas.fx'), ctx = cv.getContext('2d');
  var G = GEO;                                   /* pearl, shell, floor as fractions of the cover */
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var Wc = 0, Hc = 0, dpr = 1, t0 = performance.now(), raf = 0, visible = true;
  /* sand mask, for the caustic shimmer */
  var mask = new Image(); mask.src = SANDMASK;
  var cw = 200, ch = 105;                         /* caustic field resolution */
  var cc = document.createElement('canvas'); cc.width = cw; cc.height = ch; var cx2 = cc.getContext('2d');
  var cimg = cx2.createImageData(cw, ch);
  var mc = document.createElement('canvas'); mc.width = cw; mc.height = ch; var mx = mc.getContext('2d'); var mdata = null;
  mask.onload = function () { mx.drawImage(mask, 0, 0, cw, ch); mdata = mx.getImageData(0, 0, cw, ch).data; };

  function size() {
    var r = fig.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
    Wc = Math.max(1, Math.round(r.width * dpr)); Hc = Math.max(1, Math.round(r.height * dpr));
    cv.width = Wc; cv.height = Hc;
  }

  /* --- sun shafts from the surface --- */
  var shafts = [];
  for (var i = 0; i < 9; i++) shafts.push({ a: -0.62 + i * 0.15 + (Math.random() - 0.5) * 0.06, w: 0.018 + Math.random() * 0.03, sp: 0.12 + Math.random() * 0.2, ph: Math.random() * 6.28, k: 0.5 + Math.random() * 0.5 });
  function drawShafts(t) {
    var lt = G.light || [0.46, -0.55], sx = lt[0] * Wc, sy = lt[1] * Hc, L = Hc * 1.9;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    try { ctx.filter = 'blur(' + Math.round(10 * dpr) + 'px)'; } catch (e) {}
    shafts.forEach(function (s) {
      var a = s.a + Math.sin(t * s.sp + s.ph) * 0.035;
      var w = s.w * (0.8 + 0.2 * Math.sin(t * 0.7 + s.ph));
      var flick = 0.55 + 0.45 * Math.sin(t * (0.6 + s.sp) + s.ph * 2);
      var g = ctx.createLinearGradient(sx, sy, sx + Math.sin(a) * L, sy + Math.cos(a) * L);
      g.addColorStop(0.25, 'rgba(255,240,205,' + (0.28 * s.k * flick).toFixed(3) + ')');
      g.addColorStop(0.62, 'rgba(240,236,220,' + (0.12 * s.k * flick).toFixed(3) + ')');
      g.addColorStop(0.92, 'rgba(240,236,220,0)');
      ctx.fillStyle = g; ctx.beginPath();
      ctx.moveTo(sx + Math.sin(a - w * 0.25) * L * 0.2, sy + Math.cos(a - w * 0.25) * L * 0.2);
      ctx.lineTo(sx + Math.sin(a - w) * L, sy + Math.cos(a - w) * L);
      ctx.lineTo(sx + Math.sin(a + w) * L, sy + Math.cos(a + w) * L);
      ctx.lineTo(sx + Math.sin(a + w * 0.25) * L * 0.2, sy + Math.cos(a + w * 0.25) * L * 0.2);
      ctx.closePath(); ctx.fill();
    });
    ctx.restore();
  }

  /* --- caustic shimmer on the sand floor, in perspective --- */
  function caustic(px, py, t) {
    var TAU = 6.28318, ix = px, iy = py, c = 1, inten = 0.005;
    for (var n = 0; n < 4; n++) {
      var tt = t * (1 - 3.5 / (n + 1));
      var nx = px + Math.cos(tt - ix) + Math.sin(tt + iy), ny = py + Math.sin(tt - iy) + Math.cos(tt + ix);
      ix = nx; iy = ny;
      c += 1 / Math.sqrt(Math.pow(px / (Math.sin(ix + tt) / inten), 2) + Math.pow(py / (Math.cos(iy + tt) / inten), 2));
    }
    c /= 4; c = 1.17 - Math.pow(Math.abs(c), 1.4);
    return Math.min(1, Math.pow(Math.abs(c), 8));
  }
  function drawCaustics(t) {
    if (!mdata) return;
    var d = cimg.data, fy = G.floor * ch, i = 0;
    for (var y = 0; y < ch; y++) {
      for (var x = 0; x < cw; x++, i += 4) {
        var m = mdata[i] / 255;
        if (m < 0.05 || y <= fy) { d[i + 3] = 0; continue; }
        var below = (y - fy) * (1260 / ch) + 8, z = 260 / below;
        var wx = (x / cw - 0.5) * z * 3.0, wz = z;
        var px = ((wx * 0.55) % 1 + 1) % 1 * 6.28318 - 250, py = ((wz * 0.55 + t * 0.03) % 1 + 1) % 1 * 6.28318 - 250;
        var v = caustic(px, py, t * 0.55) * Math.min(1, 1.4 - z * 0.12) * m;
        d[i] = 255; d[i + 1] = 236; d[i + 2] = 196; d[i + 3] = Math.max(0, Math.min(255, v * 170));
      }
    }
    cx2.putImageData(cimg, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(cc, 0, 0, Wc, Hc); ctx.restore();
  }

  /* --- bubbles: a thin stream from the shell, and a few drifting in the water --- */
  var bubbles = [];
  function spawn(fromShell) {
    var s = G.shell;
    var b = fromShell ? { x: s[0] + (Math.random() - 0.5) * s[2] * 0.5, y: s[1] - 0.06, r: 0.0025 + Math.random() * 0.004 }
                      : { x: Math.random(), y: 0.75 + Math.random() * 0.25, r: 0.002 + Math.random() * 0.006 };
    b.vy = 0.035 + b.r * 9 + Math.random() * 0.02; b.ph = Math.random() * 6.28; b.wob = 0.003 + Math.random() * 0.006; b.age = 0;
    bubbles.push(b);
  }
  for (var j = 0; j < 14; j++) { spawn(Math.random() < 0.5); bubbles[j].y = Math.random(); }
  function drawBubbles(dt, t) {
    if (Math.random() < dt * 1.6) spawn(true);
    if (Math.random() < dt * 0.9) spawn(false);
    ctx.save();
    bubbles = bubbles.filter(function (b) {
      b.y -= b.vy * dt; b.age += dt;
      var x = (b.x + Math.sin(t * 2.2 + b.ph) * b.wob) * Wc, y = b.y * Hc, r = b.r * Wc;
      var fade = Math.min(1, b.age * 2) * Math.min(1, b.y / 0.15);
      if (b.y < -0.05) return false;
      var g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.02)'); g.addColorStop(0.75, 'rgba(225,238,255,' + (0.16 * fade) + ')'); g.addColorStop(1, 'rgba(255,255,255,' + (0.55 * fade) + ')');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,' + (0.8 * fade) + ')'; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, Math.max(0.6, r * 0.22), 0, 6.2832); ctx.fill();
      return true;
    });
    ctx.restore();
  }

  /* --- motes drifting in the light --- */
  var motes = [];
  for (var k = 0; k < 70; k++) motes.push({ x: Math.random(), y: Math.random() * 0.85, r: 0.6 + Math.random() * 1.8, ph: Math.random() * 6.28, sp: 0.2 + Math.random() * 0.5 });
  function drawMotes(t) {
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    motes.forEach(function (m) {
      var x = ((m.x + t * 0.004 * m.sp) % 1) * Wc, y = (m.y + Math.sin(t * m.sp + m.ph) * 0.01) * Hc;
      var a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.7 * m.sp + m.ph));
      ctx.fillStyle = 'rgba(255,244,220,' + a.toFixed(3) + ')'; ctx.beginPath(); ctx.arc(x, y, m.r * dpr, 0, 6.2832); ctx.fill();
    });
    ctx.restore();
  }

  /* --- the pearl's glint: lustre sweeping slowly over its face --- */
  function drawPearl(t) {
    var p = G.pearl, x = p[0] * Wc, y = p[1] * Hc, R = p[2] * Wc;
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, R * 0.98, 0, 6.2832); ctx.clip();
    ctx.globalCompositeOperation = 'screen';
    var a = t * 0.5, hx = x + Math.cos(a) * R * 0.35 - R * 0.15, hy = y + Math.sin(a * 0.8) * R * 0.25 - R * 0.25;
    var g = ctx.createRadialGradient(hx, hy, 0, hx, hy, R * 0.75);
    var pulse = 0.18 + 0.12 * (0.5 + 0.5 * Math.sin(t * 1.3));
    g.addColorStop(0, 'rgba(255,246,232,' + pulse.toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,246,232,0)');
    ctx.fillStyle = g; ctx.fillRect(x - R, y - R, R * 2, R * 2);
    var tint = ctx.createLinearGradient(x - R, y - R, x + R, y + R);
    var s = 0.5 + 0.5 * Math.sin(t * 0.6);
    tint.addColorStop(0, 'rgba(255,200,210,' + (0.05 + 0.05 * s) + ')'); tint.addColorStop(1, 'rgba(190,230,215,' + (0.05 + 0.05 * (1 - s)) + ')');
    ctx.fillStyle = tint; ctx.fillRect(x - R, y - R, R * 2, R * 2);
    ctx.restore();
    /* soft halo breathing around it */
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    var h = ctx.createRadialGradient(x, y, R, x, y, R * 2.6);
    h.addColorStop(0, 'rgba(255,236,200,' + (0.10 + 0.06 * Math.sin(t * 1.1)).toFixed(3) + ')'); h.addColorStop(1, 'rgba(255,236,200,0)');
    ctx.fillStyle = h; ctx.fillRect(x - R * 3, y - R * 3, R * 6, R * 6); ctx.restore();
  }


  /* --- a school of silver fish swimming an endless figure-eight (G.school = [cx, cy, a] as fractions) --- */
  var fishes = [];
  if (G.school) {
    for (var q = 0; q < 220; q++) fishes.push({ off: Math.random() * 6.2832, lane: (Math.random() - 0.5) * 2, dep: Math.random(), len: 0.0085 + Math.random() * 0.006, ph: Math.random() * 6.28 });
    fishes.sort(function (a, b) { return a.dep - b.dep; });
  }
  function eight(t) { var s = Math.sin(t), c = Math.cos(t), d = 1 + s * s; return [c / d, s * c / d]; }
  function drawSchool(t) {
    if (!fishes.length) return;
    var S = G.school, cx = S[0] * Wc, cy = S[1] * Hc, A = S[2] * Wc, sp = 0.11;
    fishes.forEach(function (f) {
      /* the school is one band of fish along the loop, thickest in the middle */
      var u = t * sp + f.off * 0.18;
      var p = eight(u), p2 = eight(u + 0.01);
      var dx = (p2[0] - p[0]) * A, dy = (p2[1] - p[1]) * A * 0.62, ang = Math.atan2(dy, dx);
      var nx = -Math.sin(ang), ny = Math.cos(ang);
      var w = A * 0.075 * (0.6 + 0.4 * Math.sin(f.off * 3));
      var x = cx + p[0] * A + nx * f.lane * w + Math.sin(t * 2 + f.ph) * 1.5 * dpr;
      var y = cy + p[1] * A * 0.62 + ny * f.lane * w;
      var L = f.len * Wc * (0.7 + 0.6 * f.dep), fog = 0.55 * (1 - f.dep);
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang + Math.sin(t * 9 + f.ph) * 0.06);
      var g = ctx.createLinearGradient(0, -L * 0.13, 0, L * 0.13);
      var top = 'rgba(' + Math.round(220 - 90 * fog) + ',' + Math.round(228 - 80 * fog) + ',' + Math.round(238 - 60 * fog) + ',1)';
      var bot = 'rgba(' + Math.round(110 - 30 * fog) + ',' + Math.round(132 - 20 * fog) + ',' + Math.round(168) + ',1)';
      g.addColorStop(0, top); g.addColorStop(1, bot);
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, L * 0.5, L * 0.12, 0, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-L * 0.46, 0); ctx.lineTo(-L * 0.68, -L * 0.14); ctx.lineTo(-L * 0.6, 0); ctx.lineTo(-L * 0.68, L * 0.14); ctx.closePath(); ctx.fill();
      /* a glint when a fish turns its flank to the light */
      var glint = Math.max(0, Math.sin(ang * 2 + t * 0.8 + f.ph)) * (0.5 + 0.5 * f.dep);
      if (glint > 0.6) { ctx.fillStyle = 'rgba(255,250,235,' + ((glint - 0.6) * 1.6).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(L * 0.05, -L * 0.03, L * 0.3, L * 0.05, 0, 0, 6.2832); ctx.fill(); }
      ctx.restore();
    });
  }

  /* --- a booster that descends on its flame, touches down, cuts the engine and stays on the pad (G.rocket) --- */
  var R = G.rocket || null, rImg = null, rStart = null, rDur = 5.2, puffs = [], puffed = false;
  if (R) {
    rImg = new Image(); rImg.src = R.src;
    if (still) rStart = -1000;
    var css = document.createElement('style');
    css.textContent = '.sea-replay{position:absolute;right:clamp(10px,2.2%,28px);bottom:clamp(10px,3.5%,36px);z-index:3;display:inline-flex;align-items:center;gap:.45em;' +
      'padding:.5em .95em .5em .75em;border:0;border-radius:999px;background:rgba(251,248,242,.88);color:#264f86;font:500 13px/1 Inter,system-ui,sans-serif;letter-spacing:.01em;' +
      'cursor:pointer;box-shadow:0 2px 14px rgba(10,25,50,.25);transition:background .2s,opacity .3s}.sea-replay:hover{background:#fbf8f2}' +
      '.sea-replay:focus-visible{outline:2px solid #e9c77f;outline-offset:2px}.sea-replay svg{width:12px;height:12px;fill:currentColor}.sea-replay[aria-busy=true]{opacity:.55}';
    document.head.appendChild(css);
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'sea-replay';
    btn.setAttribute('aria-label', 'Replay the landing');
    btn.innerHTML = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1.2v9.6L10.6 6z"/></svg>Replay';
    if (getComputedStyle(fig).position === 'static') fig.style.position = 'relative';
    fig.appendChild(btn);
    btn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      rStart = (performance.now() - t0) / 1000 + 0.4; puffs = []; puffed = false;
      if (!raf) raf = requestAnimationFrame(loop);
    });
  }
  function landing() { return R && rStart !== null && ((performance.now() - t0) / 1000 - rStart) < rDur + 4; }
  function drawRocket(t, dt) {
    if (!R || !rImg || !rImg.complete) return;
    if (rStart === null) rStart = t + 0.6;
    var sc = Wc / 2400, surf = R.surface * Hc, p = (t - rStart) / rDur;
    var q = Math.min(1, Math.max(0, p));
    var yoff = -0.8 * Hc * Math.pow(1 - q, 2.4);           /* falls fast, slows to a hover-gentle touchdown */
    var x0 = R.x0 * Wc, y0 = R.y0 * Hc + yoff, w = R.w * Wc, h = R.h * Hc;
    /* the booster, seen through the rippling surface */
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, Wc, surf); ctx.clip();
    var strip = Math.max(2, Math.round(3 * sc * 2));
    for (var yy = 0; yy < h; yy += strip) {
      var sy = y0 + yy; if (sy > surf) break; if (sy + strip < 0) continue;
      var dx = Math.sin((sy / sc) / 60 + t * 1.3) * 1.3 * sc;
      ctx.drawImage(rImg, 0, yy / h * rImg.height, rImg.width, strip / h * rImg.height, x0 + dx, sy, w, strip);
    }
    /* the flame: full on the way down, cut at touchdown */
    var fk = p < 0 ? 0 : (p < 1 ? 1 : Math.max(0, 1 - (p - 1) / 0.06));
    if (fk > 0) {
      var nx = R.nozzle[0] * Wc, ny = R.nozzle[1] * Hc + yoff, pad = R.pad[1] * Hc;
      var L = Math.min(pad - ny, 190 * sc) * (0.88 + 0.12 * Math.sin(t * 47)) * fk, fw = 26 * sc;
      ctx.globalCompositeOperation = 'lighter';
      var g = ctx.createLinearGradient(0, ny, 0, ny + L);
      g.addColorStop(0, 'rgba(255,250,232,' + (0.95 * fk) + ')'); g.addColorStop(0.35, 'rgba(255,214,140,' + (0.7 * fk) + ')'); g.addColorStop(1, 'rgba(255,170,90,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(nx - fw * 0.5, ny); ctx.quadraticCurveTo(nx - fw * 1.2, ny + L * 0.5, nx, ny + L); ctx.quadraticCurveTo(nx + fw * 1.2, ny + L * 0.5, nx + fw * 0.5, ny); ctx.fill();
      var near = Math.max(0, 1 - (pad - ny - 64 * sc) / (0.45 * Hc)) * fk;   /* glare on the deck as it closes in */
      var gl = ctx.createRadialGradient(nx, pad, 0, nx, pad, 360 * sc);
      gl.addColorStop(0, 'rgba(255,200,120,' + (0.55 * near) + ')'); gl.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = gl; ctx.fillRect(nx - 380 * sc, pad - 380 * sc, 760 * sc, 380 * sc + 4);
      ctx.globalCompositeOperation = 'source-over';
    }
    /* touchdown: steam rolls off the deck and thins away */
    if (p >= 1 && !puffed) { puffed = true; for (var k = 0; k < 26; k++) { var d = (Math.random() < 0.5 ? -1 : 1); puffs.push({ x: R.nozzle[0] * Wc + d * Math.random() * 40 * sc, y: R.pad[1] * Hc - Math.random() * 18 * sc, vx: d * (40 + Math.random() * 120) * sc, vy: -(4 + Math.random() * 14) * sc, r: (20 + Math.random() * 26) * sc, age: 0, life: 2.6 + Math.random() * 1.8 }); } }
    puffs = puffs.filter(function (f) {
      f.age += dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.985; f.r += 22 * sc * dt;
      var a = Math.max(0, 1 - f.age / f.life) * Math.min(1, f.age * 6) * 0.42;
      var pg = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      pg.addColorStop(0, 'rgba(232,226,216,' + a.toFixed(3) + ')'); pg.addColorStop(1, 'rgba(232,226,216,0)');
      ctx.fillStyle = pg; ctx.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
      return f.age < f.life;
    });
    ctx.restore();
    /* under the surface: the engine's light spilling into the water */
    if (fk > 0) {
      var nx2 = R.nozzle[0] * Wc, near2 = Math.max(0, 1 - (R.pad[1] * Hc - (R.nozzle[1] * Hc + yoff)) / (0.6 * Hc)) * fk;
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      var sp = ctx.createRadialGradient(nx2, surf + 60 * sc, 0, nx2, surf + 60 * sc, 560 * sc);
      sp.addColorStop(0, 'rgba(255,183,96,' + (0.28 * near2) + ')'); sp.addColorStop(1, 'rgba(255,183,96,0)');
      ctx.fillStyle = sp; ctx.fillRect(nx2 - 600 * sc, surf, 1200 * sc, 620 * sc); ctx.restore();
    }
    if (btn) btn.setAttribute('aria-busy', (p >= 0 && p < 1) ? 'true' : 'false');
  }

  var last = t0;
  function frame(now) {
    var t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now;
    ctx.clearRect(0, 0, Wc, Hc);
    drawRocket(t, dt); drawShafts(t); drawCaustics(t); drawMotes(t); drawSchool(t); drawPearl(t); drawBubbles(dt, t);
  }
  function loop(now) { frame(now); raf = (visible && (!still || landing())) ? requestAnimationFrame(loop) : 0; }
  size(); frame(t0 + 3000);
  if (!still) {
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(fig);
    document.addEventListener('visibilitychange', function () { visible = !document.hidden; if (visible && !raf) raf = requestAnimationFrame(loop); });
    raf = requestAnimationFrame(loop);
  } else { mask.addEventListener('load', function () { frame(t0 + 3000); }); if (rImg) rImg.addEventListener('load', function () { frame(performance.now()); }); }
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { size(); if (still && !raf) frame(performance.now()); }, 150); });
}
