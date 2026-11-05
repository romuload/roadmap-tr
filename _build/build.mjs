// Gera index.html e reforma.html a partir de data.json. Rode: node build.mjs (dentro de _build).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const products = JSON.parse(readFileSync(join(here, 'data.json'), 'utf8'));
const QS = ['Q1', 'Q2', 'Q3', 'Q4'];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const icon = (name, cls = 'ic') => readFileSync(join(root, 'assets/icons', `bento-icon-${name}.svg`), 'utf8')
  .replace(/<!--[\s\S]*?-->/, '').replace(/<title>.*?<\/title>/, '').replace(/\s+/g, ' ').trim()
  .replace(/<svg [^>]*viewBox="0 0 32 32">/, `<svg class="${cls}" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" focusable="false">`);

const head = (title, description) => `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="noindex">
<link rel="preload" href="assets/fonts/knowledge2017-bold-webfont.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/roadmap.css">
<script>document.documentElement.classList.add('js')</script>
</head>`;

/* ---------- Dados derivados ---------- */
const all = [];
products.forEach((p) => QS.forEach((q) => p.quarters[q].forEach((it, i) => {
  it.id = `${p.id}--${q}--${i}`; it.q = q; it.product = p; all.push(it);
})));
const shortName = (n) => n.replace('Interfaces - ONESOURCE DFE', 'Interfaces DFE').replace(/^ONESOURCE /, '').replace('Indirect Tax Determination - IDT', 'IDT').replace('For SAP', 'for SAP');
const tally = (list) => [['entregue', 'entregue', 'entregues'], ['previsto', 'previsto', 'previstos'], ['sem', 'sem status', 'sem status']].map(([k, o, m]) => [count(list, k), o, m]).filter((x) => x[0]).map(([n, o, m]) => plural(n, o, m)).join(', ');
const count = (list, s) => list.filter((x) => x.status === s).length;
const statusLabel = (it) => (it.status === 'entregue' ? `Entregue em ${it.when}` : it.status === 'previsto' ? `Previsto para ${it.when}` : 'Sem status');
const qItems = (q) => all.filter((x) => x.q === q);
const themes = ['CBS', 'IBS', 'NFS-e', 'DeRE', 'CNPJ alfanumérico', 'IA'];
const themeCount = (t) => all.filter((x) => x.themes.includes(t)).length;
const find = (pid, q, part) => {
  const it = products.find((p) => p.id === pid).quarters[q].find((x) => x.title.includes(part));
  if (!it) throw new Error(`Destaque não encontrado: ${pid} ${q} ${part}`);
  return it;
};

/* ---------- Home ---------- */
const tile = (label, on) => (on
  ? `<a class="tile tile-on" href="reforma.html">${icon('newtab', 'ic tile-ic')}<span>${label}</span></a>`
  : `<div class="tile tile-off"><span>${label}</span></div>`);

const home = `${head('Roadmap 2026 | Thomson Reuters', 'Roadmap 2026 de produtos Thomson Reuters. Comece pela Reforma Tributária.')}
<body class="home">
<header class="bar"><img class="logo" src="assets/img/logo-tr.png" alt="Thomson Reuters"><span class="bar-note">Proposta conceitual</span></header>
<main class="home-main">
  <div class="home-photo"><img src="assets/img/lobby.jpg" alt="Saguão corporativo com pessoas em movimento" width="1920" height="1080"></div>
  <div class="home-copy">
    <h1 class="mask"><span><span>Roadmap 2026</span></span></h1>
    <p class="home-sub">Comece pela Reforma Tributária: ${all.length} itens em ${products.length} frentes ONESOURCE, organizados por trimestre.</p>
  </div>
  <nav class="tiles" aria-label="Frentes do roadmap">
    ${tile('Tax', false)}
    ${tile('GTM', false)}
    ${tile('Legal', false)}
    ${tile('Reforma Tributária', true)}
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
  <a class="rh-logo" href="index.html" aria-label="Thomson Reuters, voltar à home"><img class="logo" src="assets/img/logo-tr.png" alt=""></a>
  <nav class="rh-tab" aria-label="Seções da página">
    <a href="#ano">O ano</a><a href="#mapa">Mapa</a><a href="#produtos">Produtos</a>
  </nav>
  <div class="rh-end">
    <a class="rh-back" href="index.html">${icon('arrow-left')}Roadmap 2026</a>
  </div>
</header>
<section class="masthead" aria-label="Os quatro trimestres de 2026">
  ${qTile('Q1', 'mt-green mt-tall')}
  ${photo('modernbuilding', 'Fachada de vidro e aço vista de baixo', 'mp-wide')}
  ${qTile('Q2', 'mt-peach')}
  ${photo('structure', 'Estrutura metálica circular vista de baixo contra o céu', 'mp-wide')}
  ${qTile('Q3', 'mt-orange')}
  ${photo('escalator', 'Escadas rolantes em perspectiva', 'mp-wide')}
  ${qTile('Q4', 'mt-gray')}
  ${photo('steelrods', 'Tubos de aço empilhados com uma calculadora ao centro', 'mp-one')}
</section>
<section class="title-row axis">
  <div class="title-side">
    <p class="standfirst">Tudo o que muda nos produtos ONESOURCE em 2026, trimestre a trimestre.</p>
    <a class="btn" href="#ano">Ver o ano ${icon('arrow-down')}</a>
  </div>
  <h1 class="mask title"><span><span>Reforma</span></span><span><span>Tributária 2026</span></span></h1>
</section>`;

/* ---------- Reforma: introdução ---------- */
const intro = `
<section class="intro" aria-labelledby="intro-t">
  <h2 class="sr" id="intro-t">Sobre este roadmap</h2>
  <p class="lead" data-reveal>Central de atualizações do Roadmap dos produtos ONESOURCE para a Reforma Tributária: ${all.length} itens em ${products.length} frentes.</p>
  <div class="intro-cols">
    <p data-reveal><b>Importante.</b> A ampliação da cobertura tributária ao longo de 2026 dependerá da disponibilização oficial das APIs pelo Fisco. O roadmap poderá ser ajustado conforme evolução regulatória.</p>
    <p data-reveal><b>Situação.</b> ${count(all, 'entregue')} itens constam como entregues, ${count(all, 'previsto')} têm previsão de entrega e ${count(all, 'sem')} não informam status na fonte.</p>
    <p data-reveal><b>Temas.</b> CBS aparece em ${themeCount('CBS')} itens, IBS em ${themeCount('IBS')}, NFS-e em ${themeCount('NFS-e')}, DeRE em ${themeCount('DeRE')}, CNPJ alfanumérico em ${themeCount('CNPJ alfanumérico')} e inteligência artificial em ${themeCount('IA')}.</p>
    <p data-reveal><b>Cobertura.</b> ${products.map((p) => esc(shortName(p.name))).join(', ')}.</p>
  </div>
</section>`;

/* ---------- Reforma: cena dos trimestres ---------- */
const chapters = [
  { q: 'Q1', cls: 'qp-peach', h: 'Os primeiros betas da CBS', picks: [['onesource-tax-one', 'Beta Apuração'], ['onesource-tax-one-for-sap', 'Estruturação do processo de Conciliação'], ['onesource-dfe-plus', 'DC-e']] },
  { q: 'Q2', cls: 'qp-gray', h: 'NFS-e Nacional e CNPJ alfanumérico', picks: [['onesource-dfe', 'Implementação do Receptor NFS-e'], ['onesource-dfe-governance', 'Evolução para o CNPJ Alfanumérico'], ['onesource-dfe-plus', 'NFGás']] },
  { q: 'Q3', cls: 'qp-green', h: 'DeRE em fases e conciliação com IA', picks: [['onesource-tax-one-for-sap', 'DeRE – Fase 2'], ['onesource-tax-one-for-sap', 'Conciliação Assistida'], ['onesource-indirect-tax-determination-idt', 'Inclusão de novos Cclasstribs']] },
  { q: 'Q4', cls: 'qp-orange', h: 'IBS no módulo e conexão com o Fisco', picks: [['onesource-tax-one', 'Habilitação do imposto IBS'], ['onesource-tax-one', 'Apuração de Consumo CBS - FISCO'], ['onesource-dfe-plus', 'Split Payment']] },
];
const ruler = (active) => `<div class="ruler" aria-hidden="true">${QS.map((q) => `<span style="flex:${qItems(q).length}" class="${q === active ? 'on' : ''}"></span>`).join('')}</div>`;
const scene = `
<section class="year" id="ano" aria-label="O ano em quatro trimestres">
${chapters.map((c) => {
    const list = qItems(c.q);
    return `  <article class="qp ${c.cls}" id="${c.q.toLowerCase()}">
    <div class="qp-side">
      <p class="qp-q" data-reveal aria-hidden="true">${c.q}</p>
      <p class="qp-n" data-reveal><strong>${list.length} itens</strong><br>${tally(list)}</p>
    </div>
    <div class="qp-main">
      <h2 data-reveal><span class="sr">${c.q}: </span>${esc(c.h)}</h2>
      <ul class="qp-list">
${c.picks.map(([pid, part]) => { const it = find(pid, c.q, part); return `        <li data-reveal><a href="#${it.id}"><span class="qp-t">${esc(it.title)}</span><span class="qp-m">${esc(shortName(it.product.name))}. ${esc(statusLabel(it))}</span></a></li>`; }).join('\n')}
      </ul>
    </div>
    ${ruler(c.q)}
  </article>`;
  }).join('\n')}
</section>`;

/* ---------- Reforma: mapa ---------- */
const heat = (n) => (n === 0 ? 'h0' : n < 3 ? 'h1' : n < 6 ? 'h2' : n < 9 ? 'h3' : 'h4');
const map = `
<section class="map axis" id="mapa" aria-labelledby="mapa-t">
  <div class="map-side">
    <h2 id="mapa-t" data-reveal>Onde cada produto concentra o ano</h2>
    <p data-reveal>Tax One acumula 13 itens no Q4, DFE tem 9 no Q2 e IDT tem 6 no Q3. Cada número leva à lista daquele produto e trimestre.</p>
  </div>
  <div class="map-body" data-reveal>
    <table class="map-t">
      <caption class="sr">Quantidade de itens por produto e trimestre</caption>
      <thead><tr><th scope="col" class="sr">Produto</th>${QS.map((q) => `<th scope="col">${q}</th>`).join('')}</tr></thead>
      <tbody>
${products.map((p) => `        <tr><th scope="row"><a href="#${p.id}">${esc(shortName(p.name))}</a></th>${QS.map((q) => { const n = p.quarters[q].length; return n ? `<td><a class="cell ${heat(n)}" href="#${p.id}--${q}" aria-label="${esc(shortName(p.name))}, ${q}: ${plural(n, 'item', 'itens')}">${n}</a></td>` : '<td><span class="cell h0" aria-label="Sem itens"></span></td>'; }).join('')}</tr>`).join('\n')}
      </tbody>
    </table>
  </div>
</section>`;

/* ---------- Reforma: produtos ---------- */
const lines = (body) => {
  const out = [];
  let ul = [];
  const flush = () => { if (ul.length) { out.push(`<ul>${ul.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`); ul = []; } };
  body.forEach((b) => {
    const m = b.match(/^[-·]\s*(.*)$/);
    if (m) ul.push(m[1]);
    else { flush(); out.push(`<p${/^(previs[ãa]o de entrega|entregue em)/i.test(b) ? ' class="when"' : ''}>${esc(b)}</p>`); }
  });
  flush();
  return out.join('');
};
const itemRow = (it) => {
  const detail = it.lead || it.body.length;
  const attrs = `id="${it.id}" class="band" data-status="${it.status}" data-themes="${esc(it.themes.join('|'))}"`;
  const headline = `<span class="band-t">${esc(it.title)}</span><span class="st st-${it.status}">${esc(statusLabel(it))}</span>`;
  if (!detail) return `<div ${attrs}><div class="band-h">${headline}</div></div>`;
  return `<details ${attrs}><summary class="band-h">${headline}${icon('chevron-down', 'ic band-ic')}</summary><div class="band-d">${it.lead ? `<p>${esc(it.lead)}</p>` : ''}${lines(it.body)}</div></details>`;
};
const chapter = (p) => {
  const list = QS.flatMap((q) => p.quarters[q]);
  const firstActive = [...QS].reverse().find((q) => p.quarters[q].length);
  return `  <article class="ch axis" id="${p.id}" data-product>
    <div class="ch-side">
      <h3 data-reveal>${esc(p.name.replace('For SAP', 'for SAP'))}</h3>
      <p class="ch-n" data-count data-reveal>${plural(list.length, 'item', 'itens')}: ${tally(list)}</p>
      ${p.note ? `<p class="ch-note" data-reveal>${esc(p.note)}</p>` : ''}
      <div class="tabs" role="tablist" aria-label="Trimestres de ${esc(shortName(p.name))}" data-reveal>
${QS.map((q) => `        <button type="button" role="tab" id="tab-${p.id}--${q}" class="tab" data-q="${q}" aria-controls="${p.id}--${q}" aria-selected="${q === firstActive}"${p.quarters[q].length ? '' : ' disabled'}><span>${q}</span><small data-tabn>${p.quarters[q].length}</small></button>`).join('\n')}
      </div>
    </div>
    <div class="ch-main">
${QS.filter((q) => p.quarters[q].length).map((q) => `      <section class="q-panel${q === firstActive ? ' active' : ''}" id="${p.id}--${q}" role="tabpanel" aria-labelledby="tab-${p.id}--${q}" data-q="${q}">
        <h4 class="q-h">${q} de 2026</h4>
${p.quarters[q].map(itemRow).join('\n')}
      </section>`).join('\n')}
    </div>
  </article>`;
};
const chip = (attr, val, label, n) => `<button type="button" class="chip" ${attr}="${esc(val)}" aria-pressed="false">${esc(label)} <small>${n}</small></button>`;
const productsSection = `
<section class="prods" id="produtos" aria-labelledby="prods-t">
  <div class="prods-head axis">
    <h2 id="prods-t" data-reveal>Todos os itens, produto a produto</h2>
    <p data-reveal>Abra um item para ver os subitens. Use os filtros para seguir um tema por todos os produtos.</p>
  </div>
  <div class="filters" aria-label="Filtros">
    <div class="chips" role="group" aria-label="Tema">${themes.map((t) => chip('data-theme', t, t === 'IA' ? 'Inteligência artificial' : t, themeCount(t))).join('')}</div>
    <div class="chips" role="group" aria-label="Situação">${chip('data-status', 'entregue', 'Entregue', count(all, 'entregue'))}${chip('data-status', 'previsto', 'Previsto', count(all, 'previsto'))}${chip('data-status', 'sem', 'Sem status', count(all, 'sem'))}</div>
    <p class="f-result" role="status" aria-live="polite"><span data-result>${all.length} itens em ${products.length} frentes</span><button type="button" class="f-clear" data-clear hidden>${icon('close-x')}Limpar filtros</button></p>
  </div>
  <div class="chs">
${products.map(chapter).join('\n')}
  </div>
  <p class="empty" data-empty hidden>Nenhum item combina esse tema com essa situação.</p>
</section>`;

/* ---------- Rodapé ---------- */
const footer = `
<footer class="foot">
  <div class="foot-top">
    <p><img class="logo" src="assets/img/logo-tr.png" alt="Thomson Reuters"></p>
    <p>O roadmap poderá ser ajustado conforme evolução regulatória e a disponibilização das APIs pelo Fisco.</p>
    <a href="#inicio" class="foot-up">Voltar ao topo ${icon('arrow-up')}</a>
  </div>
  <a class="foot-big" href="https://www.thomsonreuters.com.br/pt.html">thomsonreuters.com.br</a>
  <div class="foot-meta">
    <a href="index.html">Roadmap 2026</a>
    <span>Fotos: banco de imagens ONESOURCE. Saguão: roadmap atual.</span>
    <span>Proposta conceitual de Romulo Nascimento, 2026. Não é um site oficial da Thomson Reuters.</span>
  </div>
</footer>`;

const reforma = `${head('Reforma Tributária 2026 | Roadmap Thomson Reuters', `Roadmap 2026 da Reforma Tributária nos produtos ONESOURCE: ${all.length} itens em ${products.length} frentes, por trimestre.`)}
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

writeFileSync(join(root, 'index.html'), home);
writeFileSync(join(root, 'reforma.html'), reforma);
console.log('ok', all.length, 'itens');
