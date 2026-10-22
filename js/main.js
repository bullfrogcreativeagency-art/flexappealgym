(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  // Mobile menu
  var menuBtn = document.querySelector('.menu-btn');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    $$('.mobile-nav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  // Header gets solid once the page scrolls
  function onScroll() { root.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Opening hours in UK time. Index 0 = Sunday. Bank holidays follow weekend hours.
  var HOURS = [[7, 18], [6, 22], [6, 22], [6, 22], [6, 22], [6, 21], [7, 18]];
  function ukNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday), mins: parseInt(o.hour, 10) * 60 + parseInt(o.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), mins: d.getHours() * 60 + d.getMinutes() };
    }
  }
  function fmt(h) { return (h % 12 || 12) + (h < 12 ? 'am' : 'pm'); }
  var now = ukNow();
  var today = HOURS[now.day];
  var isOpen = now.mins >= today[0] * 60 && now.mins < today[1] * 60;
  var msg = isOpen ? 'Open now · until ' + fmt(today[1])
    : now.mins < today[0] * 60 ? 'Closed · opens ' + fmt(today[0]) + ' today'
    : 'Closed · opens ' + fmt(HOURS[(now.day + 1) % 7][0]) + ' tomorrow';
  $$('[data-status]').forEach(function (el) {
    el.classList.add(isOpen ? 'is-open' : 'is-closed');
    var t = el.querySelector('.txt');
    if (t) t.textContent = msg;
  });
  $$('[data-day]').forEach(function (row) {
    if (row.getAttribute('data-day').split(',').indexOf(String(now.day)) > -1) row.classList.add('today');
  });
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Hero slideshow
  $$('.showcase').forEach(function (box) {
    var imgs = $$('img', box), dots = $$('.show-dots button', box), i = 0, timer;
    if (imgs.length < 2) return;
    function go(n) {
      imgs[i].classList.remove('on'); if (dots[i]) dots[i].classList.remove('on');
      i = (n + imgs.length) % imgs.length;
      imgs[i].classList.add('on');
      if (dots[i]) { dots[i].classList.remove('on'); void dots[i].offsetWidth; dots[i].classList.add('on'); }
      clearTimeout(timer);
      if (!reduce) timer = setTimeout(function () { go(i + 1); }, 5000);
    }
    dots.forEach(function (d, n) { d.addEventListener('click', function () { go(n); }); });
    go(0);
  });

  // Sliders: buttons, progress, counter, mouse drag
  $$('.slider').forEach(function (s) {
    var track = s.querySelector('.slider-track');
    var prev = s.querySelector('[data-prev]'), next = s.querySelector('[data-next]');
    var bar = s.querySelector('.slider-progress span'), count = s.querySelector('.slider-count');
    if (!track) return;
    function step() {
      var first = track.children[0];
      var gap = parseFloat(getComputedStyle(track).columnGap) || 16;
      return first ? first.getBoundingClientRect().width + gap : track.clientWidth * .8;
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth;
      var x = track.scrollLeft;
      if (prev) prev.disabled = x <= 4;
      if (next) next.disabled = x >= max - 4;
      if (bar) {
        var vis = Math.min(1, track.clientWidth / track.scrollWidth);
        bar.style.width = (vis * 100) + '%';
        bar.style.transform = 'translateX(' + (max > 0 ? (x / max) * ((1 - vis) / vis) * 100 : 0) + '%)';
      }
      if (count) {
        var n = track.children.length;
        var idx = Math.min(n, Math.round(x / step()) + 1);
        if (x >= max - 4) idx = n;
        count.textContent = String(idx).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
      }
    }
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }); });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); next && next.click(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev && prev.click(); }
    });
    // Drag with a mouse (touch already scrolls natively)
    var down = false, startX = 0, startL = 0, moved = false;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startL = track.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6) { moved = true; track.classList.add('dragging'); }
      if (moved) track.scrollLeft = startL - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      if (moved) {
        track.classList.remove('dragging');
        var st = step(), target = Math.round(track.scrollLeft / st) * st;
        track.scrollTo({ left: target, behavior: reduce ? 'auto' : 'smooth' });
        track.addEventListener('click', function block(ev) { ev.preventDefault(); ev.stopPropagation(); track.removeEventListener('click', block, true); }, true);
      }
    });
    s._update = update;
    update();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
    window.addEventListener('load', update);
  });

  // Tabs (equipment categories, membership plans, trainers)
  $$('[role="tablist"]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
        if (on && panel) {
          var sl = panel.querySelector('.slider');
          if (sl && sl._update) { var tr = sl.querySelector('.slider-track'); tr.scrollLeft = 0; sl._update(); }
        }
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, n) {
      t.addEventListener('click', function () {
        select(t);
        if (list.hasAttribute('data-hash')) history.replaceState(null, '', '#' + t.getAttribute('data-key'));
      });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); select(tabs[(n + d + tabs.length) % tabs.length], true); }
      });
    });
    var key = location.hash.replace('#', '');
    var fromHash = key && tabs.filter(function (t) { return t.getAttribute('data-key') === key; })[0];
    select(fromHash || tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0]);
    if (fromHash) setTimeout(function () { list.scrollIntoView({ block: 'start' }); }, 50);
  });

  // Count-up numbers
  function countUp(el) {
    var end = parseFloat(el.getAttribute('data-count'));
    if (reduce || isNaN(end)) return;
    var dur = 1200, t0 = null, fmtNum = function (v) { return Math.round(v).toLocaleString('en-GB'); };
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmtNum(end * e);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Reveal on scroll
  var revealEls = $$('[data-reveal]'), counters = $$('[data-count]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        $$('[data-count]', en.target).forEach(countUp);
        if (en.target.hasAttribute('data-count')) countUp(en.target);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
    counters.forEach(function (el) { if (!el.closest('[data-reveal]')) io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  // Lightbox for equipment photos, scoped to the slider they belong to
  var box, img, count, group = [], idx = 0, lastFocus;
  var icon = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>'; };
  function build() {
    box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Equipment photo');
    box.hidden = true;
    box.innerHTML = '<img alt=""><button class="lb-close" aria-label="Close">' + icon('M6 6l12 12M18 6L6 18') + '</button>' +
      '<button class="lb-prev" aria-label="Previous photo">' + icon('M15 6l-6 6 6 6') + '</button>' +
      '<button class="lb-next" aria-label="Next photo">' + icon('M9 6l6 6-6 6') + '</button><div class="lb-count"></div>';
    document.body.appendChild(box);
    img = box.querySelector('img');
    count = box.querySelector('.lb-count');
    box.querySelector('.lb-close').addEventListener('click', close);
    box.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    box.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    var x0 = null;
    box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }
  function show(i) {
    idx = (i + group.length) % group.length;
    var a = group[idx];
    img.src = a.getAttribute('href');
    img.alt = a.querySelector('img').alt;
    count.textContent = (idx + 1) + ' / ' + group.length;
  }
  function close() {
    box.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  $$('a.shot').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      if (!box) build();
      var scope = a.closest('.slider-track') || document;
      group = $$('a.shot', scope);
      lastFocus = a;
      show(group.indexOf(a));
      box.hidden = false;
      document.body.style.overflow = 'hidden';
      box.querySelector('.lb-close').focus();
    });
  });
})();
