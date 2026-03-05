import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

// Load the HTML file via file:// so relative image paths resolve
await page.goto("file:///Users/timothyadams/Desktop/KLO%20App%20%E2%80%94%20Development%20Update%20%26%20Launch%20Roadmap.html", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

// Hide nav and counter, show all slides — no other changes
await page.evaluate(() => {
  document.querySelector('.nav').style.display = 'none';
  const counter = document.querySelector('.slide-counter');
  if (counter) counter.style.display = 'none';

  // Show all slides for print
  document.querySelectorAll('.slide').forEach(s => {
    s.style.display = 'flex';
    s.style.pageBreakAfter = 'always';
  });
});

await page.waitForTimeout(1000);

const outPath = "/Users/timothyadams/Desktop/KLO/KLO_Development_Update.pdf";
await page.pdf({
  path: outPath,
  width: "1920px",
  height: "1080px",
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});

console.log("PDF saved to " + outPath);
await browser.close();
