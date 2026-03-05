import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173';

const checks = [
  {
    id: 'dashboard_quick_action_membership',
    description: 'Dashboard quick action navigates to membership creation',
    run: async (page) => {
      await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded' });
      await page.getByText('Нове членство').click();
      await page.waitForURL('**/memberships/create');
      return page.url().endsWith('/memberships/create');
    },
  },
  {
    id: 'finance_hub_navigation',
    description: 'Finance hub card navigates to Accounts',
    run: async (page) => {
      await page.goto(`${baseUrl}/finance`, { waitUntil: 'domcontentloaded' });
      await page.getByText('Рахунки').first().click();
      await page.waitForURL('**/accounts');
      return page.url().endsWith('/accounts');
    },
  },
  {
    id: 'documents_hub_navigation',
    description: 'Documents hub card navigates to journal',
    run: async (page) => {
      await page.goto(`${baseUrl}/documents`, { waitUntil: 'domcontentloaded' });
      await page.getByText('Журнал документів').first().click();
      await page.waitForURL('**/document-journal');
      return page.url().endsWith('/document-journal');
    },
  },
  {
    id: 'reports_drilldown_navigation',
    description: 'Reports page drilldown opens Profit & Loss detail',
    run: async (page) => {
      await page.goto(`${baseUrl}/reports`, { waitUntil: 'domcontentloaded' });
      await page.getByText('Детальний звіт →').first().click();
      await page.waitForURL('**/reports/profit-loss');
      return page.url().endsWith('/reports/profit-loss');
    },
  },
  {
    id: 'directories_tabs_switch',
    description: 'Directories tabs switch to users content',
    run: async (page) => {
      await page.goto(`${baseUrl}/directories`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'Користувачі' }).click();
      await page.waitForTimeout(400);
      return (await page.locator('text=Запросити користувача').count()) > 0;
    },
  },
  {
    id: 'users_invite_modal',
    description: 'Users page opens invite modal',
    run: async (page) => {
      await page.goto(`${baseUrl}/users`, { waitUntil: 'domcontentloaded' });
      await page.getByText('Запросити користувача').click();
      return (await page.locator('text=Надіслати запрошення').count()) > 0;
    },
  },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();

  const results = [];
  for (const check of checks) {
    try {
      const pass = await check.run(page);
      results.push({ id: check.id, description: check.description, status: pass ? 'pass' : 'fail' });
    } catch (err) {
      results.push({ id: check.id, description: check.description, status: 'fail', error: err.message });
    }
  }

  await context.close();
  await browser.close();

  const outFile = path.resolve('docs/reports/function-checks.json');
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, JSON.stringify(results, null, 2));

  const failed = results.filter((r) => r.status !== 'pass').length;
  console.log(`Function smoke complete: ${results.length - failed}/${results.length} passed`);
  console.log(`Result file: ${path.relative(path.resolve('.'), outFile)}`);
  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
