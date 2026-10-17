"""
Helpers shared by analyze_pdf.py and remediate_pdf.py for walking a PDF's
form-field hierarchy and structure tree with pikepdf.
"""

import re

import pikepdf

# Guards against malformed files with very deep or cyclic trees.
MAX_DEPTH = 64
MAX_NODES = 20000

# Machine-generated names that say nothing to a screen reader user,
# e.g. "Text12", "Check Box3", "undefined_2".
GENERIC_NAME = re.compile(
    r"^(text|field|check ?box|checkbox|button|combo ?box|list ?box|radio( button)?|"
    r"dropdown|signature|untitled|undefined|form|group|topmostsubform|page|p|t|f)"
    r"( ?\d+)?$",
    re.IGNORECASE,
)


def _text(value):
    """A PDF string as Python text, or "" for anything else (or nothing)."""
    if value is None:
        return ""
    try:
        return str(value).strip()
    except Exception:
        return ""


def iter_terminal_fields(acroform):
    """
    Yield (full_name, field_dict) for every terminal form field.

    Fields nest: a parent such as "topmostSubform[0]" holds "Page1[0]",
    which holds the real inputs. A terminal field is one whose /Kids are
    widget annotations (which have no /T of their own) or that has no /Kids.
    The full name joins each level's /T with ".", as viewers do.
    """
    seen = set()
    count = 0

    def walk(node, prefix, depth):
        nonlocal count
        if depth > MAX_DEPTH or count > MAX_NODES:
            return
        key = node.objgen if node.is_indirect else id(node)
        if key in seen:
            return
        seen.add(key)
        count += 1

        partial = _text(node.get("/T"))
        name = ".".join(p for p in (prefix, partial) if p)
        kids = node.get("/Kids")
        # Malformed files can hold nulls or non-dictionaries here; skip them
        # rather than lose every other field.
        child_fields = [
            k for k in (kids if kids is not None else [])
            if isinstance(k, pikepdf.Dictionary) and "/T" in k
        ]
        if not child_fields:
            yield name, node
            return
        for kid in child_fields:
            yield from walk(kid, name, depth + 1)

    for field in acroform.get("/Fields", []):
        if isinstance(field, pikepdf.Dictionary):
            yield from walk(field, "", 0)


def has_tooltip(field):
    return bool(_text(field.get("/TU")))


def human_label(full_name):
    """
    A tooltip derived from a field's own name, or None when the name is an
    internal identifier that would mean nothing read aloud ("p1-t3[0]",
    "Text12"). "FirstName", "date_of_birth" and "ZIPCode" become
    "First name", "Date of birth" and "ZIP code"; acronyms stay upper-case.
    """
    last = full_name.split(".")[-1]
    last = re.sub(r"\[\d+\]$", "", last)
    words = re.sub(r"([a-z])([A-Z])", r"\1 \2", last)
    words = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1 \2", words)  # "ZIPCode" -> "ZIP Code"
    words = re.sub(r"[_\-]+", " ", words).strip()
    tokens = words.split()
    if not tokens or GENERIC_NAME.match(words):
        return None
    if any(not t.isalpha() for t in tokens):
        return None
    if max(len(t) for t in tokens) < 3:
        return None
    # Keep acronyms ("SSN", "ZIP") as written; lower-case everything else.
    label = " ".join(t if t.isupper() and len(t) > 1 else t.lower() for t in tokens)
    return label[0].upper() + label[1:]


def _role_map(pdf):
    try:
        role_map = pdf.Root["/StructTreeRoot"].get("/RoleMap")
        if role_map is None:
            return {}
        return {str(k): str(v) for k, v in role_map.items()}
    except Exception:
        return {}


def collect_figures(pdf):
    """
    Return [{"page": int or None, "hasAlt": bool}] for every Figure element
    in the structure tree (custom roles mapped through /RoleMap). Alt text
    is /Alt, or /ActualText, on the element itself.
    """
    if "/StructTreeRoot" not in pdf.Root:
        return []

    page_numbers = {}
    for index, page in enumerate(pdf.pages, 1):
        try:
            page_numbers[page.obj.objgen] = index
        except Exception:
            pass

    role_map = _role_map(pdf)
    figures = []
    seen = set()

    def resolve_role(role):
        # RoleMap can chain (MyFig -> Fig -> Figure); follow a few steps.
        for _ in range(5):
            if role in role_map:
                role = role_map[role]
            else:
                break
        return role

    def walk(node, page, depth):
        if depth > MAX_DEPTH or len(seen) > MAX_NODES:
            return
        if isinstance(node, pikepdf.Array):
            for item in node:
                walk(item, page, depth + 1)
            return
        if not isinstance(node, pikepdf.Dictionary):
            return  # a marked-content ID (an integer): no structure below it
        key = node.objgen if getattr(node, "is_indirect", False) else id(node)
        if key in seen:
            return
        seen.add(key)

        pg = node.get("/Pg")
        if pg is not None:
            try:
                page = page_numbers.get(pg.objgen, page)
            except Exception:
                pass

        role = node.get("/S")
        if role is not None and resolve_role(str(role)) == "/Figure":
            figures.append({
                "page": page,
                "hasAlt": bool(_text(node.get("/Alt")) or _text(node.get("/ActualText"))),
            })

        kids = node.get("/K")
        if kids is not None:
            walk(kids, page, depth + 1)

    try:
        walk(pdf.Root["/StructTreeRoot"].get("/K"), None, 0)
    except Exception:
        pass
    return figures
