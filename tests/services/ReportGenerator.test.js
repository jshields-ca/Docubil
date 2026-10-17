'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs');

const reportsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docubil-report-escape-'));
process.env.REPORTS_DIR = reportsDir;

const ReportGenerator = require('../../src/services/ReportGenerator');

afterAll(() => {
  fs.rmSync(reportsDir, { recursive: true, force: true });
});

describe('ReportGenerator', () => {
  it('escapes text that comes from the PDF or its file name', async () => {
    const injected = '<img src=x onerror="alert(1)">';
    const generator = new ReportGenerator();
    const reportPath = await generator.generateReport({
      jobId: '00000000-0000-4000-8000-000000000001',
      filename: `${injected}.pdf`,
      pdfInfo: { title: injected, author: injected, subject: '', keywords: '', pageCount: 1 },
      accessibilityIssues: [{
        id: `form-tooltip-${injected}`,
        wcagRule: '4.1.2',
        severity: 'moderate',
        title: `Form field "${injected}" is missing an accessible tooltip`,
        description: injected,
        element: 'Form Field',
        page: 'Unknown',
        fixable: true,
        impact: 'x',
      }],
      remediationResult: {
        fixedIssues: [],
        remainingIssues: [{ id: 'x', title: injected, reason: injected }],
        summary: { totalIssues: 1, fixedCount: 0, remainingCount: 1, autoFixPercentage: 0 },
      },
      wcagLevel: 'AA',
      status: 'remediated',
    });

    const html = fs.readFileSync(reportPath, 'utf8');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  });
});
