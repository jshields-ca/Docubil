'use strict';

/**
 * Accuracy corpus runner (PLAN.md Phase 6, issue #57). For every document in
 * cases.js: analyze it, compare each scored check with the known answer, and
 * where given, remediate it and check what was fixed and what the file now
 * claims. Mismatches recorded in baseline.json are known and tolerated; any
 * other mismatch fails (a regression), and so does a baseline entry that now
 * passes (update the baseline so the improvement is locked in).
 *
 * Run alone with `npm run corpus`. Needs Python with pikepdf + pdfplumber:
 * skipped locally without them, never in CI.
 */

const os = require('os');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

process.env.NODE_ENV = 'test';
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docubil-corpus-'));
process.env.OUTPUT_DIR = workDir;

const AccessibilityAnalyzer = require('../../src/services/AccessibilityAnalyzer');
const RemediationService = require('../../src/services/RemediationService');
const cases = require('./cases');
const baseline = require('./baseline.json');

const PYTHON = process.env.PYTHON_PATH || 'python3';

function pythonAvailable() {
  try {
    execFileSync(PYTHON, ['-c', 'import pikepdf, pdfplumber'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
const describeCorpus = pythonAvailable() || process.env.CI ? describe : describe.skip;

// Which check an issue ID belongs to.
const CHECKS = {
  tagged: (id) => id === 'structure-001',
  bookmarks: (id) => id === 'structure-002',
  altText: (id) => id.startsWith('alt-text-'),
  contrast: (id) => id.startsWith('contrast-') && !id.startsWith('contrast-aaa'),
  readingOrder: (id) => id === 'reading-order-001',
  title: (id) => id === 'metadata-001',
  language: (id) => id === 'language-001',
  headings: (id) => id === 'heading-001',
  formTooltips: (id) => id.startsWith('form-tooltip-') || id === 'form-001',
};

function readClaims(file) {
  const script =
    'import pikepdf,sys,json\n' +
    'p=pikepdf.open(sys.argv[1])\n' +
    'mi=p.Root.get("/MarkInfo")\n' +
    'print(json.dumps({"lang": str(p.Root.Lang) if "/Lang" in p.Root else None,' +
    '"marked": bool(mi.get("/Marked", False)) if mi is not None else False,' +
    '"title": str(p.docinfo.get("/Title")) if p.docinfo is not None and "/Title" in p.docinfo else None}))';
  return JSON.parse(execFileSync(PYTHON, ['-c', script, file]).toString());
}

const results = []; // { case, check, kind: 'tp'|'tn'|'fp'|'fn' }
const mismatches = []; // "case/check/kind" or "case/remediation/..." strings

afterAll(() => {
  fs.rmSync(workDir, { recursive: true, force: true });
  if (results.length === 0) {
    return;
  }
  const table = {};
  for (const r of results) {
    table[r.check] = table[r.check] || { tp: 0, tn: 0, fp: 0, fn: 0 };
    table[r.check][r.kind]++;
  }
  console.log('Corpus accuracy by check (tp = issue correctly reported, tn = correctly not reported):');
  console.table(table);
});

describeCorpus('accuracy corpus', () => {
  for (const testCase of cases) {
    it(testCase.name, async () => {
      const file = path.join(workDir, `${testCase.name}.pdf`);
      await fs.promises.writeFile(file, await testCase.build());

      const { issues, context } = await new AccessibilityAnalyzer().analyze(file, 'AA');
      const ids = issues.map((i) => i.id);

      for (const [check, expected] of Object.entries(testCase.expect)) {
        const reported = ids.some(CHECKS[check]);
        const kind = reported ? (expected ? 'tp' : 'fp') : (expected ? 'fn' : 'tn');
        results.push({ case: testCase.name, check, kind });
        if (kind === 'fp' || kind === 'fn') {
          mismatches.push(`${testCase.name}/${check}/${kind}`);
        }
      }

      if (testCase.remediation) {
        const result = await new RemediationService().remediate(file, issues, {
          jobId: testCase.name,
          context: { ...context, originalFilename: testCase.filename },
        });
        const fixed = result.fixedIssues.map((i) => i.id);
        const remaining = result.remainingIssues.map((i) => i.id);
        for (const id of testCase.remediation.fixed || []) {
          if (!fixed.includes(id)) {
            mismatches.push(`${testCase.name}/remediation/not-fixed:${id}`);
          }
        }
        for (const id of testCase.remediation.remaining || []) {
          if (!remaining.includes(id)) {
            mismatches.push(`${testCase.name}/remediation/not-remaining:${id}`);
          }
        }
        const claims = readClaims(result.remediatedPdfPath);
        for (const [key, value] of Object.entries(testCase.remediation.claims || {})) {
          if (claims[key] !== value) {
            mismatches.push(`${testCase.name}/remediation/claim:${key}=${JSON.stringify(claims[key])}`);
          }
        }
      }
    });
  }

  it('matches the recorded baseline (no regressions, no stale entries)', () => {
    const known = new Set(baseline.knownMismatches.map((m) => m.id));
    const regressions = mismatches.filter((m) => !known.has(m));
    const fixedSinceBaseline = [...known].filter((m) => !mismatches.includes(m));
    expect({ regressions, fixedSinceBaseline }).toEqual({ regressions: [], fixedSinceBaseline: [] });
  });
});
