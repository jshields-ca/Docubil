'use strict';

/**
 * Accuracy regression tests: real PDFs through the real Python layer and
 * services. Covers PLAN.md Phase 6 defects #51–#56 (GitHub issues).
 *
 * Needs Python with pikepdf + pdfplumber. Skipped locally when they're
 * missing, but never in CI, where requirements.txt is installed.
 */

const os = require('os');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

process.env.NODE_ENV = 'test';
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docubil-accuracy-'));
process.env.OUTPUT_DIR = workDir;

const { analyzePDF, remediatePDF } = require('../../src/services/PythonBridge');
const AccessibilityAnalyzer = require('../../src/services/AccessibilityAnalyzer');
const RemediationService = require('../../src/services/RemediationService');
const { deriveTitle } = require('../../src/services/RemediationService');
const {
  createNestedFormPDF,
  createTaggedFigurePDF,
  createUntaggedImagePDF,
} = require('../helpers/structuredPDFs');

function pythonAvailable() {
  try {
    execFileSync(process.env.PYTHON_PATH || 'python3', ['-c', 'import pikepdf, pdfplumber'], {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}
const describePython = pythonAvailable() || process.env.CI ? describe : describe.skip;

async function write(name, bytes) {
  const file = path.join(workDir, name);
  await fs.promises.writeFile(file, bytes);
  return file;
}

function pikepdfRead(file, expression) {
  const script = `import pikepdf,sys,json\npdf=pikepdf.open(sys.argv[1])\nprint(json.dumps(${expression}))`;
  return JSON.parse(execFileSync(process.env.PYTHON_PATH || 'python3', ['-c', script, file]).toString());
}

afterAll(() => {
  fs.rmSync(workDir, { recursive: true, force: true });
});

describePython('form fields (#51, #55)', () => {
  let file;
  beforeAll(async () => {
    file = await write('nested-form.pdf', await createNestedFormPDF());
  });

  it('finds fields nested under a parent field', async () => {
    const py = await analyzePDF(file);
    expect(py.formFields.map((f) => f.name).sort()).toEqual([
      'applicant.Text12',
      'applicant.date_of_birth',
      'applicant.firstName',
      'applicant.p1-t3',
    ]);
  });

  it('adds tooltips only where the field name reads as a label', async () => {
    const out = path.join(workDir, 'nested-form-fixed.pdf');
    const result = await remediatePDF(file, out, { formTooltips: true });
    expect(result.tooltipFields.sort()).toEqual(['applicant.date_of_birth', 'applicant.firstName']);
    expect(result.skipped.join(' ')).toMatch(/2 form field\(s\) have no readable name/);

    const after = await analyzePDF(out);
    const tooltips = Object.fromEntries(after.formFields.map((f) => [f.name, f.tooltip]));
    expect(tooltips['applicant.firstName']).toBe('First name');
    expect(tooltips['applicant.date_of_birth']).toBe('Date of birth');
    expect(tooltips['applicant.p1-t3']).toBeNull();
    expect(tooltips['applicant.Text12']).toBeNull();
  });

  it('reports machine-named fields as still needing a tooltip after remediation', async () => {
    const { issues } = await new AccessibilityAnalyzer().analyze(file, 'AA');
    const result = await new RemediationService().remediate(file, issues, { jobId: 'form-test' });
    const fixed = result.fixedIssues.map((i) => i.id);
    const remaining = result.remainingIssues.map((i) => i.id);
    expect(fixed).toEqual(expect.arrayContaining(['form-tooltip-applicant.firstName']));
    expect(remaining).toEqual(expect.arrayContaining(['form-tooltip-applicant.p1-t3']));
    expect(fixed).not.toContain('form-tooltip-applicant.Text12');
  });
});

describePython('alt text (#52)', () => {
  it('reads alt text from tagged figures instead of assuming it is missing', async () => {
    const file = await write('figure-with-alt.pdf', await createTaggedFigurePDF());
    const py = await analyzePDF(file);
    expect(py.figures).toEqual([{ page: 1, hasAlt: true }]);
    const { issues } = await new AccessibilityAnalyzer().analyze(file, 'AA');
    expect(issues.filter((i) => i.id.startsWith('alt-text-'))).toEqual([]);
  });

  it('flags a tagged figure that has no alt text, on its page', async () => {
    const file = await write('figure-no-alt.pdf', await createTaggedFigurePDF({ alt: null }));
    const { issues } = await new AccessibilityAnalyzer().analyze(file, 'AA');
    const alt = issues.filter((i) => i.id.startsWith('alt-text-'));
    expect(alt.map((i) => i.id)).toEqual(['alt-text-p1']);
    expect(alt[0].title).toMatch(/tagged figure/);
  });

  it('flags images in an untagged document as having no alt text', async () => {
    const file = await write('untagged-image.pdf', await createUntaggedImagePDF());
    const { issues } = await new AccessibilityAnalyzer().analyze(file, 'AA');
    expect(issues.find((i) => i.id === 'alt-text-p1').title).toMatch(/without alt text/);
  });
});

describePython('tagged flag (#53)', () => {
  it('does not mark an untagged document as tagged', async () => {
    const file = await write('untagged.pdf', await createUntaggedImagePDF());
    const { issues } = await new AccessibilityAnalyzer().analyze(file, 'AA');
    const result = await new RemediationService().remediate(file, issues, { jobId: 'untagged' });

    expect(pikepdfRead(result.remediatedPdfPath, '"/MarkInfo" in pdf.Root')).toBe(false);
    expect(result.fixedIssues.map((i) => i.id)).not.toContain('structure-001');
    expect(result.remainingIssues.find((i) => i.id === 'structure-001').reason).toMatch(/no tags/);
  });

  it('sets the flag on a document that has tags but does not declare them', async () => {
    const file = await write('tagged-unmarked.pdf', await createTaggedFigurePDF({ marked: false }));
    const { issues } = await new AccessibilityAnalyzer().analyze(file, 'AA');
    expect(issues.map((i) => i.id)).toContain('structure-001');
    const result = await new RemediationService().remediate(file, issues, { jobId: 'unmarked' });

    expect(pikepdfRead(result.remediatedPdfPath, 'bool(pdf.Root.MarkInfo.Marked)')).toBe(true);
    expect(result.fixedIssues.map((i) => i.id)).toContain('structure-001');
  });
});

describePython('language (#54)', () => {
  const FRENCH =
    'Le comité a examiné le rapport et il est convaincu que les changements sont nécessaires ' +
    'pour la sécurité du bâtiment. Ce document sera présenté au conseil, qui devrait ' +
    'l’approuver lundi. Vous pouvez lire le texte complet sur le site, et les commentaires ' +
    'des citoyens sont les bienvenus dans cette consultation avec nous.';

  async function remediateWithText(name, body) {
    const file = await write(name, await createUntaggedImagePDF({ heading: 'Rapport', body }));
    const analyzer = new AccessibilityAnalyzer();
    const { issues, context } = await analyzer.analyze(file, 'AA');
    return new RemediationService().remediate(file, issues, { jobId: name, context });
  }

  it('sets the language detected from the text, not English by default', async () => {
    const result = await remediateWithText('french.pdf', FRENCH);
    expect(pikepdfRead(result.remediatedPdfPath, 'str(pdf.Root.Lang)')).toBe('fr');
    expect(result.fixedIssues.find((i) => i.id === 'language-001').fixApplied).toMatch(/"fr"/);
  });

  it('leaves the language for a person when the text is too short to tell', async () => {
    const result = await remediateWithText('short.pdf', 'Invoice 2026-114');
    expect(pikepdfRead(result.remediatedPdfPath, '"/Lang" in pdf.Root')).toBe(false);
    expect(result.remainingIssues.find((i) => i.id === 'language-001').reason).toMatch(/could not be determined/);
  });
});

describe('document title (#56)', () => {
  it('uses the first heading', () => {
    expect(deriveTitle({ possibleHeadings: [{ text: 'Annual  Report 2026' }], originalFilename: 'x.pdf' }))
      .toEqual({ title: 'Annual Report 2026', source: 'the document\'s first heading' });
  });

  it('falls back to a readable file name', () => {
    expect(deriveTitle({ originalFilename: 'budget_proposal-2027.pdf' }).title).toBe('budget proposal 2027');
  });

  it('refuses to invent a title from a meaningless file name', () => {
    for (const originalFilename of ['scan0001.pdf', 'document.pdf', '2026-10-17.pdf',
      'f47ac10b-58cc-4372-a567-0e02b2c3d479.pdf', 'untitled.pdf']) {
      expect(deriveTitle({ originalFilename })).toBeNull();
    }
  });

  it('never writes the old placeholder title or a generic subject', () => {
    const source = fs.readFileSync(path.join(__dirname, '../../src/services/RemediationService.js'), 'utf8');
    expect(source).not.toMatch(/Accessible Document|processed for accessibility compliance/);
  });
});
