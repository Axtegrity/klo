import PptxGenJS from "/tmp/klo-pptx/node_modules/pptxgenjs/dist/pptxgen.es.js";
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const browser = await chromium.launch();
const slideDir = "/Users/timothyadams/Desktop/KLO/golive-slides/";
try { mkdirSync(slideDir, { recursive: true }); } catch {}

const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto("file:///Users/timothyadams/Desktop/KLO%20Mobile%20App%20%E2%80%94%20Go%20Live%20%26%20Support%20Plan.html", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

await page.evaluate(() => {
  const nav = document.querySelector('.nav');
  if (nav) nav.style.display = 'none';
  const counter = document.querySelector('.slide-counter');
  if (counter) counter.style.display = 'none';
});

const slideCount = await page.evaluate(() => document.querySelectorAll('.slide').length);
console.log(`Found ${slideCount} slides`);

for (let i = 0; i < slideCount; i++) {
  await page.evaluate((idx) => {
    document.querySelectorAll('.slide').forEach((s, j) => {
      s.style.display = j === idx ? 'flex' : 'none';
    });
  }, i);
  await page.waitForTimeout(500);
  const num = String(i + 1).padStart(2, "0");
  await page.screenshot({ path: `${slideDir}slide-${num}.png`, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
  console.log(`Rendered slide ${i + 1}/${slideCount}`);
}

await page.close();
await browser.close();
console.log("All slides rendered.\n");

const pptx = new PptxGenJS();
pptx.author = "Tim Adams";
pptx.company = "KLO / Keith L. Odom";
pptx.subject = "KLO Mobile App — Go Live & Support Plan";
pptx.title = "KLO Mobile App — Go Live & Support Plan";
pptx.layout = "LAYOUT_16x9";

for (let i = 1; i <= slideCount; i++) {
  const num = String(i).padStart(2, "0");
  const s = pptx.addSlide();
  s.addImage({ path: `${slideDir}slide-${num}.png`, x: 0, y: 0, w: 10, h: 5.63 });
}

const outPath = "/Users/timothyadams/Desktop/KLO/KLO_Go_Live_Support_Plan.pptx";
await pptx.writeFile({ fileName: outPath });
console.log("PPTX saved to " + outPath);
