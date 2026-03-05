import { runCalculationTests } from '../tests/calculations.test.mjs';

async function main() {
  const calcResults = await runCalculationTests();

  console.log('Calculation validation cases:');
  for (const row of calcResults) {
    const status = row.pass ? 'PASS' : 'FAIL';
    console.log(`- [${status}] ${row.case}`);
    console.log(`  expected=${JSON.stringify(row.expected)} actual=${JSON.stringify(row.actual)}`);
  }

  const failed = calcResults.filter((r) => !r.pass);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
