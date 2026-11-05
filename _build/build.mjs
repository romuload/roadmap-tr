// Gera as páginas em português e inglês a partir de data.json e en.json. Rode: node build.mjs (dentro de _build).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const products = JSON.parse(readFileSync(join(here, 'data.json'), 'utf8'));
const enText = JSON.parse(readFileSync(join(here, 'en.json'), 'utf8'));
const QS = ['Q1', 'Q2', 'Q3', 'Q4'];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const icon = (name, cls = 'ic') => readFileSync(join(root, 'assets/icons', `bento-icon-${name}.svg`), 'utf8')
  .replace(/<!--[\s\S]*?-->/, '').replace(/<title>.*?<\/title>/, '').replace(/\s+/g, ' ').trim()
  .replace(/<svg [^>]*viewBox="0 0 32 32">/, `<svg class="${cls}" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" focusable="false">`);

/* ---------- Dados derivados ---------- */
const all = [];
products.forEach((p) => QS.forEach((q) => p.quarters[q].forEach((it, i) => {
  it.id = `${p.id}--${q}--${i}`; it.q = q; it.product = p; all.push(it);
})));
const shortName = (n) => n.replace('Interfaces - ONESOURCE DFE', 'Interfaces DFE').replace(/^ONESOURCE /, '').replace('Indirect Tax Determination - IDT', 'IDT').replace('For SAP', 'for SAP');
const count = (list, s) => list.filter((x) => x.status === s).length;
const qItems = (q) => all.filter((x) => x.q === q);
const themes = ['CBS', 'IBS', 'NFS-e', 'DeRE', 'CNPJ alfanumérico', 'IA'];
const themeCount = (t) => all.filter((x) => x.themes.includes(t)).length;
const find = (pid, q, part) => {
  const it = products.find((p) => p.id === pid).quarters[q].find((x) => x.title.includes(part));
  if (!it) throw new Error(`Destaque não encontrado: ${pid} ${q} ${part}`);
  return it;
};
const heat = (n) => (n === 0 ? 'h0' : n < 3 ? 'h1' : n < 6 ? 'h2' : n < 9 ? 'h3' : 'h4');
const ruler = (active) => `<div class="ruler" aria-hidden="true">${QS.map((q) => `<span style="flex:${qItems(q).length}" class="${q === active ? 'on' : ''}"></span>`).join('')}</div>`;

/* ---------- Tradução do conteúdo ---------- */
const MONTHS = { jan: 'Jan', fev: 'Feb', mar: 'Mar', abr: 'Apr', mai: 'May', jun: 'Jun', jul: 'Jul', ago: 'Aug', set: 'Sep', out: 'Oct', nov: 'Nov', dez: 'Dec' };
const STATUS = /(entregue em|previs[ãa]o de entrega:?)\s*\[?((?:[A-Z][a-z]{2}-)?[A-Z][a-z]{2}\/2026\*?)\]?/gi;
const monthEn = (m) => { const r = MONTHS[m.toLowerCase()]; if (!r) throw new Error(`Mês desconhecido: ${m}`); return r; };
const statusEn = (s) => s.replace(STATUS, (_, kind, date) => `${kind.toLowerCase().startsWith('entregue') ? 'Delivered in' : 'Planned delivery:'} ${date.replace(/[A-Z][a-z]{2}/g, monthEn)}`);

const LANGS = {
  pt: {
    code: 'pt-BR', home: 'index.html', reforma: 'reforma.html', other: 'en',
    text: (s) => s,
    when: (w) => w,
    statusLabel: (it) => (it.status === 'entregue' ? `Entregue em ${it.when}` : it.status === 'previsto' ? `Previsto para ${it.when}` : 'Sem status'),
    plural: (n, one, many) => `${n} ${n === 1 ? one : many}`,
    item: ['item', 'itens'], front: ['frente', 'frentes'],
    tallyWords: [['entregue', 'entregue', 'entregues'], ['previsto', 'previsto', 'previstos'], ['sem', 'sem status', 'sem status']],
    theme: { IA: 'Inteligência artificial' },
    langLabel: 'Idioma',
    homeTitle: 'Roadmap 2026 | Thomson Reuters',
    homeDesc: 'Roadmap 2026 de produtos Thomson Reuters. Comece pela Reforma Tributária.',
    note: 'Proposta conceitual',
    lobbyAlt: 'Saguão corporativo com pessoas em movimento',
    homeSub: (a, b) => `Comece pela Reforma Tributária: ${a} itens em ${b} frentes ONESOURCE, organizados por trimestre.`,
    tilesLabel: 'Frentes do roadmap',
    tile: 'Reforma Tributária',
    logoBack: 'Thomson Reuters, voltar à home',
    sections: 'Seções da página',
    navYear: 'O ano', navMap: 'Mapa', navProducts: 'Produtos',
    masthead: 'Os quatro trimestres de 2026',
    alts: ['Fachada de vidro e aço vista de baixo', 'Estrutura metálica circular vista de baixo contra o céu', 'Escadas rolantes em perspectiva', 'Tubos de aço empilhados com uma calculadora ao centro'],
    standfirst: 'Tudo o que muda nos produtos ONESOURCE em 2026, trimestre a trimestre.',
    seeYear: 'Ver o ano',
    titleLines: ['Reforma', 'Tributária 2026'],
    aboutH: 'Sobre este roadmap',
    lead: (a, b) => `Central de atualizações do Roadmap dos produtos ONESOURCE para a Reforma Tributária: ${a} itens em ${b} frentes.`,
    important: '<b>Importante.</b> A ampliação da cobertura tributária ao longo de 2026 dependerá da disponibilização oficial das APIs pelo Fisco. O roadmap poderá ser ajustado conforme evolução regulatória.',
    situation: (e, p, s) => `<b>Situação.</b> ${e} itens constam como entregues, ${p} têm previsão de entrega e ${s} não informam status na fonte.`,
    themesLine: (c) => `<b>Temas.</b> CBS aparece em ${c('CBS')} itens, IBS em ${c('IBS')}, NFS-e em ${c('NFS-e')}, DeRE em ${c('DeRE')}, CNPJ alfanumérico em ${c('CNPJ alfanumérico')} e inteligência artificial em ${c('IA')}.`,
    coverage: 'Cobertura.',
    yearLabel: 'O ano em quatro trimestres',
    chapterH: { Q1: 'Os primeiros betas da CBS', Q2: 'NFS-e Nacional e CNPJ alfanumérico', Q3: 'DeRE em fases e conciliação com IA', Q4: 'IBS no módulo e conexão com o Fisco' },
    mapH: 'Onde cada produto concentra o ano',
    mapP: 'Tax One acumula 13 itens no Q4, DFE tem 9 no Q2 e IDT tem 6 no Q3. Cada número leva à lista daquele produto e trimestre.',
    mapCaption: 'Quantidade de itens por produto e trimestre',
    productCol: 'Produto',
    noItems: 'Sem itens',
    tabsLabel: (n) => `Trimestres de ${n}`,
    qLabel: (q) => `${q} de 2026`,
    prodsH: 'Todos os itens, produto a produto',
    prodsP: 'Abra um item para ver os subitens. Use os filtros para seguir um tema por todos os produtos.',
    filters: 'Filtros', themeGroup: 'Tema', statusGroup: 'Situação',
    chipEntregue: 'Entregue', chipPrevisto: 'Previsto', chipSem: 'Sem status',
    clear: 'Limpar filtros',
    empty: 'Nenhum item combina esse tema com essa situação.',
    footNote: 'O roadmap poderá ser ajustado conforme evolução regulatória e a disponibilização das APIs pelo Fisco.',
    top: 'Voltar ao topo',
    credits: 'Fotos: banco de imagens ONESOURCE. Saguão: roadmap atual.',
    official: 'Proposta conceitual de Romulo Nascimento, 2026. Não é um site oficial da Thomson Reuters.',
    reformaTitle: 'Reforma Tributária 2026 | Roadmap Thomson Reuters',
    reformaDesc: (a, b) => `Roadmap 2026 da Reforma Tributária nos produtos ONESOURCE: ${a} itens em ${b} frentes, por trimestre.`,
  },
  en: {
    code: 'en', home: 'index-en.html', reforma: 'reforma-en.html', other: 'pt',
    text: (s) => {
      if (enText[s]) return enText[s];
      const t = statusEn(s);
      if (t !== s && !t.replace(/(Delivered in|Planned delivery:)\s*\S+/g, '').trim()) return t;
      throw new Error(`Sem tradução: ${s}`);
    },
    when: (w) => w.split(/ (e|a) /).map((x) => (x === 'e' ? 'and' : x === 'a' ? 'to' : monthEn(x))).join(' '),
    statusLabel(it) { return it.status === 'entregue' ? `Delivered in ${this.when(it.when)}` : it.status === 'previsto' ? `Planned for ${this.when(it.when)}` : 'No status'; },
    plural: (n, one, many) => `${n} ${n === 1 ? one : many}`,
    item: ['item', 'items'], front: ['product line', 'product lines'],
    tallyWords: [['entregue', 'delivered', 'delivered'], ['previsto', 'planned', 'planned'], ['sem', 'no status', 'no status']],
    theme: { IA: 'Artificial intelligence', 'CNPJ alfanumérico': 'Alphanumeric CNPJ' },
    langLabel: 'Language',
    homeTitle: 'Roadmap 2026 | Thomson Reuters',
    homeDesc: 'Thomson Reuters product roadmap 2026. Start with the Tax Reform.',
    note: 'Concept proposal',
    lobbyAlt: 'Corporate lobby with people in motion',
    homeSub: (a, b) => `Start with the Tax Reform: ${a} items across ${b} ONESOURCE product lines, organized by quarter.`,
    tilesLabel: 'Roadmap areas',
    tile: 'Tax Reform',
    logoBack: 'Thomson Reuters, back to home',
    sections: 'Page sections',
    navYear: 'The year', navMap: 'Map', navProducts: 'Products',
    masthead: 'The four quarters of 2026',
    alts: ['Glass and steel facade seen from below', 'Circular metal structure seen from below against the sky', 'Escalators in perspective', 'Stacked steel tubes with a calculator in the center'],
    standfirst: 'Everything that changes in ONESOURCE products in 2026, quarter by quarter.',
    seeYear: 'See the year',
    titleLines: ['Tax Reform', '2026'],
    aboutH: 'About this roadmap',
    lead: (a, b) => `Roadmap updates hub for ONESOURCE products for the Tax Reform: ${a} items across ${b} product lines.`,
    important: '<b>Important.</b> The expansion of tax coverage throughout 2026 will depend on the official availability of APIs from the Tax Authorities. The roadmap may be adjusted according to regulatory developments.',
    situation: (e, p, s) => `<b>Status.</b> ${e} items are listed as delivered, ${p} have a planned delivery date and ${s} show no status in the source.`,
    themesLine: (c) => `<b>Themes.</b> CBS appears in ${c('CBS')} items, IBS in ${c('IBS')}, NFS-e in ${c('NFS-e')}, DeRE in ${c('DeRE')}, alphanumeric CNPJ in ${c('CNPJ alfanumérico')} and artificial intelligence in ${c('IA')}.`,
    coverage: 'Coverage.',
    yearLabel: 'The year in four quarters',
    chapterH: { Q1: 'The first CBS betas', Q2: 'National NFS-e and alphanumeric CNPJ', Q3: 'DeRE in phases and AI reconciliation', Q4: 'IBS in the module and the Tax Authority connection' },
    mapH: 'Where each product focuses its year',
    mapP: 'Tax One has 13 items in Q4, DFE has 9 in Q2 and IDT has 6 in Q3. Each number links to the list for that product and quarter.',
    mapCaption: 'Number of items by product and quarter',
    productCol: 'Product',
    noItems: 'No items',
    tabsLabel: (n) => `Quarters for ${n}`,
    qLabel: (q) => `${q} 2026`,
    prodsH: 'All items, product by product',
    prodsP: 'Open an item to see its sub-items. Use the filters to follow a theme across all products.',
    filters: 'Filters', themeGroup: 'Theme', statusGroup: 'Status',
    chipEntregue: 'Delivered', chipPrevisto: 'Planned', chipSem: 'No status',
    clear: 'Clear filters',
    empty: 'No item matches this theme and status.',
    footNote: 'The roadmap may be adjusted according to regulatory developments and the availability of APIs from the Tax Authorities.',
    top: 'Back to top',
    credits: 'Photos: ONESOURCE image library. Lobby: current roadmap. English text based on the current English roadmap, with additional items translated for this proposal.',
    official: 'Concept proposal by Romulo Nascimento, 2026. Not an official Thomson Reuters website.',
    reformaTitle: 'Tax Reform 2026 | Thomson Reuters Roadmap',
    reformaDesc: (a, b) => `2026 Tax Reform roadmap for ONESOURCE products: ${a} items across ${b} product lines, by quarter.`,
  },
};

function render(lang) {
  const L = LANGS[lang];
  const O = LANGS[L.other];
  const t = (s) => esc(L.text(s));
  const items = (n) => L.plural(n, ...L.item);
  const fronts = (n) => L.plural(n, ...L.front);
  const tally = (list) => L.tallyWords.map(([k, o, m]) => [count(list, k), o, m]).filter((x) => x[0]).map(([n, o, m]) => L.plural(n, o, m)).join(', ');
  const themeName = (x) => L.theme[x] || x;

  const head = (title, description, page) => `<!doctype html>
<html lang="${L.code}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="noindex">
<link rel="alternate" hreflang="${O.code}" href="${O[page]}">
<link rel="preload" href="assets/fonts/knowledge2017-bold-webfont.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/roadmap.css">
<script>document.documentElement.classList.add('js')</script>
</head>`;

  /* Seletor de idioma: dois links, o atual marcado */
  const switcher = (page) => `<nav class="lang" aria-label="${L.langLabel}"><a ${lang === 'pt' ? 'aria-current="true" ' : ''}href="${LANGS.pt[page]}" hreflang="pt-BR" lang="pt-BR" aria-label="Português" data-lang-link>PT</a><a ${lang === 'en' ? 'aria-current="true" ' : ''}href="${LANGS.en[page]}" hreflang="en" lang="en" aria-label="English" data-lang-link>EN</a></nav>`;

  /* ---------- Home ---------- */
  const tile = (label, on) => (on
    ? `<a class="tile tile-on" href="${L.reforma}">${icon('newtab', 'ic tile-ic')}<span>${label}</span></a>`
    : `<div class="tile tile-off"><span>${label}</span></div>`);

  const home = `${head(L.homeTitle, L.homeDesc, 'home')}
<body class="home">
<header class="bar"><img class="logo" src="assets/img/logo-tr.png" alt="Thomson Reuters"><div class="bar-end"><span class="bar-note">${L.note}</span>${switcher('home')}</div></header>
<main class="home-main">
  <div class="home-photo"><img src="assets/img/lobby.jpg" alt="${L.lobbyAlt}" width="1920" height="1080"></div>
  <div class="home-copy">
    <h1 class="mask"><span><span>Roadmap 2026</span></span></h1>
    <p class="home-sub">${L.homeSub(all.length, products.length)}</p>
  </div>
  <nav class="tiles" aria-label="${L.tilesLabel}">
    ${tile('Tax', false)}
    ${tile('GTM', false)}
    ${tile('Legal', false)}
    ${tile(L.tile, true)}
  </nav>
</main>
<script src="assets/roadmap.js" defer></script>
</body>
</html>
`;

  /* ---------- Reforma: abertura ---------- */
  const qTile = (q, cls, style = '') => `<a class="m-tile ${cls}" href="#${q.toLowerCase()}"${style}><span>${q}</span><strong>${qItems(q).length}</strong></a>`;
  const photo = (file, alt, cls) => `<div class="m-photo ${cls}"><img src="assets/img/${file}.jpg" alt="${alt}"></div>`;

  const hero = `
<header class="rh">
  <a class="rh-logo" href="${L.home}" aria-label="${L.logoBack}"><img class="logo" src="assets/img/logo-tr.png" alt=""></a>
  <nav class="rh-tab" aria-label="${L.sections}">
    <a href="#ano">${L.navYear}</a><a href="#mapa">${L.navMap}</a><a href="#produtos">${L.navProducts}</a>
  </nav>
  <div class="rh-end">
    <a class="rh-back" href="${L.home}">${icon('arrow-left')}Roadmap 2026</a>
    ${switcher('reforma')}
  </div>
</header>
<section class="masthead" aria-label="${L.masthead}">
  ${qTile('Q1', 'mt-green mt-tall')}
  ${photo('modernbuilding', L.alts[0], 'mp-wide')}
  ${qTile('Q2', 'mt-peach')}
  ${photo('structure', L.alts[1], 'mp-wide')}
  ${qTile('Q3', 'mt-orange')}
  ${photo('escalator', L.alts[2], 'mp-wide')}
  ${qTile('Q4', 'mt-gray')}
  ${photo('steelrods', L.alts[3], 'mp-one')}
</section>
<section class="title-row axis">
  <div class="title-side">
    <p class="standfirst">${L.standfirst}</p>
    <a class="btn" href="#ano">${L.seeYear} ${icon('arrow-down')}</a>
  </div>
  <h1 class="mask title"><span><span>${L.titleLines[0]}</span></span><span><span>${L.titleLines[1]}</span></span></h1>
</section>`;

  /* ---------- Reforma: introdução ---------- */
  const intro = `
<section class="intro" aria-labelledby="intro-t">
  <h2 class="sr" id="intro-t">${L.aboutH}</h2>
  <p class="lead" data-reveal>${L.lead(all.length, products.length)}</p>
  <div class="intro-cols">
    <p data-reveal>${L.important}</p>
    <p data-reveal>${L.situation(count(all, 'entregue'), count(all, 'previsto'), count(all, 'sem'))}</p>
    <p data-reveal>${L.themesLine(themeCount)}</p>
    <p data-reveal><b>${L.coverage}</b> ${products.map((p) => esc(shortName(p.name))).join(', ')}.</p>
  </div>
</section>`;

  /* ---------- Reforma: cena dos trimestres ---------- */
  const chapters = [
    { q: 'Q1', cls: 'qp-peach', picks: [['onesource-tax-one', 'Beta Apuração'], ['onesource-tax-one-for-sap', 'Estruturação do processo de Conciliação'], ['onesource-dfe-plus', 'DC-e']] },
    { q: 'Q2', cls: 'qp-gray', picks: [['onesource-dfe', 'Implementação do Receptor NFS-e'], ['onesource-dfe-governance', 'Evolução para o CNPJ Alfanumérico'], ['onesource-dfe-plus', 'NFGás']] },
    { q: 'Q3', cls: 'qp-green', picks: [['onesource-tax-one-for-sap', 'DeRE – Fase 2'], ['onesource-tax-one-for-sap', 'Conciliação Assistida'], ['onesource-indirect-tax-determination-idt', 'Inclusão de novos Cclasstribs']] },
    { q: 'Q4', cls: 'qp-orange', picks: [['onesource-tax-one', 'Habilitação do imposto IBS'], ['onesource-tax-one', 'Apuração de Consumo CBS - FISCO'], ['onesource-dfe-plus', 'Split Payment']] },
  ];
  const scene = `
<section class="year" id="ano" aria-label="${L.yearLabel}">
${chapters.map((c) => {
    const list = qItems(c.q);
    return `  <article class="qp ${c.cls}" id="${c.q.toLowerCase()}">
    <div class="qp-side">
      <p class="qp-q" data-reveal aria-hidden="true">${c.q}</p>
      <p class="qp-n" data-reveal><strong>${items(list.length)}</strong><br>${tally(list)}</p>
    </div>
    <div class="qp-main">
      <h2 data-reveal><span class="sr">${c.q}: </span>${esc(L.chapterH[c.q])}</h2>
      <ul class="qp-list">
${c.picks.map(([pid, part]) => { const it = find(pid, c.q, part); return `        <li data-reveal><a href="#${it.id}"><span class="qp-t">${t(it.title)}</span><span class="qp-m">${esc(shortName(it.product.name))}. ${esc(L.statusLabel(it))}</span></a></li>`; }).join('\n')}
      </ul>
    </div>
    ${ruler(c.q)}
  </article>`;
  }).join('\n')}
</section>`;

  /* ---------- Reforma: mapa ---------- */
  const map = `
<section class="map axis" id="mapa" aria-labelledby="mapa-t">
  <div class="map-side">
    <h2 id="mapa-t" data-reveal>${L.mapH}</h2>
    <p data-reveal>${L.mapP}</p>
  </div>
  <div class="map-body" data-reveal>
    <table class="map-t">
      <caption class="sr">${L.mapCaption}</caption>
      <thead><tr><th scope="col" class="sr">${L.productCol}</th>${QS.map((q) => `<th scope="col">${q}</th>`).join('')}</tr></thead>
      <tbody>
${products.map((p) => `        <tr><th scope="row"><a href="#${p.id}">${esc(shortName(p.name))}</a></th>${QS.map((q) => { const n = p.quarters[q].length; return n ? `<td><a class="cell ${heat(n)}" href="#${p.id}--${q}" aria-label="${esc(shortName(p.name))}, ${q}: ${items(n)}">${n}</a></td>` : `<td><span class="cell h0" aria-label="${L.noItems}"></span></td>`; }).join('')}</tr>`).join('\n')}
      </tbody>
    </table>
  </div>
</section>`;

  /* ---------- Reforma: produtos ---------- */
  const lines = (body) => {
    const out = [];
    let ul = [];
    const flush = () => { if (ul.length) { out.push(`<ul>${ul.map((l) => `<li>${t(l)}</li>`).join('')}</ul>`); ul = []; } };
    body.forEach((b) => {
      const m = b.match(/^[-·]\s*(.*)$/);
      if (m) ul.push(m[1]);
      else { flush(); out.push(`<p${/^(previs[ãa]o de entrega|entregue em)/i.test(b) ? ' class="when"' : ''}>${t(b)}</p>`); }
    });
    flush();
    return out.join('');
  };
  const itemRow = (it) => {
    const detail = it.lead || it.body.length;
    const attrs = `id="${it.id}" class="band" data-status="${it.status}" data-themes="${esc(it.themes.join('|'))}"`;
    const headline = `<span class="band-t">${t(it.title)}</span><span class="st st-${it.status}">${esc(L.statusLabel(it))}</span>`;
    if (!detail) return `<div ${attrs}><div class="band-h">${headline}</div></div>`;
    return `<details ${attrs}><summary class="band-h">${headline}${icon('chevron-down', 'ic band-ic')}</summary><div class="band-d">${it.lead ? `<p>${t(it.lead)}</p>` : ''}${lines(it.body)}</div></details>`;
  };
  const chapter = (p) => {
    const list = QS.flatMap((q) => p.quarters[q]);
    const firstActive = [...QS].reverse().find((q) => p.quarters[q].length);
    return `  <article class="ch axis" id="${p.id}" data-product>
    <div class="ch-side">
      <h3 data-reveal>${esc(p.name.replace('For SAP', 'for SAP'))}</h3>
      <p class="ch-n" data-count data-reveal>${items(list.length)}: ${tally(list)}</p>
      ${p.note ? `<p class="ch-note" data-reveal>${t(p.note)}</p>` : ''}
      <div class="tabs" role="tablist" aria-label="${esc(L.tabsLabel(shortName(p.name)))}" data-reveal>
${QS.map((q) => `        <button type="button" role="tab" id="tab-${p.id}--${q}" class="tab" data-q="${q}" aria-controls="${p.id}--${q}" aria-selected="${q === firstActive}"${p.quarters[q].length ? '' : ' disabled'}><span>${q}</span><small data-tabn>${p.quarters[q].length}</small></button>`).join('\n')}
      </div>
    </div>
    <div class="ch-main">
${QS.filter((q) => p.quarters[q].length).map((q) => `      <section class="q-panel${q === firstActive ? ' active' : ''}" id="${p.id}--${q}" role="tabpanel" aria-labelledby="tab-${p.id}--${q}" data-q="${q}">
        <h4 class="q-h">${L.qLabel(q)}</h4>
${p.quarters[q].map(itemRow).join('\n')}
      </section>`).join('\n')}
    </div>
  </article>`;
  };
  const chip = (attr, val, label, n) => `<button type="button" class="chip" ${attr}="${esc(val)}" aria-pressed="false">${esc(label)} <small>${n}</small></button>`;
  const productsSection = `
<section class="prods" id="produtos" aria-labelledby="prods-t">
  <div class="prods-head axis">
    <h2 id="prods-t" data-reveal>${L.prodsH}</h2>
    <p data-reveal>${L.prodsP}</p>
  </div>
  <div class="filters" aria-label="${L.filters}">
    <div class="chips" role="group" aria-label="${L.themeGroup}">${themes.map((x) => chip('data-theme', x, themeName(x), themeCount(x))).join('')}</div>
    <div class="chips" role="group" aria-label="${L.statusGroup}">${chip('data-status', 'entregue', L.chipEntregue, count(all, 'entregue'))}${chip('data-status', 'previsto', L.chipPrevisto, count(all, 'previsto'))}${chip('data-status', 'sem', L.chipSem, count(all, 'sem'))}</div>
    <p class="f-result" role="status" aria-live="polite"><span data-result>${items(all.length)} ${lang === 'pt' ? 'em' : 'across'} ${fronts(products.length)}</span><button type="button" class="f-clear" data-clear hidden>${icon('close-x')}${L.clear}</button></p>
  </div>
  <div class="chs">
${products.map(chapter).join('\n')}
  </div>
  <p class="empty" data-empty hidden>${L.empty}</p>
</section>`;

  /* ---------- Rodapé ---------- */
  const footer = `
<footer class="foot">
  <div class="foot-top">
    <p><img class="logo" src="assets/img/logo-tr.png" alt="Thomson Reuters"></p>
    <p>${L.footNote}</p>
    <a href="#inicio" class="foot-up">${L.top} ${icon('arrow-up')}</a>
  </div>
  <a class="foot-big" href="https://www.thomsonreuters.com.br/pt.html">thomsonreuters.com.br</a>
  <div class="foot-meta">
    <a href="${L.home}">Roadmap 2026</a>
    <span>${L.credits}</span>
    <span>${L.official}</span>
  </div>
</footer>`;

  const reforma = `${head(L.reformaTitle, L.reformaDesc(all.length, products.length), 'reforma')}
<body class="reforma" id="inicio">
<main>
${hero}
${intro}
${scene}
${map}
${productsSection}
</main>
${footer}
<script src="assets/roadmap.js" defer></script>
</body>
</html>
`;

  writeFileSync(join(root, L.home), home);
  writeFileSync(join(root, L.reforma), reforma);
}

render('pt');
render('en');
console.log('ok', all.length, 'itens em pt e en');
