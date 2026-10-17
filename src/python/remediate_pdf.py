#!/usr/bin/env python3
"""
PDF Accessibility Remediator
Applies structural fixes using pikepdf that pdf-lib cannot perform.
Reads fixes specification from argv as JSON and outputs result JSON to stdout.
"""

import sys
import json
import os

from pdf_structure import has_tooltip, human_label, iter_terminal_fields


def remediate(input_path, output_path, fixes):
    """
    Apply accessibility fixes to a PDF using pikepdf.

    fixes dict keys (all optional, default False/None):
      setLanguage      (str)  - BCP-47 language tag to set as /Lang, e.g. "en"
      markTagged       (bool) - Set MarkInfo/Marked = true, only if the document
                                actually has a structure tree
      displayDocTitle  (bool) - Set ViewerPreferences/DisplayDocTitle = true
      formTooltips     (bool) - Add a /TU tooltip to fields that lack one, where
                                the field's name is a readable label

    Fixes that can't be applied honestly are listed in "skipped" with a reason.
    """
    result = {
        "success": False,
        "fixesApplied": [],
        "skipped": [],
        "tooltipFields": [],
        "errors": [],
    }

    try:
        import pikepdf
    except ImportError:
        result["errors"].append(
            "pikepdf not installed - run: pip install pikepdf"
        )
        print(json.dumps(result))
        return result

    try:
        # RemediationService fixes the file in place (input and output are the
        # same path), so pikepdf must be allowed to save over what it opened.
        with pikepdf.open(input_path, allow_overwriting_input=True) as pdf:

            # -- Set document language --
            if fixes.get("setLanguage"):
                lang = str(fixes["setLanguage"]).strip()
                if lang:
                    pdf.Root["/Lang"] = pikepdf.String(lang)
                    result["fixesApplied"].append(
                        "Set document language to '" + lang + "'"
                    )

            # -- Mark document as tagged --
            # Only when tags exist: the flag tells assistive technology to trust
            # the structure tree, so setting it on an untagged file is a false claim.
            if fixes.get("markTagged"):
                if "/StructTreeRoot" not in pdf.Root:
                    result["skipped"].append(
                        "MarkInfo/Marked not set: the document has no structure tree"
                    )
                else:
                    if "/MarkInfo" not in pdf.Root:
                        pdf.Root["/MarkInfo"] = pikepdf.Dictionary(Marked=True)
                    else:
                        pdf.Root["/MarkInfo"]["/Marked"] = True
                    result["fixesApplied"].append("Set MarkInfo/Marked = true")

            # -- Set DisplayDocTitle so title bar shows PDF title --
            if fixes.get("displayDocTitle"):
                if "/ViewerPreferences" not in pdf.Root:
                    pdf.Root["/ViewerPreferences"] = pikepdf.Dictionary(
                        DisplayDocTitle=True
                    )
                else:
                    pdf.Root["/ViewerPreferences"]["/DisplayDocTitle"] = True
                result["fixesApplied"].append(
                    "Set ViewerPreferences/DisplayDocTitle = true"
                )

            # -- Add tooltips (/TU) to form fields that lack them --
            # Only from a readable field name: "Please enter: p1-t3[0]" would be
            # worse than nothing, so those fields stay flagged for a person.
            if fixes.get("formTooltips") and "/AcroForm" in pdf.Root:
                try:
                    unlabelled = 0
                    for name, field in iter_terminal_fields(pdf.Root["/AcroForm"]):
                        if has_tooltip(field):
                            continue
                        label = human_label(name)
                        if label is None:
                            unlabelled += 1
                            continue
                        field["/TU"] = pikepdf.String(label)
                        result["tooltipFields"].append(name)
                    if result["tooltipFields"]:
                        result["fixesApplied"].append(
                            f"Added tooltips to {len(result['tooltipFields'])} form field(s)"
                        )
                    if unlabelled:
                        result["skipped"].append(
                            f"{unlabelled} form field(s) have no readable name to use as a tooltip"
                        )
                except Exception as e:
                    result["errors"].append("Form tooltip fix error: " + str(e))

            pdf.save(output_path)
            result["success"] = True

    except Exception as e:
        result["errors"].append("Remediation error: " + str(e))

    return result


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(
            json.dumps({
                "error": "Usage: remediate_pdf.py <input_path> <output_path> <fixes_json>"
            })
        )
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    fixes_raw = sys.argv[3]

    if not os.path.isfile(input_path):
        print(json.dumps({"error": "Input file not found: " + input_path}))
        sys.exit(1)

    try:
        fixes = json.loads(fixes_raw)
    except json.JSONDecodeError as e:
        print(json.dumps({"error": "Invalid fixes JSON: " + str(e)}))
        sys.exit(1)

    try:
        output = remediate(input_path, output_path, fixes)
        print(json.dumps(output))
    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)
