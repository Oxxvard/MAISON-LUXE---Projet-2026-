const next = require('next');
const http = require('http');
const request = require('supertest');

jest.setTimeout(300000);

const runIntegration = process.env.RUN_INTEGRATION === 'true';

const describeIf = runIntegration ? describe : describe.skip;

describeIf('Integration: route protection', () => {
  let server;
  let app;
  let port = 3999;

  beforeAll(async () => {
    app = next({ dev: true, dir: process.cwd() });
    await app.prepare();
    const handler = app.getRequestHandler();
    server = http.createServer((req, res) => handler(req, res));
    await new Promise((resStart) => server.listen(port, resStart));
  });

  afterAll(async () => {
    if (server) await new Promise((resStop) => server.close(resStop));
    if (app) await app.close();
  });

  test('admin route requires authentication', async () => {
    // Call an admin route that should be protected
    const res = await request(`http://localhost:${port}`).post('/api/admin/sync-cj');
    expect([401, 302, 403]).toContain(res.status); // 401 or redirect to login (302) or 403
  });
});
