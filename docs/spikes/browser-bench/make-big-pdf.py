"""Writes a 200-page, ~50 MB PDF (one incompressible image and 30 text lines
per page) for the browser benchmark. Usage: python3 make-big-pdf.py out.pdf"""
import os
import sys

import pikepdf

pdf = pikepdf.new()
font = pdf.make_indirect(pikepdf.Dictionary(
    Type=pikepdf.Name.Font, Subtype=pikepdf.Name.Type1, BaseFont=pikepdf.Name.Helvetica))
W, H = 300, 280
for i in range(200):
    img = pikepdf.Stream(pdf, os.urandom(W * H * 3))
    img.Type, img.Subtype = pikepdf.Name.XObject, pikepdf.Name.Image
    img.Width, img.Height, img.BitsPerComponent = W, H, 8
    img.ColorSpace = pikepdf.Name.DeviceRGB
    lines = b"".join(
        b"BT /F1 11 Tf 50 %d Td (Page %d line %d: the committee reviewed the report.) Tj ET\n"
        % (700 - 14 * j, i + 1, j) for j in range(30))
    page = pdf.add_blank_page(page_size=(612, 792))
    page.Resources = pikepdf.Dictionary(
        Font=pikepdf.Dictionary(F1=font), XObject=pikepdf.Dictionary(Im0=img))
    page.Contents = pdf.make_stream(
        b"q 300 0 0 280 150 40 cm /Im0 Do Q\nBT /F1 24 Tf 50 750 Td (Section %d) Tj ET\n" % (i + 1) + lines)
pdf.save(sys.argv[1])
