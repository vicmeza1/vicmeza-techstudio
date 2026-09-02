// Captura cada lamina-NN.html a PNG 1080×1350.
// Uso: node render.mjs salida/
// Requiere Playwright (local: `npm i playwright`; global: `npm i -g playwright`) y un Chromium
// (`npx playwright install chromium`). Variables opcionales: PLAYWRIGHT_MODULE (ruta al paquete),
// CHROMIUM_PATH (ejecutable de un Chromium ya instalado).
import fs from 'node:fs'; import path from 'node:path'; import { execSync } from 'node:child_process';
async function loadPlaywright() {
  const candidates = ['playwright', process.env.PLAYWRIGHT_MODULE].filter(Boolean);
  try { candidates.push(path.join(execSync('npm root -g').toString().trim(), 'playwright', 'index.mjs')); } catch {}
  for (const c of candidates) { try { return await import(c); } catch {} }
  throw new Error('No encuentro Playwright. Instala con `npm i -g playwright` o define PLAYWRIGHT_MODULE.');
}
const { chromium } = await loadPlaywright();
const dir = path.resolve(process.argv[2] || '.');
const files = fs.readdirSync(dir).filter(f => /^lamina-\d+\.html$/.test(f)).sort();
const exe = process.env.CHROMIUM_PATH;
const browser = exe ? await chromium.launch({ executablePath: exe }).catch(() => chromium.launch()) : await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
for (const f of files) {
  await page.goto('file://' + path.join(dir, f)); await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(dir, f.replace('.html', '.png')) });
  console.log('png', f);
}
await browser.close();
