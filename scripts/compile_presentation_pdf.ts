import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function compilePDF() {
  const htmlPath = path.resolve(__dirname, '../docs/submission/mvp-demo/presentation.html');
  const pdfOutputPath = path.resolve(__dirname, '../docs/submission/mvp-demo/InternSync_MVP_Product_Demonstration.pdf');
  const previewDir = path.resolve(__dirname, '../docs/submission/mvp-demo/pdf-previews');

  if (!fs.existsSync(previewDir)) {
    fs.mkdirSync(previewDir, { recursive: true });
  }

  console.log(`Loading HTML from: ${htmlPath}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });

  // Evaluate slide count
  const slideCount = await page.locator('.slide').count();
  console.log(`Found ${slideCount} slides in presentation.`);

  // Capture preview screenshot of each slide to visually review
  console.log('Generating slide preview screenshots for visual inspection...');
  for (let i = 0; i < slideCount; i++) {
    const slide = page.locator('.slide').nth(i);
    const slideId = await slide.getAttribute('id') || `slide-${i + 1}`;
    const previewFile = path.join(previewDir, `${String(i + 1).padStart(2, '0')}_${slideId}.png`);
    await slide.screenshot({ path: previewFile });
    console.log(`  Saved preview: ${previewFile}`);
  }

  // Generate high quality PDF
  console.log('Compiling high-resolution PDF...');
  await page.pdf({
    path: pdfOutputPath,
    width: '1920px',
    height: '1080px',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  console.log(`PDF compiled successfully to: ${pdfOutputPath}`);
  const stats = fs.statSync(pdfOutputPath);
  console.log(`PDF File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  await browser.close();
}

compilePDF().catch((err) => {
  console.error('Failed to compile PDF:', err);
  process.exit(1);
});
