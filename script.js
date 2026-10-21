/* ===== CampusFind – shared script ===== */
(function () {
  'use strict';

  /* ---------- helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // localStorage can be blocked (private mode), so every access is wrapped
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  const pad = (n) => String(n).padStart(2, '0');
  const localISO = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const todayISO = () => localISO(new Date());
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return localISO(d); };
  const parseISO = (iso) => new Date(iso + 'T00:00:00');
  const fmt = (iso) => parseISO(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const rel = (iso) => {
    const diff = Math.round((parseISO(todayISO()) - parseISO(iso)) / 86400000);
    if (diff <= 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 8) return diff + ' days ago';
    return fmt(iso);
  };

  /* ---------- theme (applied immediately to avoid a flash) ---------- */
  const root = document.documentElement;
  const startTheme = store.get('cf_theme', null) ||
    (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  root.setAttribute('data-theme', startTheme);

  /* ---------- toast & confetti ---------- */
  let toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
  }

  function confetti() {
    if (reduceMotion) return;
    const colors = ['#5b5bf0', '#8b5cf6', '#ff7a59', '#10b981', '#facc15', '#ef4444'];
    for (let i = 0; i < 46; i++) {
      const c = document.createElement('i');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[i % colors.length];
      c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      c.style.setProperty('--x', Math.random() * 160 - 80 + 'px');
      c.style.setProperty('--r', Math.random() * 900 - 450 + 'deg');
      c.style.setProperty('--t', 1.6 + Math.random() * 1.4 + 's');
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 3200);
    }
  }

  /* ---------- data ---------- */
  const CATS = {
    'Electronics': '📱', 'Books & Notes': '📚', 'ID & Cards': '🪪', 'Keys': '🔑',
    'Bags': '🎒', 'Clothing': '🧥', 'Wallet': '👛', 'Other': '📦'
  };
  const DESK = 'Lost & Found Desk, Admin Block';

  const SEED = [
    { id: 's1', type: 'found', title: 'Black backpack', category: 'Bags', location: 'Library', date: daysAgo(1), desc: 'Black backpack with a blue water bottle and two notebooks inside. Handed to the library help desk.', contact: DESK },
    { id: 's2', type: 'lost', title: 'Blue iPhone 13', category: 'Electronics', location: 'CS Block', date: daysAgo(2), desc: 'Blue iPhone 13 in a clear case with a sticker on the back. Probably dropped near the lab corridor.', contact: DESK },
    { id: 's3', type: 'found', title: 'Keys with a red tag', category: 'Keys', location: 'Cafeteria', date: daysAgo(3), desc: 'Three keys on a ring with a red tag and a small football keychain.', contact: DESK, status: 'returned' },
    { id: 's4', type: 'lost', title: 'Student ID card', category: 'ID & Cards', location: 'Main Gate', date: daysAgo(2), desc: 'Student ID card, Department of Computer Science. Lost near the main gate security desk.', contact: DESK },
    { id: 's5', type: 'found', title: 'Casio scientific calculator', category: 'Electronics', location: 'Exam Hall B', date: daysAgo(4), desc: 'Casio fx-991 calculator with initials scratched on the back. Found under a desk after the exam.', contact: DESK },
    { id: 's6', type: 'lost', title: 'Brown leather wallet', category: 'Wallet', location: 'Sports Ground', date: daysAgo(5), desc: 'Brown leather wallet with a bus pass inside. Last seen near the cricket nets.', contact: DESK },
    { id: 's7', type: 'found', title: 'Grey hoodie', category: 'Clothing', location: 'Auditorium', date: daysAgo(6), desc: 'Grey zip-up hoodie, size L, left on a seat in row 4 after the seminar.', contact: DESK },
    { id: 's8', type: 'lost', title: 'Data Structures textbook', category: 'Books & Notes', location: 'Library', date: daysAgo(7), desc: 'Hardcover textbook with highlighted chapters and a name written on the first page.', contact: DESK },
    { id: 's9', type: 'found', title: 'White earbuds case', category: 'Electronics', location: 'Admin Block', date: daysAgo(1), desc: 'White wireless earbuds charging case found on the reception bench.', contact: DESK },
    { id: 's10', type: 'lost', title: 'Silver wristwatch', category: 'Other', location: 'Parking', date: daysAgo(9), desc: 'Silver analog wristwatch with a metal strap. Possibly fell off near the parking entrance.', contact: DESK },
    { id: 's11', type: 'found', title: 'Black umbrella', category: 'Other', location: 'Bus Stop', date: daysAgo(3), desc: 'Large black umbrella with a wooden handle, left at the campus bus stop.', contact: DESK },
    { id: 's12', type: 'lost', title: 'Green steel water bottle', category: 'Other', location: 'Cafeteria', date: daysAgo(8), desc: 'Green insulated steel bottle with a dent near the bottom.', contact: DESK, status: 'returned' }
  ];

  function allItems() {
    const user = store.get('cf_items', []);
    const returned = new Set(store.get('cf_returned', []));
    return user.concat(SEED).map((i) => Object.assign({}, i, {
      status: i.status === 'returned' || returned.has(i.id) ? 'returned' : 'open'
    }));
  }
  const byNewest = (a, b) => b.date.localeCompare(a.date);

  function cardHTML(it, i) {
    const icon = CATS[it.category] || CATS.Other;
    const done = it.status === 'returned';
    return '<article class="card reveal' + (done ? ' done' : '') + '" style="--d:' + Math.min(i, 8) * 0.06 + 's" data-id="' + esc(it.id) +
      '" tabindex="0" role="button" aria-label="View details: ' + esc(it.title) + '">' +
      '<div class="item-top"><span class="icon" aria-hidden="true">' + icon + '</span>' +
      '<span class="badge ' + (done ? 'returned' : it.type) + '">' + (done ? 'Returned' : it.type) + '</span></div>' +
      '<h3>' + esc(it.title) + '</h3>' +
      '<p class="meta">📍 ' + esc(it.location) + ' · 🗓 ' + esc(rel(it.date)) + '</p>' +
      '<p class="desc">' + esc(it.desc) + '</p>' +
      '<span class="meta">View details →</span></article>';
  }

  /* ---------- reveal on scroll & counters ---------- */
  const revealIO = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); } });
      }, { threshold: 0.12 })
    : null;

  function observeReveals(scope) {
    const els = $$('.reveal:not(.in)', scope || document);
    els.forEach((el) => (revealIO ? revealIO.observe(el) : el.classList.add('in')));
  }

  function animateCount(el) {
    const target = Number(el.dataset.count) || 0;
    if (reduceMotion) { el.textContent = target.toLocaleString(); return; }
    const dur = 1400, t0 = performance.now();
    (function tick(t) {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  function observeCounters() {
    const els = $$('[data-count]');
    if (!('IntersectionObserver' in window)) { els.forEach(animateCount); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { animateCount(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.6 });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- shared UI: nav, theme, footer year ---------- */
  function initChrome() {
    const toggle = $('#navToggle'), links = $('#navLinks');
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        const open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
      });
      links.addEventListener('click', (e) => {
        if (e.target.closest('a')) { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
      });
    }
    const tb = $('#themeBtn');
    if (tb) {
      const paint = () => { tb.textContent = root.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'; };
      paint();
      tb.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        store.set('cf_theme', next);
        paint();
      });
    }
    const y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- HOME ---------- */
  function initHome() {
    const items = allItems();
    const latest = items.filter((i) => i.status === 'open').sort(byNewest).slice(0, 3);
    const box = $('#latest');
    if (box) {
      box.innerHTML = latest.map(cardHTML).join('');
      const go = (card) => { if (card) location.href = 'browse.html?id=' + encodeURIComponent(card.dataset.id); };
      box.addEventListener('click', (e) => go(e.target.closest('.card')));
      box.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e.target.closest('.card')); } });
    }
    const set = (id, n) => { const el = $(id); if (el) el.dataset.count = n; };
    set('#stTotal', items.length);
    set('#stReturned', items.filter((i) => i.status === 'returned').length);
    set('#stLost', items.filter((i) => i.status === 'open' && i.type === 'lost').length);
    set('#stFound', items.filter((i) => i.status === 'open' && i.type === 'found').length);

    const form = $('#heroSearch');
    if (form) form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = $('#heroQ').value.trim();
      location.href = 'browse.html' + (q ? '?q=' + encodeURIComponent(q) : '');
    });

    const track = $('#marqueeTrack');
    if (track) {
      const dup = track.innerHTML;
      track.insertAdjacentHTML('beforeend', dup.replace(/<span /g, '<span aria-hidden="true" '));
    }
    observeCounters();
  }

  /* ---------- BROWSE ---------- */
  function initBrowse() {
    const params = new URLSearchParams(location.search);
    const t = params.get('type');
    const state = {
      tab: t === 'lost' || t === 'found' ? t : 'all',
      q: (params.get('q') || '').trim(),
      cat: 'all',
      sort: 'new'
    };
    const grid = $('#grid'), count = $('#count'), qInput = $('#q'), catSel = $('#cat'), sortSel = $('#sort');
    const modal = $('#modal'), body = $('#modalBody'), closeBtn = $('#modalClose');
    let lastFocus = null;

    qInput.value = state.q;
    $$('.tab').forEach((b) => {
      b.classList.toggle('active', b.dataset.tab === state.tab);
      b.setAttribute('aria-pressed', String(b.dataset.tab === state.tab));
    });

    function render() {
      const q = state.q.toLowerCase();
      const list = allItems().filter((i) =>
        (state.tab === 'all' || i.type === state.tab) &&
        (state.cat === 'all' || i.category === state.cat) &&
        (!q || (i.title + ' ' + i.desc + ' ' + i.location + ' ' + i.category).toLowerCase().includes(q))
      );
      list.sort(state.sort === 'old' ? (a, b) => a.date.localeCompare(b.date) : byNewest);
      count.textContent = list.length + (list.length === 1 ? ' item found' : ' items found');
      grid.innerHTML = list.length
        ? list.map(cardHTML).join('')
        : '<div class="empty"><span class="big" aria-hidden="true">🔍</span><h3>Nothing matched</h3><p>Try a different word, or report the item so others can help.</p><p style="margin-top:1rem"><a class="btn btn-sm" href="report.html">Report an item</a></p></div>';
      observeReveals(grid);
    }

    function openModal(id) {
      const it = allItems().find((x) => x.id === id);
      if (!it) return;
      const done = it.status === 'returned';
      const verb = it.type === 'lost' ? 'Lost' : 'Found';
      body.innerHTML =
        '<div class="big-icon" aria-hidden="true">' + (CATS[it.category] || CATS.Other) + '</div>' +
        '<span class="badge ' + (done ? 'returned' : it.type) + '">' + (done ? 'Returned' : it.type) + '</span>' +
        '<h2 id="mTitle" style="margin:.6rem 0">' + esc(it.title) + '</h2>' +
        '<ul class="detail-list">' +
        '<li><b>Category</b>' + esc(it.category) + '</li>' +
        '<li><b>' + verb + ' at</b>' + esc(it.location) + '</li>' +
        '<li><b>Date</b>' + esc(fmt(it.date)) + '</li>' +
        '<li><b>Status</b>' + (done ? 'Returned to owner ✅' : 'Still open') + '</li></ul>' +
        '<p style="color:var(--muted)">' + esc(it.desc) + '</p>' +
        '<div class="modal-actions">' +
        '<button class="btn" id="contactBtn" type="button">' + (it.type === 'lost' ? '🙋 I found this' : '✋ This is mine') + '</button>' +
        (done ? '' : '<button class="btn btn-outline" id="returnBtn" type="button">Mark as returned</button>') +
        '</div><p class="meta" id="contactOut" style="margin-top:1rem" hidden></p>';

      $('#contactBtn', body).addEventListener('click', () => {
        const out = $('#contactOut', body);
        out.hidden = false;
        out.textContent = '📞 Contact: ' + (it.contact || DESK);
      });
      const rb = $('#returnBtn', body);
      if (rb) rb.addEventListener('click', () => {
        const r = store.get('cf_returned', []);
        if (r.indexOf(it.id) === -1) r.push(it.id);
        store.set('cf_returned', r);
        closeModal();
        render();
        confetti();
        toast('Marked as returned 🎉 Great job!');
      });

      lastFocus = document.activeElement;
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }
    function closeModal() {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    // events
    let timer;
    qInput.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { state.q = qInput.value.trim(); render(); }, 150); });
    catSel.addEventListener('change', () => { state.cat = catSel.value; render(); });
    sortSel.addEventListener('change', () => { state.sort = sortSel.value; render(); });
    $$('.tab').forEach((b) => b.addEventListener('click', () => {
      state.tab = b.dataset.tab;
      $$('.tab').forEach((x) => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      render();
    }));
    const open = (e) => { const c = e.target.closest('.card'); if (c) openModal(c.dataset.id); };
    grid.addEventListener('click', open);
    grid.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); } });
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('open')) return;
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key === 'Tab') { // keep focus inside the dialog
        const f = $$('button:not([disabled])', modal);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    render();
    const id = params.get('id');
    if (id) openModal(id);
  }

  /* ---------- REPORT ---------- */
  function initReport() {
    const form = $('#reportForm'), success = $('#success');
    const dateEl = form.elements.date;
    dateEl.max = todayISO();
    dateEl.value = todayISO();

    const rules = {
      title: (v) => v.trim().length >= 3,
      category: (v) => !!v,
      location: (v) => v.trim().length >= 2,
      date: (v) => !!v && v <= todayISO(),
      desc: (v) => v.trim().length >= 10,
      contact: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || /^\+?[\d\s-]{10,16}$/.test(v.trim())
    };

    // wording changes with the selected type
    function syncType() {
      const lost = form.elements.type.value === 'lost';
      $('#formTitle').textContent = lost ? 'Report a lost item' : 'Report a found item';
      $('#locLabel').textContent = lost ? 'Where did you lose it?' : 'Where did you find it?';
      $('#dateLabel').textContent = lost ? 'Date lost' : 'Date found';
    }
    const t = new URLSearchParams(location.search).get('type');
    if (t === 'lost' || t === 'found') form.elements.type.value = t;
    $$('input[name="type"]', form).forEach((r) => r.addEventListener('change', syncType));
    syncType();

    // clear the error as soon as the value becomes valid
    Object.keys(rules).forEach((k) => {
      const el = form.elements[k];
      const check = () => { if (rules[k](el.value)) el.closest('.field').classList.remove('invalid'); };
      el.addEventListener('input', check);
      el.addEventListener('change', check);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let first = null;
      Object.keys(rules).forEach((k) => {
        const el = form.elements[k];
        const ok = rules[k](el.value);
        el.closest('.field').classList.toggle('invalid', !ok);
        if (!ok && !first) first = el;
      });
      if (first) { first.focus(); toast('Please fix the highlighted fields'); return; }

      const item = {
        id: 'u' + Date.now(),
        type: form.elements.type.value,
        title: form.elements.title.value.trim(),
        category: form.elements.category.value,
        location: form.elements.location.value.trim(),
        date: form.elements.date.value,
        desc: form.elements.desc.value.trim(),
        contact: form.elements.contact.value.trim(),
        reporter: form.elements.reporter.value.trim()
      };
      const items = store.get('cf_items', []);
      items.unshift(item);
      store.set('cf_items', items);

      const ref = 'CF-' + Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + String(Date.now()).slice(-4);
      $('#refCode').textContent = ref;
      form.hidden = true;
      success.classList.add('show');
      success.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      confetti();
    });

    $('#again').addEventListener('click', () => {
      form.reset();
      dateEl.value = todayISO();
      $$('.field', form).forEach((f) => f.classList.remove('invalid'));
      syncType();
      success.classList.remove('show');
      form.hidden = false;
      form.elements.title.focus();
    });
  }

  /* ---------- HELP ---------- */
  function initHelp() {
    const items = $$('.faq-item');
    items.forEach((item) => {
      const btn = $('.faq-q', item), ans = $('.faq-a', item);
      btn.addEventListener('click', () => {
        const willOpen = !item.classList.contains('open');
        items.forEach((o) => {
          o.classList.remove('open');
          $('.faq-q', o).setAttribute('aria-expanded', 'false');
          $('.faq-a', o).style.maxHeight = '0';
        });
        if (willOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
          ans.style.maxHeight = ans.scrollHeight + 'px';
        }
      });
    });

    const form = $('#contactForm');
    if (!form) return;
    const rules = {
      cname: (v) => v.trim().length >= 2,
      cemail: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      cmsg: (v) => v.trim().length >= 10
    };
    Object.keys(rules).forEach((k) => {
      const el = form.elements[k];
      el.addEventListener('input', () => { if (rules[k](el.value)) el.closest('.field').classList.remove('invalid'); });
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let first = null;
      Object.keys(rules).forEach((k) => {
        const el = form.elements[k];
        const ok = rules[k](el.value);
        el.closest('.field').classList.toggle('invalid', !ok);
        if (!ok && !first) first = el;
      });
      if (first) { first.focus(); return; }
      form.reset();
      toast('Thanks! Your message is ready to send once the site has a server.');
    });
  }

  /* ---------- boot ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    initChrome();
    const page = document.body.dataset.page;
    if (page === 'home') initHome();
    if (page === 'browse') initBrowse();
    if (page === 'report') initReport();
    if (page === 'help') initHelp();
    observeReveals();
  });
})();
