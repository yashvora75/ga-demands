/* ═══════════════════════════════════════════════════════════
   GA Demands — interactions & animations
   Vanilla JS, no dependencies.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ── preloader ─────────────────────────────────── */
  window.addEventListener('load', function () {
    var pre = $('#preloader');
    if (pre) setTimeout(function () { pre.classList.add('is-done'); }, 450);
  });

  /* ── sticky header + scroll progress + fab ─────── */
  var header = $('#header');
  var bar    = $('#scrollProgress');
  var fab    = $('.whatsapp-fab');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (header) header.classList.toggle('is-stuck', y > 40);
    if (fab)    fab.classList.toggle('is-in', y > 600);
    if (bar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ── mobile nav ────────────────────────────────── */
  var burger = $('#burger');
  var nav    = $('#nav');
  if (burger && nav) {
    var toggleNav = function (open) {
      burger.classList.toggle('is-open', open);
      nav.classList.toggle('is-open', open);
      header.classList.toggle('is-open-nav', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', function () {
      toggleNav(!nav.classList.contains('is-open'));
    });
    $$('.nav__link, .nav__cta .btn', nav).forEach(function (a) {
      a.addEventListener('click', function () { toggleNav(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) toggleNav(false);
    });
  }

  /* ── scroll reveal ─────────────────────────────── */
  var revealables = $$('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.style.transitionDelay = (parseInt(el.dataset.delay || 0, 10)) + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ── animated counters ─────────────────────────────
     Reads data-target on each .stat__num. Set that value
     (or write it from your API) and the count-up runs.
     ───────────────────────────────────────────────── */
  function countUp(el) {
    var target = parseFloat(el.dataset.target || '0');
    var suffix = el.dataset.suffix || '';
    if (reduced || !target) { el.textContent = target.toLocaleString('en-IN') + suffix; return; }

    var dur = 1900, start = null;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);            // easeOutQuart
      el.textContent = Math.round(target * eased).toLocaleString('en-IN') + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var nums = $$('.stat__num[data-target]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { cio.observe(n); });
  } else {
    nums.forEach(countUp);
  }

  /* Public hook: wire your API to the counters.
     e.g. GADemands.setStats({ users: 12400, demands: 86000, inventory: 240000 }) */
  window.GADemands = window.GADemands || {};
  window.GADemands.setStats = function (data) {
    var map = ['users', 'demands', 'inventory'];
    nums.forEach(function (el, i) {
      var v = data[map[i]];
      if (typeof v === 'number') { el.dataset.target = v; countUp(el); }
    });
  };

  /* ── buyer / seller toggle ─────────────────────── */
  var toggleBtns = $$('.toggle__btn');
  var pill       = $('#togglePill');

  function movePill(btn) {
    if (!pill || !btn) return;
    // .toggle is position:relative, so offsetLeft is already relative to it.
    // Subtract the pill's own 5px inset so the two line up.
    pill.style.width = btn.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + (btn.offsetLeft - 5) + 'px)';
  }

  toggleBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var role = btn.dataset.role;
      toggleBtns.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', String(on));
      });
      $$('.steps').forEach(function (panel) {
        var on = panel.id === 'panel-' + role;
        panel.classList.toggle('is-active', on);
        panel.hidden = !on;
      });
      movePill(btn);
    });
  });

  function initPill() {
    var active = $('.toggle__btn.is-active');
    if (active) { pill.style.transition = 'none'; movePill(active);
      requestAnimationFrame(function () { pill.style.transition = ''; }); }
  }
  window.addEventListener('load', initPill);
  window.addEventListener('resize', initPill);

  /* ── testimonials carousel ─────────────────────── */
  var track = $('#testiTrack');
  if (track) {
    var step = function () {
      var card = track.querySelector('.quote');
      return card ? card.offsetWidth + 24 : 340;
    };
    var prev = $('#testiPrev'), next = $('#testiNext');
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left:  step(), behavior: 'smooth' }); });

    // drag to scroll
    var down = false, startX = 0, startScroll = 0;
    track.addEventListener('pointerdown', function (e) {
      down = true; startX = e.clientX; startScroll = track.scrollLeft;
      track.style.cursor = 'grabbing'; track.style.scrollSnapType = 'none';
    });
    track.addEventListener('pointermove', function (e) {
      if (!down) return;
      track.scrollLeft = startScroll - (e.clientX - startX);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
      track.addEventListener(ev, function () {
        down = false; track.style.cursor = ''; track.style.scrollSnapType = '';
      });
    });
  }

  /* ── FAQ tabs + accordions ─────────────────────── */
  $$('.faq__tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var cat = tab.dataset.cat;
      $$('.faq__tab').forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
      });
      $$('.faq__panel').forEach(function (p) {
        var on = p.dataset.cat === cat;
        p.classList.toggle('is-active', on);
        p.hidden = !on;
        if (!on) $$('.acc', p).forEach(function (a) {
          a.classList.remove('is-open');
          $('.acc__head', a).setAttribute('aria-expanded', 'false');
        });
      });
    });
  });

  $$('.acc__head').forEach(function (head) {
    head.addEventListener('click', function () {
      var item  = head.parentElement;
      var panel = item.closest('.faq__panel');
      var open  = !item.classList.contains('is-open');

      $$('.acc', panel).forEach(function (a) {
        a.classList.remove('is-open');
        $('.acc__head', a).setAttribute('aria-expanded', 'false');
      });
      if (open) {
        item.classList.add('is-open');
        head.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ── 3D tilt on phone mockups ──────────────────── */
  if (!reduced && window.matchMedia('(hover:hover)').matches) {
    $$('.tilt').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r  = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width  - 0.5;
        var py = (e.clientY - r.top)  / r.height - 0.5;
        el.style.transition = 'transform .12s linear';
        el.style.transform  = 'perspective(1100px) rotateY(' + (px * 11).toFixed(2) +
                              'deg) rotateX(' + (-py * 11).toFixed(2) + 'deg) scale(1.02)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transition = 'transform .8s cubic-bezier(.22,1,.36,1)';
        el.style.transform  = '';
      });
    });
  }

  /* ── hero sparkle canvas ───────────────────────── */
  var canvas = $('#sparkle');
  if (canvas && !reduced) {
    var ctx = canvas.getContext('2d');
    var dots = [], raf;

    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }
    function seed() {
      var n = Math.min(60, Math.round(canvas.offsetWidth / 22));
      dots = [];
      for (var i = 0; i < n; i++) {
        dots.push({
          x: Math.random() * canvas.offsetWidth,
          y: Math.random() * canvas.offsetHeight,
          r: Math.random() * 1.5 + 0.4,
          a: Math.random(),
          s: Math.random() * 0.012 + 0.004,
          vy: -(Math.random() * 0.22 + 0.06),
          gold: Math.random() > 0.72
        });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      dots.forEach(function (d) {
        d.a += d.s;
        d.y += d.vy;
        if (d.y < -6) { d.y = canvas.offsetHeight + 6; d.x = Math.random() * canvas.offsetWidth; }
        var o = (Math.sin(d.a) + 1) / 2 * 0.65 + 0.08;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = d.gold ? 'rgba(227,199,102,' + o + ')' : 'rgba(111,224,225,' + o + ')';
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }

    size();
    draw();
    window.addEventListener('resize', size);

    // pause when the hero is off screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { if (!raf) draw(); }
          else { cancelAnimationFrame(raf); raf = null; }
        });
      }, { threshold: 0 }).observe(canvas);
    }
  }

  /* ── parallax on showcase demand cards ─────────── */
  if (!reduced && window.matchMedia('(hover:hover)').matches) {
    var hero = $('#showcase') || $('.showcase');
    var cards = $$('.showcase__card');
    if (hero && cards.length) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width  - 0.5;
        var py = (e.clientY - r.top)  / r.height - 0.5;
        cards.forEach(function (c, i) {
          var d = (i + 1) * 8;
          c.style.translate = (px * d).toFixed(1) + 'px ' + (py * d).toFixed(1) + 'px';
        });
      });
      hero.addEventListener('pointerleave', function () {
        cards.forEach(function (c) { c.style.translate = ''; });
      });
    }
  }

  /* ── contact form ──────────────────────────────────
     No backend endpoint exists on the current site, so this
     validates and falls back to the visitor's mail client.
     Replace the body of send() with your fetch()/POST.
     ───────────────────────────────────────────────── */
  var form = $('#contactForm');
  if (form) {
    var note = $('#formNote');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      note.textContent = '';
      note.className = 'form__note';

      var required = $$('input[required], textarea[required]', form);
      var bad = false;

      required.forEach(function (input) {
        var wrap = input.closest('.field');
        var ok = input.type === 'checkbox' ? input.checked : input.value.trim() !== '';
        if (ok && input.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
        if (wrap) wrap.classList.toggle('is-error', !ok);
        if (!ok) bad = true;
      });

      if (bad) {
        note.textContent = 'Please complete the required fields with a valid email.';
        note.classList.add('is-bad');
        return;
      }

      var d = new FormData(form);
      var subject = 'GA Demands enquiry — ' + (d.get('firstName') || '') + ' ' + (d.get('lastName') || '');
      var body =
        'Name: '   + (d.get('firstName') || '') + ' ' + (d.get('lastName') || '') + '\n' +
        'Email: '  + (d.get('email')  || '') + '\n' +
        'Mobile: ' + (d.get('phone')  || '') + '\n\n' +
        (d.get('message') || '');

      window.location.href = 'mailto:info@gematlas.com?subject=' +
        encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);

      note.textContent = 'Opening your mail app — or write to us directly at info@gematlas.com';
      note.classList.add('is-ok');
    });

    $$('input, textarea', form).forEach(function (i) {
      i.addEventListener('input', function () {
        var w = i.closest('.field');
        if (w) w.classList.remove('is-error');
      });
    });
  }

  /* ── legal pages: TOC scroll-spy ───────────────── */
  var tocLinks = $$('.legal__toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    tocLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });

    var seen = [];
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var id = e.target.id;
        var i = seen.indexOf(id);
        if (e.isIntersecting) { if (i === -1) seen.push(id); }
        else if (i > -1) { seen.splice(i, 1); }
      });
      if (!seen.length) return;
      var order = $$('.legal__h').map(function (h) { return h.id; });
      var top = seen.slice().sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); })[0];
      tocLinks.forEach(function (a) {
        a.classList.toggle('is-current', a.getAttribute('href') === '#' + top);
      });
    }, { rootMargin: '-100px 0px -70% 0px', threshold: 0 });

    $$('.legal__h').forEach(function (h) { spy.observe(h); });
  }

  /* ── footer year ───────────────────────────────── */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

})();
