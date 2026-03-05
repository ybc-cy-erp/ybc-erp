import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const modeArg = process.argv.find((a) => a.startsWith('--mode='));
const mode = modeArg ? modeArg.split('=')[1] : 'private';
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173';

const routes = {
  public: [
    { route: '/login', module: 'auth', check: 'form.login-form' },
    { route: '/signup', module: 'auth', check: 'form.login-form' },
    { route: '/reset-password', module: 'auth', check: 'form' },
  ],
  private: [
    { route: '/dashboard', module: 'dashboard', check: '.dashboard' },
    { route: '/membership-plans', module: 'memberships', check: '.plans-finder-page' },
    { route: '/memberships', module: 'memberships', check: '.memberships-page, .membership-list, .membership-finder' },
    { route: '/memberships/create', module: 'memberships', check: 'form' },
    { route: '/events', module: 'events', check: '.events-page, table, .event-list' },
    { route: '/events/create', module: 'events', check: 'form' },
    { route: '/bills', module: 'finance', check: '.bills-page, table' },
    { route: '/bills/create', module: 'finance', check: 'form' },
    { route: '/wallets', module: 'finance', check: '.glass-card' },
    { route: '/counterparties', module: 'directories', check: '.counterparties-page, .cp-table' },
    { route: '/items', module: 'directories', check: '.items-page, .items-table' },
    { route: '/documents', module: 'documents', check: '.glass-card' },
    { route: '/document-journal', module: 'documents', check: '.documents-page, .documents-table' },
    { route: '/cash-documents', module: 'documents', check: '.cash-documents-page, table' },
    { route: '/chart-of-accounts', module: 'finance', check: '.glass-card table, select' },
    { route: '/currency-exchange', module: 'finance', check: '.currency-exchange-page, table' },
    { route: '/transfers', module: 'finance', check: '.transfers-page, table' },
    { route: '/directories', module: 'directories', check: '.directories-tabs-page, .tab-button' },
    { route: '/finance', module: 'finance', check: '.glass-card' },
    { route: '/accounts', module: 'finance', check: '.accounts-page, table' },
    { route: '/users', module: 'users', check: '.users-page, table' },
    { route: '/settings', module: 'settings', check: '.settings-page' },
    { route: '/manual', module: 'manual', check: '.manual-page, .manual-card' },
    { route: '/reports', module: 'reports', check: '.glass-card button, select' },
    { route: '/reports/profit-loss', module: 'reports', check: '.report-page, table' },
    { route: '/reports/balance-sheet', module: 'reports', check: '.report-page, table' },
    { route: '/reports/cash-flow', module: 'reports', check: '.report-page, table' },
  ],
};

async function main() {
  if (!routes[mode]) {
    throw new Error(`Unknown mode: ${mode}`);
  }

  const reportRoot = path.resolve('docs/reports');
  const screenshotRoot = path.join(reportRoot, 'screenshots');
  await fs.mkdir(screenshotRoot, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });

  const results = [];

  for (const entry of routes[mode]) {
    const page = await context.newPage();
    const pageErrors = [];
    const consoleErrors = [];

    page.on('pageerror', (e) => pageErrors.push(e.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const moduleDir = path.join(screenshotRoot, entry.module);
    await fs.mkdir(moduleDir, { recursive: true });
    const fileName = `${entry.route.replace(/^\//, '').replace(/[/:]/g, '_') || 'root'}.png`;
    const screenshotPath = path.join(moduleDir, fileName);

    let status = 'pass';
    let checkPassed = false;
    let finalUrl = '';

    try {
      await page.goto(`${baseUrl}${entry.route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1200);

      finalUrl = new URL(page.url()).pathname;
      const locator = page.locator(entry.check).first();
      checkPassed = (await locator.count()) > 0;
      if (!checkPassed) status = 'fail';

      await page.screenshot({ path: screenshotPath, fullPage: true });

      if (pageErrors.length > 0) {
        status = 'fail';
      }
    } catch (err) {
      status = 'fail';
      pageErrors.push(err.message);
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
    }

    results.push({
      mode,
      route: entry.route,
      module: entry.module,
      status,
      check_selector: entry.check,
      check_passed: checkPassed,
      final_url_path: finalUrl,
      page_errors: pageErrors,
      console_errors: consoleErrors.slice(0, 5),
      screenshot: path.relative(path.resolve('.'), screenshotPath),
    });

    await page.close();
  }

  await context.close();
  await browser.close();

  const outFile = path.join(reportRoot, `screen-validation-${mode}.json`);
  await fs.writeFile(outFile, JSON.stringify(results, null, 2));

  const failed = results.filter((r) => r.status !== 'pass').length;
  console.log(`Screen validation (${mode}) complete: ${results.length - failed}/${results.length} passed`);
  console.log(`Result file: ${path.relative(path.resolve('.'), outFile)}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
