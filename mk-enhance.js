/* ============================================================
   MEIKO — Enhancement Layer (vanilla JS, additive)
   Buduje preloader, custom kursor, pasek/nawigację scrolla,
   magnetyczne przyciski, reveal nagłówków, aurorę.
   Wszystko poza #root → React nigdy tego nie dotyka.
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------------- 1. PRELOADER ---------------- */
  function buildLoader() {
    if (reduce) return;
    document.documentElement.classList.add('mk-loading');

    var el = document.createElement('div');
    el.id = 'mk-loader';

    var panels = '<div class="mk-panels">' +
      '<div class="mk-panel"></div><div class="mk-panel"></div><div class="mk-panel"></div>' +
      '<div class="mk-panel"></div><div class="mk-panel"></div></div>';

    function loaderLine(text, offset) {
      var html = '<span class="mk-title-group">';
      for (var i = 0; i < text.length; i++) {
        var c = text.charAt(i);
        if (c === ' ') { html += '<span style="width:.42em">&nbsp;</span>'; continue; }
        html += '<span style="animation-delay:' + (0.18 + (offset + i) * 0.045).toFixed(3) + 's">' + c + '</span>';
      }
      return html + '</span>';
    }
    var letters = loaderLine('MEIKO TRANS', 0) +
      '<span class="mk-break-space" style="width:.42em">&nbsp;</span>' +
      '<br class="mk-mobile-break">' + loaderLine('POLSKA', 12);

    el.innerHTML = panels +
      '<div class="mk-grid"></div>' +
      '<div class="mk-inner">' +
        '<div class="mk-orbit">' +
          '<span class="mk-ell mk-ell1"></span>' +
          '<span class="mk-ell mk-ell2"></span>' +
          '<span class="mk-ell mk-ell3"></span>' +
          '<span class="mk-orbit-dot"></span>' +
          '<span class="mk-load-pulse"></span>' +
          '<img class="mk-load-mark" src="./assets/mk-icon.png" alt="MEIKO" />' +
        '</div>' +
        '<p class="mk-eyebrow">LOGISTICS EXPERIENCE · GLIWICE</p>' +
        '<h1 class="mk-title">' + letters + '</h1>' +
        '<div class="mk-bar"><div class="mk-fill"></div></div>' +
        '<div class="mk-meta"><span>PRZYGOTOWUJĘ DOŚWIADCZENIE</span>' +
        '<span class="mk-count">0%</span></div>' +
      '</div>';

    (document.body || document.documentElement).appendChild(el);

    var fill = el.querySelector('.mk-fill');
    var count = el.querySelector('.mk-count');
    var val = 0, start = null, DUR = 2000;

    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / DUR);
      // easeOutCubic dla naturalnego zwalniania
      var eased = 1 - Math.pow(1 - p, 3);
      val = Math.round(eased * 100);
      fill.style.right = (100 - val) + '%';
      count.textContent = val + '%';
      if (p < 1) { requestAnimationFrame(step); }
      else { setTimeout(finish, 260); }
    }
    function finish() {
      el.classList.add('mk-done');
      document.documentElement.classList.remove('mk-loading');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1300);
    }
    requestAnimationFrame(step);
  }

  /* ---------------- 3. SCROLL PROGRESS + RAIL ---------------- */
  function initScroll() {
    var bar = document.createElement('div'); bar.id = 'mk-scroll';
    document.body.appendChild(bar);

    var sections = [
      ['top', 'Intro'], ['history', 'Historia'], ['services', 'Możliwości'],
      ['digital', 'Digital'], ['experience', '3D'], ['contact', 'Kontakt']
    ].filter(function (s) { return document.getElementById(s[0]); });

    var rail = null, dots = [];
    if (sections.length) {
      rail = document.createElement('nav'); rail.id = 'mk-rail';
      sections.forEach(function (s) {
        var b = document.createElement('button');
        b.className = 'mk-dot';
        b.innerHTML = '<span class="mk-lbl">' + s[1] + '</span><span class="mk-bullet"></span>';
        b.addEventListener('click', function () {
          var t = document.getElementById(s[0]);
          if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
        });
        rail.appendChild(b); dots.push({ id: s[0], el: b });
      });
      document.body.appendChild(rail);
    }

    function onScroll() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? h.scrollTop / max : 0;
      bar.style.transform = 'scaleX(' + p + ')';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (dots.length && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          dots.forEach(function (d) {
            d.el.classList.toggle('mk-active', d.id === en.target.id);
          });
        });
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
      sections.forEach(function (s) { io.observe(document.getElementById(s[0])); });
    }
  }

  /* ---------------- 4. MAGNETIC ELEMENTS ---------------- */
  function initMagnetic() {
    if (!fine) return;
    var sel = '.circle-link,.header-cta,.stage-center button,.story-next,' +
              '.network-copy > a,.history-controls > button,.fullscreen';
    var nodes = document.querySelectorAll(sel);
    Array.prototype.forEach.call(nodes, function (n) {
      n.setAttribute('data-mk-mag', '');
      var strength = 0.32, cap = 18;
      n.addEventListener('mousemove', function (e) {
        var r = n.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * strength;
        var dy = (e.clientY - (r.top + r.height / 2)) * strength;
        dx = Math.max(-cap, Math.min(cap, dx));
        dy = Math.max(-cap, Math.min(cap, dy));
        n.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      });
      n.addEventListener('mouseleave', function () { n.style.transform = ''; });
    });
  }

  /* ---------------- 5. HEADING REVEAL ---------------- */
  function initReveal() {
    if (reduce || !('IntersectionObserver' in window)) return;
    var heads = document.querySelectorAll(
      '.services h2,.digital h2,.experience h2,.network h2,.contact h2,' +
      '.history-story h2,.section-lead h2'
    );
    if (!heads.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var t = en.target;
          t.classList.add('mk-in');
          io.unobserve(t);
          // po animacji usuwamy clip-path calkowicie, zeby nie obcinal ogonkow liter (g, y, j...)
          setTimeout(function () { t.style.clipPath = 'none'; t.style.webkitClipPath = 'none'; }, 1150);
        }
      });
    }, { threshold: 0.2 });
    Array.prototype.forEach.call(heads, function (h) {
      h.classList.add('mk-reveal'); io.observe(h);
    });
  }

  /* ---------------- 6. AURORA ---------------- */
  function initAurora() {
    if (reduce) return;
    ['.digital', '.contact'].forEach(function (s) {
      var host = document.querySelector(s);
      if (host && !host.querySelector('.mk-aurora')) {
        var a = document.createElement('div'); a.className = 'mk-aurora';
        host.insertBefore(a, host.firstChild);
      }
    });
  }

  /* ---------------- 7. WEBGL SHADER AURORA ---------------- */
  function initShaderAurora() {
    if (reduce) return;
    var FS = [
      'precision highp float;',
      'uniform vec2 u_res; uniform float u_time;',
      'float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }',
      'float noise(vec2 p){ vec2 i=floor(p),f=fract(p); float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.)); vec2 u=f*f*(3.-2.*f); return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y; }',
      'float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=.5; } return v; }',
      'void main(){',
      '  vec2 uv=gl_FragCoord.xy/u_res.xy;',
      '  vec2 p=uv*vec2(2.4,2.0); float t=u_time*0.05;',
      '  vec2 q=vec2(fbm(p+t), fbm(p+vec2(5.2,1.3)-t));',
      '  float n=fbm(p+q*1.9+t*0.6);',
      '  vec3 navy=vec3(0.024,0.063,0.114);',
      '  vec3 blue=vec3(0.0,0.30,0.55);',
      '  vec3 cyan=vec3(0.24,0.83,1.0);',
      '  vec3 col=mix(navy,blue,smoothstep(0.18,0.72,n));',
      '  col=mix(col,cyan,smoothstep(0.55,0.98,n)*0.75);',
      '  float fall=smoothstep(1.05,0.05,uv.y);',
      '  col*=(0.45+0.75*fall);',
      '  gl_FragColor=vec4(col,1.0);',
      '}'
    ].join('\n');
    var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

    Array.prototype.forEach.call(document.querySelectorAll('.mk-aurora'), function (host) {
      try {
        var cv = document.createElement('canvas');
        var gl = cv.getContext('webgl') || cv.getContext('experimental-webgl');
        if (!gl) return; // brak WebGL -> zostaje aurora CSS
        host.appendChild(cv);
        host.classList.add('mk-gl');
        function compile(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
        var prog = gl.createProgram();
        gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
        gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { host.classList.remove('mk-gl'); host.removeChild(cv); return; }
        gl.useProgram(prog);
        var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        var loc = gl.getAttribLocation(prog, 'p');
        gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        var uRes = gl.getUniformLocation(prog, 'u_res'), uTime = gl.getUniformLocation(prog, 'u_time');
        var DPR = 0.6;
        function resize() { var r = host.getBoundingClientRect(); cv.width = Math.max(2, (r.width * DPR) | 0); cv.height = Math.max(2, (r.height * DPR) | 0); gl.viewport(0, 0, cv.width, cv.height); }
        resize(); window.addEventListener('resize', resize, { passive: true });
        var visible = true;
        if ('IntersectionObserver' in window) {
          new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0 }).observe(host);
        }
        var t0 = performance.now();
        (function loop(now) {
          if (visible) { gl.uniform2f(uRes, cv.width, cv.height); gl.uniform1f(uTime, (now - t0) / 1000); gl.drawArrays(gl.TRIANGLES, 0, 3); }
          requestAnimationFrame(loop);
        })(t0);
      } catch (e) {}
    });
  }

  /* ---------------- 8. TEXT SCRAMBLE / DECODE ---------------- */
  function initScramble() {
    if (reduce || !('IntersectionObserver' in window)) return;
    var els = document.querySelectorAll('.section-code,.overline');
    var targets = Array.prototype.filter.call(els, function (e) {
      return e.children.length === 0 && e.textContent.trim().length > 1;
    });
    if (!targets.length) return;
    var glyphs = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789/#%·';
    function run(el) {
      var text = el.textContent, len = text.length, start = null, DUR = 680;
      function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / DUR);
        var rev = Math.floor(p * len * 1.15), out = '';
        for (var i = 0; i < len; i++) {
          var c = text.charAt(i);
          out += (c === ' ') ? ' ' : (i < rev ? c : glyphs.charAt((Math.random() * glyphs.length) | 0));
        }
        el.textContent = out;
        if (p < 1) requestAnimationFrame(frame); else el.textContent = text;
      }
      requestAnimationFrame(frame);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.6 });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------------- 9. TRASA MULTIMODALNA (truck -> kontener -> samolot) ---------------- */
  function initJourney() {
    if (reduce) return;
    var shell = document.querySelector('.services .page-shell');
    var list = document.querySelector('.services .service-list');
    if (!shell || !list || shell.querySelector('.mk-journey')) return;

    // ikony rysowane lokalnie; wrapper translate centruje je w (0,0) pojazdu
    var truck =
      '<g transform="translate(-21,-42)"><g class="mk-veh mk-veh-truck">' +
        '<rect class="mk-icon" x="0" y="6" width="28" height="18" rx="1.5"/>' +
        '<path class="mk-icon" d="M28 12 h7 l6 6 v6 h-13 z"/>' +
        '<circle class="mk-fill" cx="8" cy="26" r="3.2"/>' +
        '<circle class="mk-fill" cx="34" cy="26" r="3.2"/>' +
      '</g></g>';
    // statek kontenerowiec (kadlub + stosy kontenerow), plynie w prawo
    var container =
      '<g transform="translate(-32,-44)"><g class="mk-veh mk-veh-cont">' +
        '<path class="mk-icon" d="M2 22 L58 22 L62 26 L54 32 L8 32 Z"/>' +
        '<rect class="mk-icon" x="8" y="14" width="44" height="8"/>' +
        '<path class="mk-icon" d="M19 14 V22 M30 14 V22 M41 14 V22"/>' +
        '<rect class="mk-icon" x="14" y="8" width="24" height="6"/>' +
        '<path class="mk-icon" d="M26 8 V14"/>' +
      '</g></g>';
    // samolot — widok z boku, leci w prawo (dziob w prawo, statecznik pionowy, skrzydlo)
    var plane =
      '<g transform="translate(-32,-43)"><g class="mk-veh mk-veh-plane">' +
        '<path class="mk-fill" d="M8 14 L48 14 L60 18 L48 22 L8 22 Q4 18 8 14 Z"/>' +
        '<path class="mk-fill" d="M10 14 L6 4 L18 14 Z"/>' +
        '<path class="mk-fill" d="M34 22 L24 33 L42 22 Z"/>' +
      '</g></g>';

    var desktopSvg =
      '<svg class="mk-journey-desktop" viewBox="0 0 1200 150" role="img" aria-label="Trasa multimodalna: pojazd zmienia sie z ciezarowki w statek kontenerowy i samolot">' +
        '<defs><linearGradient id="mkWaterGradient" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#eefbff" stop-opacity=".72"/>' +
          '<stop offset=".5" stop-color="#8bd8ef" stop-opacity=".45"/>' +
          '<stop offset="1" stop-color="#2695c4" stop-opacity=".25"/>' +
        '</linearGradient></defs>' +
        '<g class="mk-road-scene">' +
          '<path class="mk-road-bed" d="M60 100 H400"/>' +
          '<path class="mk-road-dashes" d="M75 100 H390"/>' +
        '</g>' +
        '<g class="mk-water-scene">' +
          '<rect class="mk-water-bed" x="400" y="88" width="400" height="24" rx="8"/>' +
          '<path class="mk-wave mk-wave-a" d="M400 94 Q420 88 440 94 T480 94 T520 94 T560 94 T600 94 T640 94 T680 94 T720 94 T760 94 T800 94"/>' +
          '<path class="mk-wave mk-wave-b" d="M400 104 Q420 98 440 104 T480 104 T520 104 T560 104 T600 104 T640 104 T680 104 T720 104 T760 104 T800 104"/>' +
          '<path class="mk-wave mk-wave-c" d="M400 111 Q420 106 440 111 T480 111 T520 111 T560 111 T600 111 T640 111 T680 111 T720 111 T760 111 T800 111"/>' +
        '</g>' +
        '<g class="mk-cloud-part mk-cloud-left">' +
          '<path d="M925 92 C925 81 934 75 945 77 C947 64 959 59 970 67 L970 92 Z"/>' +
        '</g>' +
        '<g class="mk-cloud-part mk-cloud-right">' +
          '<path d="M970 67 C980 61 992 68 993 78 C1005 77 1014 84 1014 92 L970 92 Z"/>' +
        '</g>' +
        '<path id="mkRoute" class="mk-route" d="M60 100 L1140 100"/>' +
        '<circle class="mk-node" cx="200" cy="100" r="6"/>' +
        '<circle class="mk-node" cx="600" cy="100" r="6"/>' +
        '<circle class="mk-node" cx="1000" cy="100" r="6"/>' +
        '<text class="mk-lbl" x="200" y="132">TRANSPORT DROGOWY</text>' +
        '<text class="mk-lbl" x="600" y="132">TRANSPORT MORSKI</text>' +
        '<text class="mk-lbl" x="1000" y="132">TRANSPORT LOTNICZY</text>' +
        '<g class="mk-vehicle" data-x1="60" data-x2="1140" data-y="100">' +
          truck + container + plane +
        '</g>' +
      '</svg>';

    // Osobny, czytelniejszy wariant na telefon: wieksze ikony i krotsze etykiety.
    var mobileSvg =
      '<svg class="mk-journey-mobile" viewBox="0 0 360 220" role="img" aria-label="Trasa multimodalna na telefonie: drogowy, morski i lotniczy">' +
        '<path class="mk-route" d="M30 120 L330 120"/>' +
        '<circle class="mk-node" cx="70" cy="120" r="6"/>' +
        '<circle class="mk-node" cx="180" cy="120" r="6"/>' +
        '<circle class="mk-node" cx="290" cy="120" r="6"/>' +
        '<text class="mk-lbl" x="70" y="166">DROGOWY</text>' +
        '<text class="mk-lbl" x="180" y="166">MORSKI</text>' +
        '<text class="mk-lbl" x="290" y="166">LOTNICZY</text>' +
        '<g class="mk-vehicle mk-mobile-runner" data-x1="30" data-x2="330" data-y="120">' +
          truck + container + plane +
        '</g>' +
      '</svg>';

    var wrap = document.createElement('div');
    wrap.className = 'mk-journey';
    wrap.innerHTML = '<p class="mk-jcap">USŁUGI TRANSPORTOWE · DROGOWY → MORSKI → LOTNICZY</p>' + desktopSvg + mobileSvg;
    shell.insertBefore(wrap, list);

    // Jeden zegar steruje jednoczesnie pozycja i zmiana srodka transportu.
    // Dzieki temu SVG na telefonie i komputerze nie rozjezdza sie w czasie.
    var runners = wrap.querySelectorAll('.mk-vehicle');
    var cloudLeft = wrap.querySelector('.mk-cloud-left');
    var cloudRight = wrap.querySelector('.mk-cloud-right');
    var startedAt = performance.now();
    var duration = 14000;

    function smooth(value) {
      value = Math.max(0, Math.min(1, value));
      return value * value * (3 - 2 * value);
    }

    function setState(runner, truckWeight, shipWeight, planeWeight) {
      var nodes = [
        [runner.querySelector('.mk-veh-truck'), truckWeight],
        [runner.querySelector('.mk-veh-cont'), shipWeight],
        [runner.querySelector('.mk-veh-plane'), planeWeight]
      ];
      nodes.forEach(function (item) {
        if (!item[0]) return;
        item[0].style.opacity = item[1].toFixed(3);
        item[0].style.transform = 'scale(' + (0.55 + item[1] * 0.45).toFixed(3) + ')';
      });
    }

    function animate(now) {
      var cycle = ((now - startedAt) % duration) / duration;
      var travelEnd = .88;
      var progress = cycle < travelEnd ? cycle / travelEnd : 1;
      var resetHidden = cycle >= .98;
      var truckWeight = 0, shipWeight = 0, planeWeight = 0;

      if (resetHidden) truckWeight = 1;
      else if (progress < .27) truckWeight = 1;
      else if (progress < .36) {
        var toShip = smooth((progress - .27) / .09);
        truckWeight = 1 - toShip;
        shipWeight = toShip;
      } else if (progress < .63) shipWeight = 1;
      else if (progress < .72) {
        var toPlane = smooth((progress - .63) / .09);
        shipWeight = 1 - toPlane;
        planeWeight = toPlane;
      } else planeWeight = 1;

      var envelope;
      if (cycle < .03) envelope = smooth(cycle / .03);
      else if (cycle < .905) envelope = 1;
      else if (cycle < .945) envelope = smooth((.945 - cycle) / .04);
      else envelope = 0;

      runners.forEach(function (runner) {
        var x1 = Number(runner.getAttribute('data-x1'));
        var x2 = Number(runner.getAttribute('data-x2'));
        var y = Number(runner.getAttribute('data-y'));
        var position = resetHidden ? 0 : progress;
        runner.setAttribute('transform', 'translate(' + (x1 + (x2 - x1) * position).toFixed(2) + ' ' + y + ')');
        runner.style.opacity = envelope.toFixed(3);
        setState(runner, truckWeight, shipWeight, planeWeight);
      });

      var cloudBreak = resetHidden ? 0 : smooth((progress - .83) / .07);
      if (cloudLeft && cloudRight) {
        cloudLeft.style.transform = 'translate(' + (-10 * cloudBreak).toFixed(2) + 'px,' + (-4 * cloudBreak).toFixed(2) + 'px) rotate(' + (-5 * cloudBreak).toFixed(2) + 'deg)';
        cloudRight.style.transform = 'translate(' + (10 * cloudBreak).toFixed(2) + 'px,' + (-4 * cloudBreak).toFixed(2) + 'px) rotate(' + (5 * cloudBreak).toFixed(2) + 'deg)';
        cloudLeft.style.opacity = cloudRight.style.opacity = (1 - cloudBreak * .55).toFixed(3);
      }

      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  /* ---------------- 10. MODEL 3D JAKO ZYWE TLO ---------------- */
  function initWarehouseBg() {
    if (reduce) return;
    var section = document.getElementById('experience');
    if (!section) return;
    var shell = section.querySelector('.stage-shell');
    if (!shell) return;
    section.classList.add('mk-wh');

    var started = false, hideMag = null, hide3d = null, orbitTimer = null, inView = false;

    // auto-start gdy sekcja w kadrze
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        inView = es[0].isIntersecting;
        if (inView && !started) { started = true; var b = shell.querySelector('.stage-cover button'); if (b) b.click(); waitForCanvas(0); }
      }, { threshold: 0.12 });
      io.observe(section);
    } else { started = true; var b0 = shell.querySelector('.stage-cover button'); if (b0) b0.click(); waitForCanvas(0); }

    function injectStyle(doc, css) { try { var s = doc.createElement('style'); s.textContent = css; doc.head.appendChild(s); return s; } catch (e) { return null; } }

    function chain() {
      var pf = shell.querySelector('iframe'); if (!pf) return null;
      var md; try { md = pf.contentDocument; } catch (e) { return null; }
      if (!md) return null;
      var f3 = md.getElementById('frame3d');
      if (f3) {
        var f3d; try { f3d = f3.contentDocument; } catch (e) { return null; }
        if (!f3d) return null;
        var nestedCanvas = f3d.querySelector('canvas'); if (!nestedCanvas) return null;
        return { pf: pf, md: md, f3: f3, win3: f3.contentWindow, f3d: f3d, cv: nestedCanvas };
      }
      // Publiczna wersja magazynu jest bezpośrednim dokumentem 3D, bez iframe frame3d.
      var directCanvas = md.querySelector('canvas'); if (!directCanvas) return null;
      return { pf: pf, md: md, f3: pf, win3: pf.contentWindow, f3d: md, cv: directCanvas };
    }

    function waitForCanvas(tries) {
      var c = chain();
      if (!c) { if (tries < 160) setTimeout(function () { waitForCanvas(tries + 1); }, 150); return; }
      onReady(c);
    }

    function setChromeHidden(hidden) {
      if (hideMag) hideMag.disabled = !hidden;
      if (hide3d) hide3d.disabled = !hidden;
    }

    function onReady(c) {
      // ukryj UI narzedzia (shell + wnetrze 3D)
      hideMag = injectStyle(c.md, 'header{display:none!important} main{position:fixed!important;inset:0!important}');
      hide3d = injectStyle(c.f3d, '#ui,#panel,#legend,#kpi,#hint,#tip,#rackTip{display:none!important}');
      section.classList.add('mk-wh-on');

      // ustawienie dystansu kamery — lekkie przyblizenie (ujemny deltaY = zoom in)
      try {
        var r0 = c.cv.getBoundingClientRect();
        var wx = r0.left + r0.width / 2, wy = r0.top + r0.height / 2;
        for (var i = 0; i < 3; i++) {
          c.cv.dispatchEvent(new c.win3.WheelEvent('wheel', { bubbles: true, cancelable: true, clientX: wx, clientY: wy, deltaY: -120, view: c.win3 }));
        }
      } catch (e) {}

      startOrbit(c);

      // Widok regałów pozostaje osadzony w portfolio; bez odsyłacza do osobnej strony magazynu.
    }

    function startOrbit(c) {
      var cv = c.cv, win3 = c.win3;
      var r = cv.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height * 0.5;
      var lastScroll = window.scrollY;
      var lastReveal = -1;
      function updateWarehouseReveal() {
        if (!win3 || typeof win3.setWarehouseReveal !== 'function') return;
        var rect = section.getBoundingClientRect();
        var vh = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
        // Pelna bryla, gdy sekcja wchodzi od dolu; same regaly, gdy sekcja jest juz w kadrze.
        // Keep the warehouse shell visible while the section first enters.
        // The racks start revealing only after the viewer scrolls deeper in.
        var reveal = (vh * 0.48 - rect.top) / (vh * 0.82);
        reveal = Math.max(0, Math.min(1, reveal));
        if (Math.abs(reveal - lastReveal) < 0.004) return;
        lastReveal = reveal;
        try { win3.setWarehouseReveal(reveal); } catch (e) {}
      }
      function mev(type, x, b, pointer) {
        var C = pointer ? win3.PointerEvent : win3.MouseEvent;
        var init = { bubbles: true, cancelable: true, clientX: x, clientY: cy, button: 0, buttons: b, view: win3 };
        if (pointer) { init.pointerId = 1; init.pointerType = 'mouse'; init.isPrimary = true; }
        try { return new C(type, init); } catch (e) { return null; }
      }
      function fire(type, x, b, pointer) { var e = mev(type, x, b, pointer); if (e) cv.dispatchEvent(e); }
      function burst(dx) {
        fire('pointerdown', cx, 1, true); fire('mousedown', cx, 1, false);
        fire('pointermove', cx + dx, 1, true); fire('mousemove', cx + dx, 1, false);
        fire('pointerup', cx + dx, 0, true); fire('mouseup', cx + dx, 0, false);
      }
      updateWarehouseReveal();
      orbitTimer = setInterval(function () {
        updateWarehouseReveal();
        if (!inView) { lastScroll = window.scrollY; return; }
        // nie kreci gdy pelny ekran (uzytkownik steruje sam)
        if (shell.classList.contains('is-expanded')) return;
        var sc = window.scrollY, ds = sc - lastScroll; lastScroll = sc;
        var dx = 1.6 + ds * 0.5;            // staly powolny obrot + wplyw scrolla
        if (dx > 40) dx = 40; if (dx < -40) dx = -40;
        if (Math.abs(dx) < 0.4) dx = 0.4;
        burst(dx);
      }, 45);
    }
  }

  /* ---------------- 11. LOGO: kolorowe / z bialym napisem ---------------- */
  function initLogo() {
    var brand = document.querySelector('.site-header .brand');
    if (!brand) return;
    var orig = brand.querySelector('img');
    if (!orig || brand.querySelector('.mk-logo-light')) return;
    var light = document.createElement('img');
    light.className = 'mk-logo-light';
    light.src = './assets/logo-light.png';
    light.alt = '';
    orig.parentNode.insertBefore(light, orig.nextSibling);
  }

  /* ---------------- BOOT ---------------- */
  // Preloader natychmiast (zanim React domaluje)
  if (document.body) buildLoader();
  else document.addEventListener('DOMContentLoaded', buildLoader);

  // Reszta dopiero gdy React zamontuje #root
  function enhance(tries) {
    var root = document.getElementById('root');
    if (!root || !root.children.length) {
      if (tries < 40) return setTimeout(function () { enhance(tries + 1); }, 80);
    }
    try { initScroll(); } catch (e) {}
    try { initMagnetic(); } catch (e) {}
    try { initReveal(); } catch (e) {}
    try { initAurora(); } catch (e) {}
    try { initShaderAurora(); } catch (e) {}
    try { initScramble(); } catch (e) {}
    try { initJourney(); } catch (e) {}
    try { initWarehouseBg(); } catch (e) {}
    try { initLogo(); } catch (e) {}
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    enhance(0);
  } else {
    window.addEventListener('DOMContentLoaded', function () { enhance(0); });
  }
})();
