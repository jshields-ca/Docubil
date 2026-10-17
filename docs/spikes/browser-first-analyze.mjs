// Spike: reproduce analyze_pdf.py using only browser-capable libraries
// (pdfjs-dist + @cantoo/pdf-lib). Run in Node here; the same APIs run in a
// browser. Throwaway code kept for reference, not part of the app; see
// browser-first.md. To rerun it in a scratch directory:
//   npm i pdfjs-dist @cantoo/pdf-lib
//   node browser-first-analyze.mjs input.pdf [remediated-output.pdf]
import { readFileSync, writeFileSync } from 'node:fs';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PDFDocument, PDFName, PDFDict, PDFArray, PDFString, PDFHexString, PDFBool } from '@cantoo/pdf-lib';

function lum(r, g, b) {
  const c = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}

function walkStruct(node, out) {
  if (!node) return;
  if (node.role) {
    out.roles[node.role] = (out.roles[node.role] || 0) + 1;
    if (node.role === 'Figure') out.figures.push({ alt: node.alt ?? null });
  }
  for (const child of node.children || []) walkStruct(child, out);
}

export async function analyze(bytes) {
  const task = getDocument({ data: new Uint8Array(bytes), verbosity: 0 });
  const doc = await task.promise;
  // Catalog-level facts come from pdf-lib: it exposes the raw catalog
  // dictionary, which pdf.js deliberately doesn't.
  const lib = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  const cat = lib.catalog;
  const lang = cat.lookup(PDFName.of('Lang'));
  const markInfo = cat.lookupMaybe(PDFName.of('MarkInfo'), PDFDict);
  const marked = markInfo?.lookup(PDFName.of('Marked'));
  const hasStructTree = cat.has(PDFName.of('StructTreeRoot'));

  const outline = await doc.getOutline();
  const result = {
    isTagged: hasStructTree,
    markInfoMarked: marked instanceof PDFBool ? marked.asBoolean() : false,
    hasLanguage: !!lang,
    language: lang ? lang.decodeText?.() ?? String(lang) : null,
    hasBookmarks: !!(outline && outline.length),
    imagePages: [],
    figures: [],
    structRoles: {},
    formFields: [],
    textAnalysis: { minFontSize: 0, maxFontSize: 0, avgFontSize: 0, hasText: false },
    contrastIssues: [],
  };

  // Every terminal form field, however deeply nested: pdf.js flattens the
  // field hierarchy, which analyze_pdf.py's top-level-only loop misses.
  const fields = (await doc.getFieldObjects()) || {};
  for (const [name, widgets] of (fields instanceof Map ? fields : Object.entries(fields))) {
    const w = widgets.find((x) => x.type) || widgets[0];
    if (!w || !w.type) continue;
    result.formFields.push({ name, type: w.type, hasTooltip: false });
  }
  // Tooltips (/TU) come from widget annotations' alternativeText.
  const tooltipByName = new Map();

  const sizes = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const ops = await page.getOperatorList();
    let images = 0;
    let fill = [0, 0, 0];
    const colours = new Set();
    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject || fn === OPS.paintImageMaskXObject) images++;
      if (fn === OPS.setFillRGBColor) {
        // pdf.js normalises fill colours to a hex string
        const a = ops.argsArray[i];
        fill = typeof a[0] === 'string' ? [1, 3, 5].map((k) => parseInt(a[0].slice(k, k + 2), 16)) : a.map((v) => Math.round(v));
      }
      if (fn === OPS.showText && fill.join() !== '0,0,0') colours.add(fill.join());
    }
    for (const c of colours) {
      const [r, g, b] = c.split(',').map(Number);
      const ratio = (1.05) / (lum(r, g, b) + 0.05);
      if (ratio < 4.5) result.contrastIssues.push({ page: p, textColor: { r, g, b }, contrastRatio: +ratio.toFixed(2) });
    }
    result.imagePages.push({ page: p, imageCount: images });

    const text = await page.getTextContent();
    for (const item of text.items) {
      if (!item.str?.trim()) continue;
      const size = Math.hypot(item.transform[2], item.transform[3]);
      if (size > 0) sizes.push(size);
    }

    const tree = await page.getStructTree().catch(() => null);
    const acc = { roles: result.structRoles, figures: result.figures };
    walkStruct(tree, acc);

    for (const a of await page.getAnnotations()) {
      if (a.fieldName && a.alternativeText) tooltipByName.set(a.fieldName, a.alternativeText);
    }
  }
  for (const f of result.formFields) f.hasTooltip = tooltipByName.has(f.name);
  if (sizes.length) {
    result.textAnalysis = {
      hasText: true,
      minFontSize: +Math.min(...sizes).toFixed(1),
      maxFontSize: +Math.max(...sizes).toFixed(1),
      avgFontSize: +(sizes.reduce((a, b) => a + b, 0) / sizes.length).toFixed(1),
    };
  }
  await task.destroy();
  return result;
}

// Same fixes as remediate_pdf.py, with pdf-lib only.
export async function remediate(bytes, fixes) {
  const lib = await PDFDocument.load(bytes, { updateMetadata: false });
  const cat = lib.catalog;
  const applied = [];
  if (fixes.setLanguage) {
    cat.set(PDFName.of('Lang'), PDFString.of(fixes.setLanguage));
    applied.push(`Set document language to '${fixes.setLanguage}'`);
  }
  if (fixes.displayDocTitle) {
    const vp = cat.lookupMaybe(PDFName.of('ViewerPreferences'), PDFDict) || lib.context.obj({});
    vp.set(PDFName.of('DisplayDocTitle'), PDFBool.True);
    cat.set(PDFName.of('ViewerPreferences'), vp);
    applied.push('Set ViewerPreferences/DisplayDocTitle = true');
  }
  if (fixes.formTooltips) {
    for (const field of lib.getForm().getFields()) {
      if (!field.acroField.dict.has(PDFName.of('TU'))) {
        const label = field.getName().split('.').pop().replace(/\[\d+\]$/, '').replace(/[_-]+/g, ' ');
        field.acroField.dict.set(PDFName.of('TU'), PDFHexString.fromText(label));
        applied.push(`Added tooltip to '${field.getName()}'`);
      }
    }
  }
  return { bytes: await lib.save(), applied };
}

if (process.argv[2]) {
  const bytes = readFileSync(process.argv[2]);
  const t0 = performance.now();
  const r = await analyze(bytes);
  r.ms = Math.round(performance.now() - t0);
  if (process.argv[3]) {
    const out = await remediate(bytes, { setLanguage: 'en-US', displayDocTitle: true, formTooltips: true });
    writeFileSync(process.argv[3], out.bytes);
    r.remediation = { count: out.applied.length, sample: out.applied.slice(0, 3) };
    r.after = await analyze(out.bytes).then((a) => ({ language: a.language, tooltips: a.formFields.filter((f) => f.hasTooltip).length }));
  }
  console.log(JSON.stringify(r, (k, v) => (k === 'imagePages' ? v.reduce((s, x) => s + x.imageCount, 0) : k === 'formFields' ? `${v.length} fields, ${v.filter((f) => f.hasTooltip).length} with tooltip` : v)));
}
