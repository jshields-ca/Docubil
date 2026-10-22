---
"docubil": patch
---

**Improved:** Installing from source with `./install.sh` no longer needs admin rights. Python packages go into a private environment inside the Docubil folder, and nothing is written anywhere else.

<details>
<summary>Technical details</summary>

`install.sh` now checks for Node 24+ and Python 3.11+ (with `venv`), runs `npm ci`, builds the UI, creates `.venv/`, installs `requirements.txt` into it, and sets `PYTHON_PATH` in `.env` to the venv's interpreter. The old script ran a system-wide `pip3 install`, which needs admin rights on many systems and is refused outright on PEP 668 distributions (Debian 12+, Ubuntu 23.04+). It also still checked for Node 16. `start-demo.sh` is removed.

</details>
