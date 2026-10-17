'use strict';

/**
 * Reports must be written where the server serves and cleans them up:
 * REPORTS_DIR (the Docker image sets /data/reports), not a hard-coded
 * ./reports. Separate file because the setting is read at load time.
 */

const os = require('os');
const path = require('path');
const fs = require('fs');

const reportsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docubil-reports-'));

process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.REPORTS_DIR = reportsDir;

const request = require('supertest');
const { createTestPDF } = require('./helpers/createTestPDF');

const app = require('../server');

afterAll(() => {
  fs.rmSync(reportsDir, { recursive: true, force: true });
});

describe('REPORTS_DIR', () => {
  it('serves the HTML report and JSON export from the configured directory', async () => {
    fs.mkdirSync('./uploads', { recursive: true });
    const pdf = await createTestPDF({ title: 'Reports dir test' });
    const analyzed = await request(app)
      .post('/api/analyze')
      .attach('pdf', pdf, { filename: 'test.pdf', contentType: 'application/pdf' });
    expect(analyzed.status).toBe(200);
    const { jobId } = analyzed.body;

    expect(fs.existsSync(path.join(reportsDir, `${jobId}-report.html`))).toBe(true);
    expect((await request(app).get(`/reports/${jobId}-report.html`)).status).toBe(200);
    expect((await request(app).get(`/api/report/${jobId}/json`)).status).toBe(200);
  });
});
