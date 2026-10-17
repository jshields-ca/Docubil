// Prints an HTML file to PDF in Chromium, tagged and untagged, for the
// accuracy corpus (see build.sh). Usage: node print.mjs page.html tagged.pdf plain.pdf
import { chromium } from 'playwright';
const [html, outTagged, outPlain] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
await page.goto('file://' + html);
await page.pdf({ path: outTagged, tagged: true, outline: true });
await page.pdf({ path: outPlain, tagged: false });
await browser.close();
