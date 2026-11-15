// Verifies the on-device URL engine against the shared regression corpus.
//   node scripts/check-url-engine.mjs            -> pass/fail summary (exit 1 on failure)
//   node scripts/check-url-engine.mjs --json     -> prints [{url, riskScore, status}] (used for Python parity checks)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createUrlEngine } from '../src/services/urlEngine.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const intel = JSON.parse(readFileSync(join(root, 'shared', 'url_intel.json'), 'utf8'));
const corpus = JSON.parse(readFileSync(join(root, 'shared', 'url_test_corpus.json'), 'utf8')).cases;
const engine = createUrlEngine(intel);

const actionOf = (status) => ({ SAFE: 'allow', SUSPICIOUS: 'warn', DANGEROUS: 'block' }[status]);
const rows = corpus.map((c) => {
  const r = engine.analyzeUrlLocal(c.url);
  return { url: c.url, expect: c.expect, riskScore: r.riskScore, status: r.status, action: actionOf(r.status) };
});

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(rows.map(({ url, riskScore, status }) => ({ url, riskScore, status }))));
  process.exit(0);
}

let failed = 0;
for (const r of rows) {
  const ok = r.expect === 'warn' ? r.action !== 'allow' : r.action === r.expect;
  if (!ok) {
    failed++;
    console.error(`FAIL  expected ${r.expect}, got ${r.action} (${r.riskScore})  ${r.url}`);
  }
}
console.log(`${rows.length - failed}/${rows.length} corpus cases passed`);
process.exit(failed ? 1 : 0);
