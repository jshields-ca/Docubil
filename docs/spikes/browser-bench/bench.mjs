// Benchmark harness for docs/spikes/browser-first.md. Serve a directory
// containing index.html, core.mjs (browser-first-analyze.mjs without its CLI
// block), pdfjs -> node_modules/pdfjs-dist, pdflib -> node_modules/@cantoo/pdf-lib/dist
// and pdfs/ on 127.0.0.1:8765, then: [THROTTLE=4] node bench.mjs file.pdf ...
import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--enable-precise-memory-info'] });
const page = await browser.newPage();
if (process.env.THROTTLE) { const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.THROTTLE) }); }
page.on('pageerror', (e) => console.error('pageerror', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('console', m.text()); });
for (const file of process.argv.slice(2)) {
  await page.goto('http://127.0.0.1:8765/index.html');
  await page.waitForFunction(() => window.ready === true);
  const t = Date.now();
  const res = await page.evaluate((f) => window.run(f), file);
  console.log(file, JSON.stringify(res), 'wall', Date.now() - t, 'ms');
}
await browser.close();
