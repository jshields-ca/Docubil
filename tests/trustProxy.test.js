'use strict';

/**
 * TRUST_PROXY: behind a reverse proxy, each client gets its own rate-limit
 * bucket. Without it, every request appears to come from the proxy.
 * Separate file because the setting is read when server.js is first loaded.
 */

process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.TRUST_PROXY = '1';
process.env.RATE_LIMIT_MAX_REQUESTS = '2';

const request = require('supertest');

const app = require('../server');
const UNKNOWN_JOB = '/api/status/00000000-0000-4000-8000-000000000000';

describe('TRUST_PROXY', () => {
  it('passes a hop count through to Express', () => {
    expect(app.get('trust proxy')).toBe(1);
  });

  it('rate-limits each forwarded client separately', async () => {
    const from = (ip) => request(app).get(UNKNOWN_JOB).set('X-Forwarded-For', ip);

    // Client A uses up its allowance of 2...
    expect((await from('203.0.113.1')).status).toBe(404);
    expect((await from('203.0.113.1')).status).toBe(404);
    expect((await from('203.0.113.1')).status).toBe(429);

    // ...but client B, behind the same proxy, is unaffected.
    expect((await from('203.0.113.2')).status).toBe(404);
  });
});
