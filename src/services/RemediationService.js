'use strict';

const fs = require('fs').promises;
const path = require('path');
const { PDFDocument } = require('@cantoo/pdf-lib');
const { v4: uuidv4 } = require('uuid');
const { remediatePDF } = require('./PythonBridge');
const { detectLanguage } = require('./languageDetect');
const logger = require('../logger');

class RemediationService {
  constructor() {
    this.outputDir = process.env.OUTPUT_DIR || './output';
    this._ensureOutputDir();
  }

  async _ensureOutputDir() {
    await fs.mkdir(this.outputDir, { recursive: true }).catch(() => {});
  }

  /**
   * Remediate accessibility issues in a PDF.
   *
   * Pipeline:
   *   1. pdf-lib applies metadata fixes (title, subject, creator, producer, keywords).
   *   2. Python/pikepdf applies structural fixes (language, MarkInfo, DisplayDocTitle,
   *      form field tooltips) that pdf-lib cannot perform.
   *   3. Remaining issues that cannot be auto-fixed are returned with explanations.
   *
   * @param {string}  filePath  - Path to the original uploaded PDF.
   * @param {Array}   issues    - Issue objects from AccessibilityAnalyzer.
   * @param {object}  options   - { autoFix: boolean, jobId: string, context: object }
   *   context (all optional) is what the fixes may draw on instead of guessing:
   *   { textContent, possibleHeadings: [{ text }], originalFilename }.
   * @returns {Promise<object>} Remediation result.
   */
  async remediate(filePath, issues, options = {}) {
    const { autoFix = true, jobId, context = {} } = options;

    logger.info({ filePath, issueCount: issues.length, autoFix }, 'Starting remediation');

    const outputFileName = jobId ? `${jobId}-remediated.pdf` : `${uuidv4()}-remediated.pdf`;
    const outputPath = path.join(this.outputDir, outputFileName);

    const fixedIssues = [];
    const remainingIssues = [];

    // ── Step 1: pdf-lib metadata pass ──────────────────────────────────────────
    let pdfBytes;
    try {
      const dataBuffer = await fs.readFile(filePath);
      const pdfDoc = await PDFDocument.load(dataBuffer, { ignoreEncryption: true });

      const metadataIssues = issues.filter((i) => i.id.startsWith('metadata-'));
      this._applyMetadataFixes(pdfDoc, metadataIssues, fixedIssues, context);

      pdfBytes = await pdfDoc.save();
    } catch (err) {
      logger.error({ err: err.message }, 'pdf-lib metadata pass failed');
      throw new Error(`Metadata remediation failed: ${err.message}`, { cause: err });
    }

    // Write the metadata-fixed PDF to the output path so Python can read it
    await fs.writeFile(outputPath, pdfBytes);

    // ── Step 2: Python/pikepdf structural pass ──────────────────────────────────
    if (autoFix) {
      const pythonFixes = this._buildPythonFixes(issues, context);
      const hasPythonWork = Object.keys(pythonFixes).length > 0;

      if (hasPythonWork) {
        try {
          const pyResult = await remediatePDF(outputPath, outputPath, pythonFixes);

          if (pyResult.success) {
            // Map applied fix descriptions back to issue IDs
            this._reconcilePythonFixes(issues, pyResult, pythonFixes, fixedIssues, remainingIssues);
          } else {
            logger.warn(
              { errors: pyResult.errors },
              'Python remediation reported errors; structural fixes may be incomplete'
            );
            // Move unfixed structural issues to remaining
            this._moveUnfixedToRemaining(issues, fixedIssues, remainingIssues,
              'Python remediation encountered errors — structural fixes require manual intervention');
          }
        } catch (err) {
          logger.warn({ err: err.message }, 'Python remediation unavailable; skipping structural fixes');
          this._moveUnfixedToRemaining(issues, fixedIssues, remainingIssues,
            'Python is not available — install Python 3 with pikepdf to enable structural fixes');
        }
      }
    }

    // ── Step 3: Categorise remaining issues ────────────────────────────────────
    for (const issue of issues) {
      const alreadyFixed = fixedIssues.some((f) => f.id === issue.id);
      const alreadyRemaining = remainingIssues.some((r) => r.id === issue.id);
      if (alreadyFixed || alreadyRemaining) { continue; }

      let reason;
      if (!autoFix) {
        reason = 'Auto-fix was not requested';
      } else if (issue.id.startsWith('alt-text-')) {
        reason = 'Alternative text requires human judgment about image content';
      } else if (issue.id.startsWith('contrast-')) {
        reason = 'Color contrast corrections require manual editing in the source application';
      } else if (issue.id.startsWith('reading-order-') || issue.id === 'reading-order-001') {
        reason = 'Reading order remediation requires rebuilding the document structure tree, ' +
          'which must be done in a PDF authoring tool (Adobe Acrobat Pro, Foxit, etc.)';
      } else if (issue.id.startsWith('heading-')) {
        reason = 'Heading structure must be established in the source document and re-exported';
      } else if (issue.id === 'language-001') {
        reason = 'The document language could not be determined with confidence from its text. ' +
          'Set it in your PDF editor (Document Properties → Advanced → Language)';
      } else if (issue.id === 'metadata-001') {
        reason = 'No heading or meaningful file name to take a title from. Add a descriptive ' +
          'title in your PDF editor (Document Properties → Description → Title)';
      } else if (issue.id === 'metadata-002') {
        reason = 'A subject has to describe this particular document, so Docubil leaves it ' +
          'for you to write';
      } else if (!issue.fixable) {
        reason = 'This issue requires manual review and cannot be automatically corrected';
      } else {
        reason = 'Issue was not addressed in this remediation pass';
      }

      remainingIssues.push({ ...issue, reason });
    }

    const totalIssues = issues.length;
    const fixedCount = fixedIssues.length;

    logger.info(
      { outputPath, fixedCount, remainingCount: remainingIssues.length },
      'Remediation complete'
    );

    return {
      fixedIssues,
      remainingIssues,
      remediatedPdfPath: outputPath,
      summary: {
        totalIssues,
        fixedCount,
        remainingCount: remainingIssues.length,
        autoFixPercentage: totalIssues > 0
          ? Math.round((fixedCount / totalIssues) * 100)
          : 0,
      },
    };
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /**
   * Apply metadata fixes via pdf-lib. A title is taken from the document
   * itself, never invented; the subject is left for a person to write.
   */
  _applyMetadataFixes(pdfDoc, metadataIssues, fixedIssues, context) {
    // Always stamp creator/producer so the tool is identified
    pdfDoc.setCreator('Docubil');
    pdfDoc.setProducer('Docubil Accessibility Remediation Service');
    pdfDoc.setModificationDate(new Date());

    if (!metadataIssues.some((issue) => issue.id === 'metadata-001')) {
      return;
    }
    const derived = deriveTitle(context);
    if (!derived) {
      return;
    }
    pdfDoc.setTitle(derived.title);
    fixedIssues.push({
      ...metadataIssues.find((issue) => issue.id === 'metadata-001'),
      fixApplied: `Document title set to "${derived.title}"`,
      fixDetails:
        `Set the PDF /Title from ${derived.source}. Check that it describes the document, ` +
        'and change it in your PDF editor if not.',
    });
  }

  /**
   * Determine which fixes Python should apply based on the outstanding issues.
   */
  _buildPythonFixes(issues, context = {}) {
    const fixes = {};
    const ids = new Set(issues.map((i) => i.id));

    if (ids.has('language-001')) {
      const lang = detectLanguage(context.textContent);
      if (lang) {
        fixes.setLanguage = lang;
      }
    }

    if (ids.has('structure-001')) {
      // Python only sets MarkInfo/Marked when a structure tree exists; on an
      // untagged document it reports the fix as skipped instead.
      fixes.markTagged = true;
      fixes.displayDocTitle = true;
    } else if (ids.has('metadata-001')) {
      // Even without a tagging issue, enabling DisplayDocTitle is always beneficial
      fixes.displayDocTitle = true;
    }

    // Add tooltips to form fields that lack them
    const hasFormTooltipIssue = issues.some(
      (i) => i.id.startsWith('form-tooltip-') || i.id === 'form-001'
    );
    if (hasFormTooltipIssue) {
      fixes.formTooltips = true;
    }

    return fixes;
  }

  /**
   * After Python runs, mark as fixed only the issues whose fix was actually
   * applied, and explain the ones Python skipped.
   */
  _reconcilePythonFixes(issues, pyResult, pythonFixes, fixedIssues, remainingIssues) {
    const applied = pyResult.fixesApplied || [];
    const skipped = pyResult.skipped || [];
    const tooltipFields = new Set(pyResult.tooltipFields || []);

    for (const issue of issues) {
      const alreadyFixed = fixedIssues.some((f) => f.id === issue.id);
      if (alreadyFixed) { continue; }

      if (issue.id === 'language-001' && pythonFixes.setLanguage &&
          applied.some((d) => d.toLowerCase().includes('language'))) {
        fixedIssues.push({
          ...issue,
          fixApplied: `Document language set to "${pythonFixes.setLanguage}"`,
          fixDetails:
            `Detected the language from the document's text and set the PDF catalog /Lang to ` +
            `"${pythonFixes.setLanguage}", so screen readers use the right voice and pronunciation.`,
        });
      }

      if (issue.id === 'structure-001') {
        if (applied.some((d) => d.includes('MarkInfo'))) {
          fixedIssues.push({
            ...issue,
            fixApplied: 'Tagged-PDF flag set; DisplayDocTitle enabled',
            fixDetails:
              'The document already had a structure tree but did not declare it. Set ' +
              '/MarkInfo/Marked = true so assistive technology uses those tags, and ' +
              '/ViewerPreferences/DisplayDocTitle = true.',
          });
        } else if (skipped.some((d) => d.includes('MarkInfo'))) {
          remainingIssues.push({
            ...issue,
            reason:
              'The document has no tags at all. Tagging needs a person, or re-exporting from ' +
              'the source application with "tagged PDF" or "accessibility" turned on',
          });
        }
      }

      if (issue.id.startsWith('form-tooltip-')) {
        const fieldName = issue.id.slice('form-tooltip-'.length);
        if (tooltipFields.has(fieldName)) {
          fixedIssues.push({
            ...issue,
            fixApplied: 'Tooltip (/TU) added from the field\'s name',
            fixDetails:
              'The field\'s name was readable, so it was used as the tooltip screen readers ' +
              'announce. Check it matches the label people see on the form.',
          });
        } else {
          remainingIssues.push({
            ...issue,
            reason:
              'The field\'s internal name doesn\'t describe it, so no tooltip was generated. ' +
              'Add one in your PDF editor (field Properties → General → Tooltip)',
          });
        }
      }
    }
  }

  /**
   * Move issues that were not fixed (and weren't already in fixedIssues)
   * to remainingIssues with the provided reason.
   */
  _moveUnfixedToRemaining(issues, fixedIssues, remainingIssues, reason) {
    for (const issue of issues) {
      const alreadyFixed = fixedIssues.some((f) => f.id === issue.id);
      const alreadyRemaining = remainingIssues.some((r) => r.id === issue.id);
      if (!alreadyFixed && !alreadyRemaining && issue.fixable) {
        remainingIssues.push({ ...issue, reason });
      }
    }
  }
}

/**
 * A title taken from the document itself: its first heading, else its file
 * name when that reads like words. Returns null rather than inventing one.
 */
function deriveTitle(context = {}) {
  const heading = (context.possibleHeadings || [])
    .map((h) => (h.text || '').replace(/\s+/g, ' ').trim())
    .find((text) => text.length >= 3 && text.length <= 120 && /\p{L}{3}/u.test(text));
  if (heading) {
    return { title: heading, source: 'the document\'s first heading' };
  }

  const name = (context.originalFilename || '')
    .replace(/\.pdf$/i, '')
    .replace(/[_\-.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // "scan0001", "document", "untitled", a UUID or a date say nothing
  const meaningless = /^(scan|document|untitled|file|download|print|img|image|doc)?\s*[\d\s]*$/i;
  const words = name.match(/\p{L}{3,}/gu) || [];
  if (name && !meaningless.test(name) && words.length >= 1 && !/^[0-9a-f]{8} [0-9a-f]{4}/i.test(name)) {
    return { title: name, source: 'its file name' };
  }
  return null;
}

module.exports = RemediationService;
module.exports.deriveTitle = deriveTitle;
