/* Verifies EN/TH/MY have identical keys and no empty strings. (TypeScript also enforces key parity.) */
const fs = require('fs');
const path = require('path');

function load(locale) {
  const src = fs.readFileSync(path.join(__dirname, `../src/shared/i18n/locales/${locale}.ts`), 'utf8');
  const body = src.slice(src.indexOf('= {') + 2).replace(/\s+as const;\s*$/, '').replace(/;\s*$/, '');
  return Function(`return (${body});`)();
}

function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => (typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]));
}

const locales = ['en', 'th', 'my'];
const maps = Object.fromEntries(locales.map((l) => [l, new Map(flatten(load(l)))]));
let failed = false;
for (const l of locales) {
  for (const [key] of maps.en) {
    if (!maps[l].has(key)) { console.error(`[${l}] missing ${key}`); failed = true; }
    else if (String(maps[l].get(key)).trim() === '') { console.error(`[${l}] empty ${key}`); failed = true; }
  }
}
console.log(failed ? 'i18n check FAILED' : `i18n OK — ${maps.en.size} keys × ${locales.length} languages`);
process.exit(failed ? 1 : 0);
