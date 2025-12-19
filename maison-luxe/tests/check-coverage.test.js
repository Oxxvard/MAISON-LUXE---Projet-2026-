const { execSync } = require('child_process');

test('auth coverage script reports protected routes', () => {
  const out = execSync('node scripts/check-auth-coverage.js', { encoding: 'utf8' });
  expect(out).toMatch(/appear to use withAuth|All API routes appear to use/);
});
