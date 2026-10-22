'use strict';

/**
 * A digitally signed PDF is analyzed but never rewritten: any change
 * invalidates its signature.
 */

process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';

const fs = require('fs');
const request = require('supertest');
const PDFProcessor = require('../src/services/PDFProcessor');
const { createSignedPDF, createNestedFormPDF } = require('./helpers/structuredPDFs');

const app = require('../server');

describe('signed PDFs', () => {
  beforeAll(() => {
    fs.mkdirSync('./uploads', { recursive: true });
  });

  it('are detected, and an unsigned form is not mistaken for one', async () => {
    const processor = new PDFProcessor();
    fs.writeFileSync('./uploads/signed-detect.pdf', await createSignedPDF());
    fs.writeFileSync('./uploads/unsigned-form.pdf', await createNestedFormPDF());
    expect((await processor.validatePDF('./uploads/signed-detect.pdf')).signed).toBe(true);
    expect((await processor.validatePDF('./uploads/unsigned-form.pdf')).signed).toBe(false);
    fs.rmSync('./uploads/signed-detect.pdf');
    fs.rmSync('./uploads/unsigned-form.pdf');
  });

  it('are analyzed but not rewritten', async () => {
    const analyzed = await request(app)
      .post('/api/analyze')
      .attach('pdf', await createSignedPDF(), { filename: 'contract.pdf', contentType: 'application/pdf' });
    expect(analyzed.status).toBe(200);

    const remediated = await request(app).post(`/api/remediate/${analyzed.body.jobId}`).send({ autoFix: true });
    expect(remediated.status).toBe(422);
    expect(remediated.body.error).toMatch(/digitally signed/);
  });
});
