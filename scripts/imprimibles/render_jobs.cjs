const { chromium } = require('playwright');
const fs = require('fs');
// jobs.json: [{pdf, w, h, svgs:[paths], png?}]
(async () => {
  const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const browser = await chromium.launch();
  for (const j of jobs) {
    const page = await browser.newPage({ deviceScaleFactor: j.dsf || 1 });
    const body = j.svgs.map(f => `<div class="p">${fs.readFileSync(f, 'utf8').replace(/<svg /, '<svg style="width:100%;height:100%;display:block" ')}</div>`).join('');
    await page.setContent(`<html><head><style>@page{size:${j.w}mm ${j.h}mm;margin:0}html,body{margin:0}.p{width:${j.w}mm;height:${j.h}mm;page-break-after:always;overflow:hidden}</style></head><body>${body}</body></html>`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: j.pdf, width: `${j.w}mm`, height: `${j.h}mm`, printBackground: true, preferCSSPageSize: true });
    if (j.png) {
      await page.setViewportSize({ width: Math.round(j.w / 25.4 * 96), height: Math.round(j.h / 25.4 * 96) });
      await page.screenshot({ path: j.png });
    }
    await page.close();
    console.log('ok', j.pdf);
  }
  await browser.close();
})();
