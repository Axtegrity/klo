import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({
    recordVideo: { dir: './videos' }
  });
  const page = await context.newPage();

  try {
    console.log('🎬 Recording Tutorial 01...');
    
    // Navigate to signin page
    await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Find and fill email field
    const emailField = page.locator('input[type="email"]').first();
    await emailField.fill('keith@keithlodom.ai');
    await page.waitForTimeout(500);

    // Find and fill password field
    const passwordField = page.locator('input[type="password"]').first();
    await passwordField.fill('Password123!');
    await page.waitForTimeout(500);

    // Click sign in
    await page.locator('button').filter({ hasText: /^Sign In$/ }).click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Navigate to admin
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    console.log('✅ Recording complete');
    
    await context.close();
    await browser.close();

  } catch (error) {
    console.error('Error:', error.message);
    await context.close();
    await browser.close();
    process.exit(1);
  }
})();
