#!/usr/bin/env bash
# Regenerates the real-world exports in ../files/ from the sources here, so
# anyone can check how they were made. Not run by the tests: the PDFs are
# committed, because LibreOffice and Chromium aren't in CI and their output
# changes between versions. Last generated with LibreOffice 24.2.7,
# pandoc 3.1.3 and Chromium 141.
#
# Needs: pandoc, soffice (LibreOffice), node + playwright (for print.mjs),
# zip/unzip. Usage, from this directory: ./build.sh
set -euo pipefail
cd "$(dirname "$0")"
FILES=../files
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
export HOME="$WORK/home"  # keep LibreOffice's profile out of the real one
mkdir -p "$HOME"

TAGGED='pdf:writer_pdf_Export:{"UseTaggedPDF":{"type":"boolean","value":"true"}}'
UNTAGGED='pdf:writer_pdf_Export:{"UseTaggedPDF":{"type":"boolean","value":"false"}}'

cp chart.png "$WORK/"
pandoc en.md -o "$WORK/en.odt" --resource-path=.
pandoc fr.md -o "$WORK/fr.odt"

# pandoc writes Markdown alt text as a visible caption, not as the image's
# alternative text, so en.odt yields a Figure with no /Alt: a real-world
# case worth keeping. en-alt.odt adds the alternative text the way Writer's
# "Alternative (text only)" field stores it (svg:title on the frame).
mkdir "$WORK/alt"
(cd "$WORK/alt" && unzip -q ../en.odt \
  && sed -i 's|/></draw:frame>|/><svg:title>Bar chart of monthly lead levels, all below the safe limit</svg:title></draw:frame>|' content.xml \
  && zip -q -X -0 ../en-alt.odt mimetype && zip -q -X -r ../en-alt.odt . -x mimetype)

soffice --headless --convert-to "$TAGGED" --outdir "$WORK/tagged" "$WORK/en.odt" "$WORK/en-alt.odt" "$WORK/fr.odt" >/dev/null
soffice --headless --convert-to "$UNTAGGED" --outdir "$WORK/untagged" "$WORK/en.odt" >/dev/null
cp "$WORK/tagged/en.pdf" "$FILES/writer-tagged-caption-no-alt.pdf"
cp "$WORK/tagged/en-alt.pdf" "$FILES/writer-tagged-alt.pdf"
cp "$WORK/tagged/fr.pdf" "$FILES/writer-tagged-fr.pdf"
cp "$WORK/untagged/en.pdf" "$FILES/writer-untagged.pdf"

node print.mjs "$(pwd)/de.html" "$FILES/chromium-tagged-de.pdf" "$FILES/chromium-untagged-de.pdf"
echo "Regenerated real-world exports in $FILES"
