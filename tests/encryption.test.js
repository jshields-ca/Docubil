'use strict';

/**
 * Encrypted PDFs: one that needs a password to open can't be analyzed and
 * is refused up front; one with only security restrictions can be analyzed
 * but is never rewritten, because pdf-lib can't decrypt and saving it
 * produced a file that wouldn't open.
 */

process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const request = require('supertest');
const { createTestPDF } = require('./helpers/createTestPDF');

const app = require('../server');
const PYTHON = process.env.PYTHON_PATH || 'python3';
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docubil-encryption-'));

function pikepdfAvailable() {
  try {
    execFileSync(PYTHON, ['-c', 'import pikepdf'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
const describePython = pikepdfAvailable() || process.env.CI ? describe : describe.skip;

// pdf-lib can't encrypt, so pikepdf does.
async function encryptedPDF(userPassword) {
  const plain = path.join(workDir, 'plain.pdf');
  const out = path.join(workDir, `encrypted-${userPassword || 'restrictions'}.pdf`);
  fs.writeFileSync(plain, await createTestPDF({ title: 'Encrypted' }));
  execFileSync(PYTHON, ['-c',
    'import pikepdf,sys\n' +
    'pikepdf.open(sys.argv[1]).save(sys.argv[2], encryption=pikepdf.Encryption(owner="owner", user=sys.argv[3], R=6))',
    plain, out, userPassword]);
  return fs.readFileSync(out);
}

afterAll(() => {
  fs.rmSync(workDir, { recursive: true, force: true });
});

describePython('encrypted PDFs', () => {
  beforeAll(() => {
    fs.mkdirSync('./uploads', { recursive: true });
  });

  it('refuses a PDF that needs a password to open, and says how to fix it', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .attach('pdf', await encryptedPDF('secret'), { filename: 'locked.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password-protected/);
  });

  it('analyzes a restricted PDF but refuses to rewrite it', async () => {
    const analyzed = await request(app)
      .post('/api/analyze')
      .attach('pdf', await encryptedPDF(''), { filename: 'restricted.pdf', contentType: 'application/pdf' });
    expect(analyzed.status).toBe(200);

    const remediated = await request(app).post(`/api/remediate/${analyzed.body.jobId}`).send({ autoFix: true });
    expect(remediated.status).toBe(422);
    expect(remediated.body.error).toMatch(/encrypted/);
  });
});
