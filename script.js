(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* =========================================================
     Scroll-driven bits, all batched into one rAF per frame
     ========================================================= */
  var nav = document.getElementById('nav');
  var bar = document.getElementById('scrollBar');
  var timeline = document.getElementById('timeline');
  var progress = document.getElementById('tlProgress');
  var ticking = false;

  function frame() {
    ticking = false;
    var y = window.scrollY;
    nav.classList.toggle('scrolled', y > 12);

    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';

    if (timeline && progress) {
      var rect = timeline.getBoundingClientRect();
      var total = Math.max(rect.height - 28, 0);
      var filled = Math.max(0, Math.min(total, window.innerHeight * 0.7 - rect.top - 14));
      progress.style.height = filled + 'px';
    }
  }
  function requestFrame() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }
  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', requestFrame);
  frame();

  /* =========================================================
     Nav: mobile menu + active section
     ========================================================= */
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navlinks');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  toggle.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  var links = Array.prototype.slice.call(menu.querySelectorAll('a'));
  var byId = {};
  links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) { a.classList.remove('active'); });
          var a = byId[en.target.id];
          if (a) a.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) spy.observe(s);
    });
  }

  /* =========================================================
     Floating tech-stack background
     ========================================================= */
  var TECH = ['Python', 'PyTorch', 'TensorFlow', 'OpenCV', 'YOLO', 'LangChain', 'RAG', 'LLMs',
              'Keras', 'Scikit-learn', 'CNN', 'n8n', 'SQL', 'Jupyter', 'Multi-Agent AI', 'Prompt Engineering',
              'Groq API', 'OpenAI API', 'GitHub', 'Java'];

  function rand(a, b) { return a + Math.random() * (b - a); }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  // Chips are placed by rejection sampling: never on top of text, never on top of each other.
  function buildField(field) {
    var fr = field.getBoundingClientRect();
    var w = fr.width, h = fr.height;
    if (!w || !h) return;
    field.textContent = '';

    // keep-out zones from data-avoid="selector|expand, selector|expand" (negative = shrink)
    var zones = [];
    (field.getAttribute(w < 700 && field.hasAttribute('data-avoid-sm') ? 'data-avoid-sm' : 'data-avoid') || '').split(',').forEach(function (spec) {
      var parts = spec.trim().split('|');
      if (!parts[0]) return;
      var pad = parseFloat(parts[1] || '0');
      field.parentElement.querySelectorAll(parts[0]).forEach(function (el) {
        var r = el.getBoundingClientRect();
        zones.push({ l: r.left - fr.left - pad, t: r.top - fr.top - pad, r: r.right - fr.left + pad, b: r.bottom - fr.top + pad });
      });
    });
    var topGuard = parseFloat(field.getAttribute('data-top-guard') || '0');

    var small = w < 700;
    var target = parseInt(field.getAttribute(small ? 'data-count-sm' : 'data-count'), 10) || 10;
    var CW = small ? 104 : 150, CH = small ? 40 : 46;             // rough chip footprint
    var placed = [];
    var words = shuffle(TECH.slice());

    function free(x, y) {
      if (y < topGuard) return false;
      for (var i = 0; i < zones.length; i++) {
        var z = zones[i];
        if (x + CW > z.l && x < z.r && y + CH > z.t && y < z.b) return false;
      }
      for (var j = 0; j < placed.length; j++) {
        if (Math.abs(placed[j][0] - x) < CW + (small ? 10 : 24) && Math.abs(placed[j][1] - y) < CH + (small ? 14 : 30)) return false;
      }
      return true;
    }

    for (var n = 0; n < target && n < words.length; n++) {
      var x, y, ok = false;
      for (var tries = 0; tries < 160 && !ok; tries++) {
        x = rand(6, Math.max(7, w - CW - 6));
        y = rand(6, Math.max(7, h - CH - 6));
        ok = free(x, y);
      }
      if (!ok) continue;
      placed.push([x, y]);

      var roll = Math.random();
      var depth = roll < 0.4 ? 'd1' : roll < 0.8 ? 'd2' : 'd3';
      var chip = document.createElement('span');
      chip.className = 'fchip ' + depth + (Math.random() < 0.5 ? ' alt' : '');
      chip.style.left = (x / w * 100).toFixed(2) + '%';
      chip.style.top = (y / h * 100).toFixed(2) + '%';
      chip.style.setProperty('--dx', rand(-26, 26).toFixed(0) + 'px');
      chip.style.setProperty('--dy', rand(-24, 24).toFixed(0) + 'px');
      chip.style.setProperty('--r', rand(-4, 4).toFixed(1) + 'deg');
      chip.style.setProperty('--dur', rand(9, 17).toFixed(1) + 's');
      chip.style.setProperty('--del', (-rand(0, 14)).toFixed(1) + 's');
      chip.style.setProperty('--ci', (0.2 + n * 0.08).toFixed(2) + 's');

      var inner = document.createElement('span');
      inner.className = 'fi';
      inner.appendChild(document.createElement('i'));
      inner.appendChild(document.createTextNode(words[n]));
      chip.appendChild(inner);
      field.appendChild(chip);
    }
  }

  var fields = Array.prototype.slice.call(document.querySelectorAll('.float-field'));
  if (!reduce) {
    var start = function () { fields.forEach(buildField); };
    if (document.fonts && document.fonts.ready) {
      var started = false;
      var go = function () { if (!started) { started = true; start(); } };
      document.fonts.ready.then(go);
      setTimeout(go, 1200);
    } else { start(); }

    // rebuild on real width changes only (avoids mobile URL-bar resize churn)
    var lastW = window.innerWidth, t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        if (Math.abs(window.innerWidth - lastW) > 60) { lastW = window.innerWidth; fields.forEach(buildField); }
      }, 250);
    });

    // pause the drift when the field is off screen
    if ('IntersectionObserver' in window) {
      var vis = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { en.target.classList.toggle('paused', !en.isIntersecting); });
      });
      fields.forEach(function (f) { vis.observe(f); });
    }

    // gentle pointer parallax, eased with a lerp
    if (canHover) {
      fields.forEach(function (field) {
        var host = field.parentElement;
        var tx = 0, ty = 0, cx = 0, cy = 0, running = false;
        function step() {
          cx += (tx - cx) * 0.06;
          cy += (ty - cy) * 0.06;
          field.style.setProperty('--px', cx.toFixed(3));
          field.style.setProperty('--py', cy.toFixed(3));
          if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) requestAnimationFrame(step);
          else running = false;
        }
        function kick() { if (!running) { running = true; requestAnimationFrame(step); } }
        host.addEventListener('pointermove', function (e) {
          var rc = host.getBoundingClientRect();
          tx = ((e.clientX - rc.left) / rc.width) * 2 - 1;
          ty = ((e.clientY - rc.top) / rc.height) * 2 - 1;
          kick();
        }, { passive: true });
        host.addEventListener('pointerleave', function () { tx = 0; ty = 0; kick(); });
      });
    }
  }

  /* =========================================================
     Scroll reveals (staggered within each group)
     ========================================================= */
  var groups = [
    '.sec-title', '.prose > *', '.focus > div', '.skill-row', '.tl-tools', '.entry',
    '.proj-grid > .pcard', '.pub', '.group', '.contact-big', '.mail-big', '.contact-links'
  ];
  if (!reduce && 'IntersectionObserver' in window) {
    var revealIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        revealIo.unobserve(el);
        el.classList.add('in');
        // hand the element back to normal hover transitions once it has settled
        setTimeout(function () {
          el.classList.remove('reveal', 'in');
          el.style.removeProperty('--d');
        }, 1100 + (parseInt(el.style.getPropertyValue('--d'), 10) || 0));
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

    groups.forEach(function (sel) {
      var seen = new Map();
      document.querySelectorAll(sel).forEach(function (el) {
        var parent = el.parentElement;
        var n = seen.get(parent) || 0;
        seen.set(parent, n + 1);
        el.classList.add('reveal');
        el.style.setProperty('--d', Math.min(n, 5) * 90 + 'ms');
        revealIo.observe(el);
      });
    });
  }

  /* =========================================================
     Experience: node highlight + expand/collapse all
     ========================================================= */
  var entries = Array.prototype.slice.call(document.querySelectorAll('.entry'));
  if ('IntersectionObserver' in window) {
    var seenIo = new IntersectionObserver(function (list) {
      list.forEach(function (en) { if (en.isIntersecting) en.target.classList.add('seen'); });
    }, { rootMargin: '0px 0px -30% 0px' });
    entries.forEach(function (el) { seenIo.observe(el); });
  } else {
    entries.forEach(function (el) { el.classList.add('seen'); });
  }

  var toggleAll = document.getElementById('toggleAll');
  function syncToggleLabel() {
    var allOpen = entries.every(function (d) { return d.open; });
    toggleAll.textContent = allOpen ? 'Collapse all' : 'Expand all';
  }
  toggleAll.addEventListener('click', function () {
    var allOpen = entries.every(function (d) { return d.open; });
    entries.forEach(function (d) { d.open = !allOpen; });
    syncToggleLabel();
    requestFrame();
  });
  entries.forEach(function (d) {
    d.addEventListener('toggle', function () { syncToggleLabel(); requestFrame(); });
  });
  syncToggleLabel();
  /* =========================================================
     Contrast motion layer: pointer glow + gentle magnetic buttons
     ========================================================= */
  if (!reduce && canHover) {
    var hero = document.getElementById('hero');
    if (hero) {
      hero.addEventListener('pointermove', function(e){
        var r = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', ((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
        hero.style.setProperty('--my', ((e.clientY-r.top)/r.height*100).toFixed(1)+'%');
      }, {passive:true});
    }
    document.querySelectorAll('.actions .btn, .contact-links .btn, .navcta').forEach(function(btn){
      btn.addEventListener('pointermove', function(e){
        var r=btn.getBoundingClientRect();
        var x=(e.clientX-r.left-r.width/2)/r.width*8;
        var y=(e.clientY-r.top-r.height/2)/r.height*8;
        btn.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px) translateY(-2px)';
      });
      btn.addEventListener('pointerleave', function(){ btn.style.transform=''; });
    });
  }

})();

/* ==========================================================================
   Hero portrait slider + 3D certificate coverflow
   ========================================================================== */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- hero portraits: one active slide, the previous one flips out ---- */
  var slides = Array.prototype.slice.call(document.querySelectorAll('.frame .slide'));
  var dotsBox = document.getElementById('pdots');
  if (slides.length > 1 && dotsBox) {
    var cur = 0, timer, pdots = slides.map(function (_, i) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Show photo ' + (i + 1));
      b.addEventListener('click', function () { show(i); play(); });
      dotsBox.appendChild(b); return b;
    });
    dotsBox.removeAttribute('aria-hidden');
    var show = function (n) {
      if (n === cur) return;
      slides[cur].classList.remove('on'); slides[cur].classList.add('out');
      var old = slides[cur]; setTimeout(function () { old.classList.remove('out'); }, 800);
      cur = n; slides[cur].classList.remove('out'); slides[cur].classList.add('on');
      pdots.forEach(function (d, i) { d.classList.toggle('on', i === cur); });
    };
    var play = function () { clearInterval(timer); if (!reduce) timer = setInterval(function () { show((cur + 1) % slides.length); }, 1500); };
    pdots[0].classList.add('on'); play();
    var fr = document.querySelector('.frame');
  }

  /* ---- certificates + internships: two self-sliding rows ---- */
  var C = 'assets/certs/', I = 'assets/internships/';
  var DATA = {
    certs: [
      [C + 'ibm-genai-essentials.jpg', 'Generative AI Essentials: Using LLMs to Work with Data', 'IBM SkillsBuild · July 2026'],
      [C + 'databricks-fundamentals.jpg', 'Databricks Fundamentals Accreditation', 'Databricks Academy · March 2026'],
      [C + 'deloitte-data-analytics.jpg', 'Data Analytics Job Simulation', 'Deloitte (Forage) · October 2025'],
      [C + 'aws-solutions-architecture.jpg', 'Solutions Architecture Job Simulation', 'AWS (Forage) · October 2025'],
      [C + 'hackerrank-software-engineer.jpg', 'Software Engineer role certification', 'HackerRank · September 2025'],
      [C + 'hackerrank-java.jpg', 'Java (Basic)', 'HackerRank · September 2025'],
      [C + 'hackerrank-problem-solving.jpg', 'Problem Solving (Basic)', 'HackerRank · September 2025'],
      [C + 'ibm-data-science-tools.jpg', 'Data Science Tools', 'IBM, via Cognitive Class']
    ],
    intern: [
      [I + 'hexaware-certificate.jpg', 'Certificate of Internship, Gen AI', 'Hexaware Technologies · Feb–Jun 2026'],
      [I + 'hexaware-completion-letter.jpg', 'Project internship completion letter', 'Hexaware Technologies · July 2026'],
      [I + 'eubix-completion.jpg', 'Internship completion letter, Machine Learning', 'Eubix Technologies, IITM Research Park · 2024'],
      [I + 'eubix-recommendation.jpg', 'Letter of recommendation', 'Eubix Technologies · October 2024'],
      [I + 'eubix-offer.jpg', 'Internship offer letter', 'Eubix Technologies · August 2024'],
      [I + 'intern-army-python.jpg', 'Virtual internship, Python', 'Intern Army · Apr–May 2024'],
      [I + 'bharat-intern-ml.jpg', 'Virtual internship, Machine Learning', 'Bharat Intern · Jan–Feb 2024'],
      [I + 'prodigy-infotech-ml.jpg', 'Internship, Machine Learning', 'Prodigy InfoTech · Jan–Feb 2024']
    ]
  };
  var box = document.getElementById('cfBox'), big = document.getElementById('cfBig'), boxCap = document.getElementById('cfBoxCap');
  if (!box) return;

  function openBox(d) {
    big.src = d[0]; big.alt = d[1] + ', ' + d[2]; boxCap.textContent = d[1] + ' · ' + d[2];
    if (box.showModal) box.showModal();
  }
  box.addEventListener('click', function (e) { if (e.target === box) box.close(); });

  function buildRow(key, trackId) {
    var track = document.getElementById(trackId);
    if (!track) return;
    var list = DATA[key];
    // the list is rendered twice so the -50% slide loops with no jump
    for (var pass = 0; pass < 2; pass++) {
      list.forEach(function (d) {
        var fig = document.createElement('figure');
        fig.className = 'cf-item' + (pass ? ' dup' : '');
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'cf-thumb';
        b.setAttribute('aria-label', 'View ' + d[1] + ', ' + d[2]);
        if (pass) { b.tabIndex = -1; fig.setAttribute('aria-hidden', 'true'); }
        var im = document.createElement('img');
        im.src = d[0]; im.alt = pass ? '' : d[1] + ', ' + d[2]; im.draggable = false; im.decoding = 'async';
        b.appendChild(im);
        b.addEventListener('click', function () { openBox(d); });
        var cap = document.createElement('figcaption');
        var t = document.createElement('b'); t.textContent = d[1];
        var m = document.createElement('span'); m.textContent = d[2];
        cap.appendChild(t); cap.appendChild(m);
        fig.appendChild(b); fig.appendChild(cap);
        track.appendChild(fig);
      });
    }
    track.style.setProperty('--dur', (list.length * 6) + 's');
    var cnt = document.querySelector('[data-count-for="' + key + '"]');
    if (cnt) cnt.textContent = list.length + ' items';
  }
  buildRow('certs', 'trackCerts');
  buildRow('intern', 'trackIntern');

  // only animate while the section is on screen
  var rows = document.querySelectorAll('.cf-row');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { e.target.classList.toggle('paused', !e.isIntersecting); });
    }, { threshold: 0.05 });
    Array.prototype.forEach.call(rows, function (r) { r.classList.add('paused'); io.observe(r); });
  }
})();

/* ==========================================================================
   3D layer: pointer tilt, depth parallax on the wireframe shapes
   ========================================================================== */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduce) return;

  /* ---- cards tilt toward the pointer, with a moving highlight ---- */
  function tilt(el, max, lift) {
    el.classList.add('tilt');
    var g = document.createElement('span'); g.className = 'glare'; g.setAttribute('aria-hidden', 'true');
    el.appendChild(g);
    el.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.transition = 'transform .12s ease-out, box-shadow .4s';
      el.style.transform = 'perspective(900px) rotateX(' + ((0.5 - py) * max * 2).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * max * 2).toFixed(2) + 'deg) translateY(' + (-lift) + 'px)';
      el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
      el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
    });
    el.addEventListener('pointerleave', function () { el.style.transition = ''; el.style.transform = ''; });
  }
  if (canHover) {
    document.querySelectorAll('.pcard').forEach(function (el) { tilt(el, 7, 8); });
    document.querySelectorAll('.focus > div').forEach(function (el) { tilt(el, 5, 5); });
  }

  /* ---- hero portrait follows the pointer ---- */
  var hero = document.getElementById('hero');
  var portrait = document.getElementById('portrait');
  if (hero && portrait && canHover) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      portrait.classList.add('live');
      portrait.style.transform = 'perspective(1100px) rotateY(' + (px * 14).toFixed(2) + 'deg) rotateX(' + (-py * 10).toFixed(2) + 'deg)';
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { portrait.classList.remove('live'); portrait.style.transform = ''; });
  }

  /* ---- wireframe shapes: depth parallax from pointer + scroll ---- */
  var shapes = Array.prototype.slice.call(document.querySelectorAll('.s3d')).map(function (el) {
    return { el: el, host: el.parentElement, depth: parseFloat(el.getAttribute('data-depth') || '0'), speed: parseFloat(el.getAttribute('data-speed') || '0'), on: false };
  });
  var mx = 0, my = 0, tmx = 0, tmy = 0, raf = 0;
  function paint() {
    raf = 0;
    mx += (tmx - mx) * 0.08; my += (tmy - my) * 0.08;
    shapes.forEach(function (s) {
      if (!s.on) return;
      var top = s.host.getBoundingClientRect().top;
      var sy = -top * s.speed;
      s.el.style.transform = 'translate3d(' + (mx * s.depth).toFixed(1) + 'px,' + (my * s.depth + sy).toFixed(1) + 'px,0)';
    });
    if (Math.abs(tmx - mx) > 0.002 || Math.abs(tmy - my) > 0.002) kick();
  }
  function kick() { if (!raf) raf = requestAnimationFrame(paint); }
  if ('IntersectionObserver' in window) {
    var vis = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        shapes.forEach(function (s) { if (s.host === e.target) s.on = e.isIntersecting; });
      });
      kick();
    });
    var seen = [];
    shapes.forEach(function (s) { if (seen.indexOf(s.host) < 0) { seen.push(s.host); vis.observe(s.host); } });
  } else { shapes.forEach(function (s) { s.on = true; }); }
  window.addEventListener('scroll', kick, { passive: true });
  if (canHover) {
    window.addEventListener('pointermove', function (e) {
      tmx = e.clientX / window.innerWidth - 0.5; tmy = e.clientY / window.innerHeight - 0.5; kick();
    }, { passive: true });
  }
})();
