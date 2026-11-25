const { chromium } = require('playwright');
const fs = require('fs');
// manual_jobs.json: [{html, pdf, png?}]
(async () => {
  const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const browser = await chromium.launch();
  for (const j of jobs) {
    const page = await browser.newPage();
    await page.goto('file://' + j.html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: j.pdf, preferCSSPageSize: true, printBackground: true });
    if (j.png) {
      await page.setViewportSize({ width: 794, height: 1123 });
      await page.screenshot({ path: j.png });
    }
    await page.close();
    console.log('ok', j.pdf);
  }
  await browser.close();
})();
