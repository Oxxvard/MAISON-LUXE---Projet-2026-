const { execSync } = require('child_process');

test('db-check script prints collection counts', () => {
  const out = execSync('node scripts/db-check.js', { encoding: 'utf8' });
  expect(out).toMatch(/Counts:\n\s*orders:\s*\d+/);
});
