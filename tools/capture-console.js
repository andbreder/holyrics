const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async function () {
  const outFile = path.resolve(process.cwd(), 'logs.log');
  const pagePath = path.resolve(process.cwd(), 'live', 'text.html');
  const fileUrl = `file://${pagePath.replace(/\\/g, '/')}`;
  const durationMs = Number(process.argv[2]) || 5000;

  const append = (line) => {
    fs.appendFileSync(outFile, line + '\n', { encoding: 'utf8' });
  };

  append(`--- capture start ${new Date().toISOString()} url=${fileUrl}`);

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();

    page.on('console', (msg) => {
      const args = msg.args().map((a) => (a._remoteObject && a._remoteObject.value !== undefined) ? String(a._remoteObject.value) : a.toString());
      append(`[console:${msg.type()}] ${args.join(' ')}`);
    });

    page.on('pageerror', (err) => append(`[pageerror] ${err.stack || err}`));
    page.on('requestfailed', (req) => append(`[requestfailed] ${req.url()} ${req.failure() && req.failure().errorText}`));

    await page.goto(fileUrl, { waitUntil: 'networkidle2' });

    append(`[capture] page loaded, waiting ${durationMs}ms`);
    await new Promise((r) => setTimeout(r, durationMs));

    append(`--- capture end ${new Date().toISOString()}`);
  } catch (err) {
    append(`[error] ${err.stack || err}`);
  } finally {
    await browser.close();
  }

  console.log('Capture finished. Logs written to', outFile);
})();
