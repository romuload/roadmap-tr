(() => {
  /* Entrada das partes de cada seção, com atraso em cascata dentro do mesmo grupo */
  const reveal = [...document.querySelectorAll('[data-reveal]')];
  const groups = new Map();
  reveal.forEach((el) => {
    const parent = el.closest('section, article, footer') || document.body;
    const n = groups.get(parent) || 0;
    el.style.setProperty('--d', `${Math.min(n, 5) * 80}ms`);
    groups.set(parent, n + 1);
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px' });
    reveal.forEach((el) => io.observe(el));
  } else {
    reveal.forEach((el) => el.classList.add('in'));
  }

  /* Painel de trimestre totalmente coberto pelo seguinte sai da leitura e do foco */
  const panels = [...document.querySelectorAll('.qp')];
  if (panels.length) {
    let queued = false;
    const sync = () => {
      queued = false;
      panels.forEach((p, i) => {
        const next = panels[i + 1];
        const stuck = getComputedStyle(p).position === 'sticky';
        p.style.visibility = stuck && next && next.getBoundingClientRect().top <= 0 ? 'hidden' : '';
      });
    };
    const ask = () => { if (!queued) { queued = true; requestAnimationFrame(sync); } };
    addEventListener('scroll', ask, { passive: true });
    addEventListener('resize', ask);
    sync();
  }

  const chapters = [...document.querySelectorAll('[data-product]')];
  if (!chapters.length) return;

  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  /* A altura da barra de filtros define onde a coluna do produto gruda */
  const bar = document.querySelector('.filters');
  const measure = () => document.documentElement.style.setProperty('--fh', `${getComputedStyle(bar).position === 'sticky' ? bar.offsetHeight : 0}px`);
  measure();
  addEventListener('resize', measure);

  /* Abas de trimestre */
  function selectTab(chapter, q) {
    chapter.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.q === q)));
    chapter.querySelectorAll('.q-panel').forEach((p) => p.classList.toggle('active', p.dataset.q === q));
  }
  chapters.forEach((ch) => {
    const tabs = [...ch.querySelectorAll('.tab')];
    tabs.forEach((t) => {
      t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
      t.addEventListener('click', () => { selectTab(ch, t.dataset.q); tabs.forEach((x) => { x.tabIndex = x === t ? 0 : -1; }); });
      t.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const on = tabs.filter((x) => !x.disabled);
        const i = on.indexOf(t);
        const next = on[(i + (e.key === 'ArrowRight' ? 1 : on.length - 1)) % on.length];
        next.click(); next.focus();
      });
    });
  });

  /* Filtros: tema e situação se cruzam em todos os produtos */
  const result = document.querySelector('[data-result]');
  const clear = document.querySelector('[data-clear]');
  const empty = document.querySelector('[data-empty]');
  const themeChips = [...document.querySelectorAll('.chip[data-theme]')];
  const statusChips = [...document.querySelectorAll('.chip[data-status]')];
  const LABELS = [['entregue', 'entregue', 'entregues'], ['previsto', 'previsto', 'previstos'], ['sem', 'sem status', 'sem status']];

  function apply() {
    const themes = themeChips.filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.dataset.theme);
    const stats = statusChips.filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.dataset.status);
    let total = 0;
    let visibleChapters = 0;
    chapters.forEach((ch) => {
      const tally = { entregue: 0, previsto: 0, sem: 0 };
      let n = 0;
      ch.querySelectorAll('.q-panel').forEach((panel) => {
        let inPanel = 0;
        panel.querySelectorAll('.band').forEach((b) => {
          const its = b.dataset.themes.split('|');
          const show = (!themes.length || themes.some((t) => its.includes(t))) && (!stats.length || stats.includes(b.dataset.status));
          b.hidden = !show;
          if (show) { inPanel++; tally[b.dataset.status]++; }
        });
        n += inPanel;
        const tab = ch.querySelector(`.tab[data-q="${panel.dataset.q}"]`);
        tab.querySelector('[data-tabn]').textContent = inPanel;
        tab.disabled = inPanel === 0;
      });
      ch.hidden = n === 0;
      total += n;
      if (n) visibleChapters++;
      ch.querySelector('[data-count]').textContent = `${plural(n, 'item', 'itens')}: ${LABELS.filter(([k]) => tally[k]).map(([k, o, m]) => plural(tally[k], o, m)).join(', ')}`;
      const selected = ch.querySelector('.tab[aria-selected="true"]');
      if (n && (!selected || selected.disabled)) {
        const fallback = [...ch.querySelectorAll('.tab:not(:disabled)')].pop();
        if (fallback) selectTab(ch, fallback.dataset.q);
      }
      ch.querySelectorAll('.tab').forEach((t) => { t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1; });
    });
    result.textContent = `${plural(total, 'item', 'itens')} em ${plural(visibleChapters, 'frente', 'frentes')}`;
    clear.hidden = !themes.length && !stats.length;
    empty.hidden = total !== 0;
  }

  [...themeChips, ...statusChips].forEach((c) => c.addEventListener('click', () => {
    c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true'));
    apply();
  }));
  clear.addEventListener('click', () => {
    [...themeChips, ...statusChips].forEach((c) => c.setAttribute('aria-pressed', 'false'));
    apply();
  });

  /* Links internos: abrem a aba certa e o item antes de rolar até ele */
  function go(hash, smooth) {
    if (!hash || hash.length < 2) return;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    const ch = target.closest('[data-product]');
    if (!ch) return;
    if (target.matches('.band, .q-panel')) {
      [...themeChips, ...statusChips].forEach((c) => c.setAttribute('aria-pressed', 'false'));
      apply();
      selectTab(ch, target.closest('.q-panel').dataset.q);
      apply();
      if (target.tagName === 'DETAILS') target.open = true;
    }
    target.scrollIntoView({ behavior: smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto', block: 'start' });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const el = document.getElementById(id.slice(1));
    if (el && el.closest('[data-product]')) {
      e.preventDefault();
      history.pushState(null, '', id);
      go(id, true);
    }
  });
  window.addEventListener('hashchange', () => go(location.hash, false));
  if (location.hash) go(location.hash, false);
})();
