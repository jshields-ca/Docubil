#!/usr/bin/env bash
# Installs Docubil from a source checkout for the current user only: no sudo,
# nothing written outside this directory. Node packages go in node_modules/,
# Python packages in a project-local virtual environment (.venv/), and .env
# points the server at that environment.
#
#   ./install.sh          install, then print how to start
#   ./install.sh --start  install, then start the server
set -euo pipefail

cd "$(dirname "$0")"

fail() { echo "✗ $*" >&2; exit 1; }

# ── Prerequisites ────────────────────────────────────────────────────────────
command -v node >/dev/null || fail "Node.js 24 or newer is required: https://nodejs.org/ (the .tar.xz/.zip downloads need no admin rights)"
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
[ "$NODE_MAJOR" -ge 24 ] || fail "Node.js 24 or newer is required (found $(node -v))."
command -v npm >/dev/null || fail "npm is required (it ships with Node.js)."

PYTHON=${PYTHON:-python3}
command -v "$PYTHON" >/dev/null || fail "Python 3.11 or newer is required (set PYTHON=/path/to/python3 to use another)."
"$PYTHON" -c 'import sys; sys.exit(sys.version_info < (3, 11))' \
  || fail "Python 3.11 or newer is required (found $("$PYTHON" --version 2>&1))."
"$PYTHON" -c 'import venv' 2>/dev/null \
  || fail "Python's venv module is missing (on Debian/Ubuntu it's the python3-venv package)."

echo "✓ Node $(node -v), $("$PYTHON" --version 2>&1)"

# ── Dependencies ─────────────────────────────────────────────────────────────
echo "→ Installing Node packages"
npm ci --no-audit --no-fund --ignore-scripts

echo "→ Building the web interface"
npm run build

echo "→ Creating a Python environment in .venv/"
[ -x .venv/bin/python ] || "$PYTHON" -m venv .venv
.venv/bin/python -m pip install --quiet --upgrade pip
.venv/bin/python -m pip install --quiet -r requirements.txt

# ── Configuration ────────────────────────────────────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  echo "→ Created .env from .env.example"
fi
VENV_PYTHON="$(pwd)/.venv/bin/python"
if grep -q '^PYTHON_PATH=' .env; then
  sed -i.bak "s|^PYTHON_PATH=.*|PYTHON_PATH=$VENV_PYTHON|" .env && rm -f .env.bak
else
  echo "PYTHON_PATH=$VENV_PYTHON" >> .env
fi
mkdir -p uploads output reports

PORT=$(grep -E '^PORT=' .env | cut -d= -f2 | tr -d ' ' || true)
echo
echo "✓ Docubil is installed. Start it with:  npm start"
echo "  then open http://localhost:${PORT:-3000}"

if [ "${1:-}" = "--start" ]; then
  exec npm start
fi
