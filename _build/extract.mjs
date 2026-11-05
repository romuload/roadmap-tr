// Lê o HTML original do roadmap e gera data.json, preservando o texto na íntegra.
import { readFileSync, writeFileSync } from 'node:fs';

const [src, out] = process.argv.slice(2);
const html = readFileSync(src, 'utf8').replace(/<!--[\s\S]*?-->/g, '');

const decode = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const clean = (s) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

const STATUS = /(entregue em|previs[ãa]o de entrega:?)\s*\[?((?:[A-Z][a-z]{2}-)?[A-Z][a-z]{2}\/2026\*?)\]?/gi;
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function parseItem(raw) {
  const parts = raw.split(/<p[^>]*>/i);
  const head = parts[0];
  const bold = head.match(/<b>([\s\S]*?)<\/b>/i);
  let title = bold ? clean(bold[1]) : '';
  let lead = clean(bold ? head.replace(bold[0], '') : head);
  if (!title) { title = lead; lead = ''; }
  // Negrito no meio da frase ou frase que continua em minúscula: o título é a linha inteira.
  if (bold && (!/^\s*<b>/i.test(head) || /^[a-zà-ú]/.test(lead))) { title = clean(head); lead = ''; }
  title = title.replace(/\s*[-–]\s*$/, '');
  lead = lead.replace(/^[-–]\s*/, '');
  // Títulos sem negrito trazem a descrição colada: separa no primeiro " - " antes do verbo/substantivo que abre a frase.
  const split = title.match(/^(.+?)\s-\s((?:Suporta|Garante|Adequa|Aumenta|Amplia|Identificação|Expansão|Suporte|Adaptação|Atualização|Estruturação|Monitoramento|inclusão)\b.*)$/);
  if (split) { title = split[1]; lead = [split[2], lead].filter(Boolean).join(' '); }
  const body = parts.slice(1).map(clean).filter(Boolean);
  return { title, lead, body };
}

function statuses(text) {
  const found = [];
  for (const m of text.matchAll(STATUS)) {
    const kind = m[1].toLowerCase().startsWith('entregue') ? 'entregue' : 'previsto';
    const date = m[2];
    found.push({ kind, date });
  }
  return found;
}

function monthsLabel(found) {
  const idx = [...new Set(found.flatMap((f) => f.date.replace('/2026', '').replace('*', '').split('-'))
    .map((m) => MONTHS.indexOf(m)).filter((i) => i >= 0))].sort((a, b) => a - b);
  if (!idx.length) return '';
  const names = idx.map((i) => MONTHS[i].toLowerCase());
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} e ${names[1]}`;
  return `${names[0]} a ${names[names.length - 1]}`;
}

const THEMES = {
  CBS: /\bCBS\b/,
  IBS: /\bIBS\b/,
  DeRE: /\bDe?R[eE]\b|\bDERE\b/,
  'NFS-e': /NFS-?e/i,
  IA: /Intelig[êe]ncia Artificial|\bIA\b/,
  'CNPJ alfanumérico': /CNPJ/,
};

const sections = [...html.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>/gi)];
const products = [];
sections.forEach((s, i) => {
  const name = clean(s[1]);
  const chunk = html.slice(s.index, i + 1 < sections.length ? sections[i + 1].index : html.indexOf('</section>', s.index));
  const qsplit = chunk.split(/<div class="tituloQ">\s*Q([1-4])\/2026\s*<\/div>/i);
  const quarters = { Q1: [], Q2: [], Q3: [], Q4: [] };
  for (let k = 1; k < qsplit.length; k += 2) {
    const q = `Q${qsplit[k]}`;
    const items = qsplit[k + 1].split(/<div class="item">/i).slice(1);
    for (const it of items) {
      const inner = it.replace(/<\/div>[\s\S]*$/i, '');
      if (!clean(inner)) continue;
      const parsed = parseItem(inner);
      const full = [parsed.title, parsed.lead, ...parsed.body].join(' ');
      const st = statuses(full);
      const entregues = st.filter((x) => x.kind === 'entregue');
      const previstos = st.filter((x) => x.kind === 'previsto');
      const status = !st.length ? 'sem' : previstos.length ? 'previsto' : 'entregue';
      // Com uma única data, a linha de status vira só o rótulo. Com várias, fica no detalhe porque agrupa os subitens.
      if (st.length === 1) parsed.body = parsed.body.filter((b) => b.replace(STATUS, '').trim() !== '');
      if (st.length === 1) parsed.lead = parsed.lead.replace(STATUS, '').trim();
      quarters[q].push({
        ...parsed,
        status,
        when: monthsLabel(status === 'previsto' ? previstos : entregues),
        mixed: !!(entregues.length && previstos.length),
        themes: Object.entries(THEMES).filter(([, re]) => re.test(full)).map(([t]) => t),
      });
    }
  }
  // Notas soltas do produto, fora dos itens (ex.: "*O prazo está condicionado...").
  const note = (chunk.match(/\*O prazo[^<]*/) || [''])[0].replace(/\s+/g, ' ').trim();
  products.push({ name, note, id: name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), quarters });
});

writeFileSync(out, JSON.stringify(products, null, 1));
let tot = 0;
const qt = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
const st = { entregue: 0, previsto: 0, sem: 0 };
const th = {};
for (const p of products) {
  const c = Object.entries(p.quarters).map(([q, v]) => { qt[q] += v.length; tot += v.length; v.forEach((x) => { st[x.status]++; x.themes.forEach((t) => { th[t] = (th[t] || 0) + 1; }); }); return v.length; });
  console.log(p.name, c.join(' '));
}
console.log({ tot, qt, st, th });
for (const p of products) for (const q of Object.keys(p.quarters)) for (const it of p.quarters[q]) {
  if (it.title.length > 90) console.log('LONG', p.id, q, it.title.slice(0, 120));
}
