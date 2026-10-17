'use strict';

/**
 * PDFs with the structures the accuracy checks care about, built with
 * pdf-lib's low-level API so the tests need no binary fixtures.
 */
const { PDFDocument, PDFName, PDFString, StandardFonts, rgb } = require('pdf-lib');

// A 1×1 grey PNG.
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNgAAAAAgABSK+kcQAAAABJRU5ErkJggg==',
  'base64'
);

/** Form fields nested under a parent, the way Acrobat and LiveCycle build them. */
async function createNestedFormPDF() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const form = pdfDoc.getForm();
  const names = ['applicant.firstName', 'applicant.date_of_birth', 'applicant.p1-t3', 'applicant.Text12'];
  names.forEach((name, i) => {
    form.createTextField(name).addToPage(page, { x: 50, y: 700 - i * 40, width: 200, height: 24 });
  });
  return Buffer.from(await pdfDoc.save());
}

/**
 * A tagged document: a structure tree with one Figure element (with or
 * without alt text) around an image, optionally missing /MarkInfo.
 */
async function createTaggedFigurePDF({ alt = 'A grey square', marked = true } = {}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const image = await pdfDoc.embedPng(PNG_1PX);
  page.drawImage(image, { x: 50, y: 600, width: 100, height: 100 });

  const ctx = pdfDoc.context;
  const figure = ctx.obj({ Type: 'StructElem', S: 'Figure', Pg: page.ref, K: 0 });
  if (alt) {
    figure.set(PDFName.of('Alt'), PDFString.of(alt));
  }
  const figureRef = ctx.register(figure);
  const doc = ctx.obj({ Type: 'StructElem', S: 'Document', K: [figureRef] });
  const docRef = ctx.register(doc);
  figure.set(PDFName.of('P'), docRef);
  const root = ctx.register(ctx.obj({ Type: 'StructTreeRoot', K: docRef }));
  doc.set(PDFName.of('P'), root);
  pdfDoc.catalog.set(PDFName.of('StructTreeRoot'), root);
  if (marked) {
    pdfDoc.catalog.set(PDFName.of('MarkInfo'), ctx.obj({ Marked: true }));
  }
  return Buffer.from(await pdfDoc.save());
}

/** An untagged document with one image and a heading-sized first line. */
async function createUntaggedImagePDF({ heading = 'Quarterly Water Quality Report', body = '' } = {}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText(heading, { x: 50, y: 740, size: 24, font });
  const lines = body.match(/.{1,90}(\s|$)/g) || [];
  lines.forEach((line, i) => page.drawText(line.trim(), { x: 50, y: 700 - i * 16, size: 11, font }));
  const image = await pdfDoc.embedPng(PNG_1PX);
  page.drawImage(image, { x: 50, y: 100, width: 100, height: 100 });
  return Buffer.from(await pdfDoc.save());
}

/**
 * An untagged text document: optional title metadata, an optional large
 * heading, body text in a given grey level (0 = black), over several pages.
 */
async function createTextPDF({ title, heading, body = '', grey = 0, pages = 1 } = {}) {
  const pdfDoc = await PDFDocument.create();
  if (title) {
    pdfDoc.setTitle(title);
  }
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const lines = body.match(/.{1,90}(\s|$)/g) || [];
  for (let p = 0; p < pages; p++) {
    const page = pdfDoc.addPage([612, 792]);
    let y = 740;
    if (heading && p === 0) {
      page.drawText(heading, { x: 50, y, size: 24, font });
      y -= 40;
    }
    for (const line of lines) {
      page.drawText(line.trim(), { x: 50, y, size: 11, font, color: rgb(grey, grey, grey) });
      y -= 16;
    }
  }
  return Buffer.from(await pdfDoc.save());
}

module.exports = {
  createNestedFormPDF,
  createTaggedFigurePDF,
  createTextPDF,
  createUntaggedImagePDF,
};
