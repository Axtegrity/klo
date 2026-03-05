import PptxGenJS from "/tmp/klo-pptx/node_modules/pptxgenjs/dist/pptxgen.es.js";
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "fs";

// ═══════════════════════════════════════════════════════════
// Step 1: Render every slide from the HTML deck as 1920×1080
//         with navy blue background instead of near-black
// ═══════════════════════════════════════════════════════════

const browser = await chromium.launch();
const slideDir = "/Users/timothyadams/Desktop/KLO/slides/";
try { mkdirSync(slideDir, { recursive: true }); } catch {}

// Load the HTML file directly so relative image paths resolve
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto("file:///Users/timothyadams/Desktop/KLO%20App%20%E2%80%94%20Development%20Update%20%26%20Launch%20Roadmap.html", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

// Hide nav and counter — no other changes
await page.evaluate(() => {
  document.querySelector('.nav').style.display = 'none';
  const counter = document.querySelector('.slide-counter');
  if (counter) counter.style.display = 'none';
});

// Count slides
const slideCount = await page.evaluate(() => document.querySelectorAll('.slide').length);
console.log(`Found ${slideCount} slides`);

for (let i = 0; i < slideCount; i++) {
  // Use JS to show only this slide
  await page.evaluate((idx) => {
    document.querySelectorAll('.slide').forEach((s, j) => {
      s.style.display = j === idx ? 'flex' : 'none';
    });
  }, i);
  await page.waitForTimeout(500);

  const num = String(i + 1).padStart(2, "0");
  await page.screenshot({
    path: `${slideDir}slide-${num}.png`,
    clip: { x: 0, y: 0, width: 1920, height: 1080 },
  });
  console.log(`Rendered slide ${i + 1}/${slideCount}`);
}

await page.close();
await browser.close();
console.log("All slides rendered.\n");

// ═══════════════════════════════════════════════════════════
// Step 2: Build PPTX from rendered slide images
// ═══════════════════════════════════════════════════════════

const pptx = new PptxGenJS();
pptx.author = "Tim Adams";
pptx.company = "KLO / Keith L. Odom";
pptx.subject = "KLO App Development Update & Launch Roadmap";
pptx.title = "KLO App — Development Update";
pptx.layout = "LAYOUT_16x9";

for (let i = 1; i <= slideCount; i++) {
  const num = String(i).padStart(2, "0");
  const s = pptx.addSlide();
  s.addImage({
    path: `${slideDir}slide-${num}.png`,
    x: 0, y: 0, w: 10, h: 5.63,
  });
}

const outPath = "/Users/timothyadams/Desktop/KLO/KLO_Development_Update.pptx";
await pptx.writeFile({ fileName: outPath });
console.log("PPTX saved to " + outPath);
