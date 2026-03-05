import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.PROD_URL || 'https://erp.ybc.com.cy';

const checks = [];

async function main() {
  const outDir = path.resolve('docs/reports/screenshots/production');
  await fs.mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();

  // 1. Home page loads
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'prod-home.png'), fullPage: true });
  checks.push({ id: 'prod_home_loads', status: page.url().startsWith(baseUrl) ? 'pass' : 'fail', final_url: page.url() });

  // 2. Login page available
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  const loginFormExists = (await page.locator('form.login-form').count()) > 0;
  await page.screenshot({ path: path.join(outDir, 'prod-login.png'), fullPage: true });
  checks.push({ id: 'prod_login_form', status: loginFormExists ? 'pass' : 'fail', final_url: page.url() });

  // 3. Protected page redirects to login when unauthenticated
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  const redirected = page.url().includes('/login');
  await page.screenshot({ path: path.join(outDir, 'prod-dashboard-redirect.png'), fullPage: true });
  checks.push({ id: 'prod_private_route_redirect', status: redirected ? 'pass' : 'fail', final_url: page.url() });

  await context.close();
  await browser.close();

  const outFile = path.resolve('docs/reports/production-smoke.json');
  await fs.writeFile(outFile, JSON.stringify(checks, null, 2));

  const failed = checks.filter((c) => c.status !== 'pass').length;
  console.log(`Production smoke complete: ${checks.length - failed}/${checks.length} passed`);
  console.log(`Result file: ${path.relative(path.resolve('.'), outFile)}`);
  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
