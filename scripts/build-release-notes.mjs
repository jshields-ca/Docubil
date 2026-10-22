// Builds a GitHub Release body for one version. Adapted from LatestArr's
// script of the same name. CHANGELOG.md stays the detailed record (Technical
// details included); the release body is the short, user-facing version:
//
//   ## Highlights          <- .github/release-highlights/vX.Y.Z.md, if present
//   ## What's changed      <- CHANGELOG.md section, <details> blocks stripped
//   ## Upgrading           <- docker pull / compose lines
//   Full changelog link    <- previous tag ... this tag
//
// Usage:
//   node scripts/build-release-notes.mjs <version> [previousTag]
//   node scripts/build-release-notes.mjs --check-highlights <version>
// <version> is 1.2.3 (a leading "v" is accepted and ignored).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const IMAGE = "ghcr.io/jshields-ca/docubil";

export function highlightsPath(version) {
  return path.join(rootDir, ".github", "release-highlights", `v${version}.md`);
}

// HTML comments are stripped so the template (all comments) counts as "not
// written yet" rather than publishing an empty Highlights section.
function stripHtmlComments(text) {
  let previous;
  do {
    previous = text;
    text = text.replace(/<!--[\s\S]*?-->/g, "");
  } while (text !== previous);
  const unclosed = text.indexOf("<!--");
  return unclosed === -1 ? text : text.slice(0, unclosed);
}

export function readHighlights(version) {
  const file = highlightsPath(version);
  if (!existsSync(file)) {return null;}
  const content = stripHtmlComments(readFileSync(file, "utf8")).trim();
  return content || null;
}

function readChangelogSection(version) {
  const lines = readFileSync(path.join(rootDir, "CHANGELOG.md"), "utf8").split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith(`## [${version}]`));
  if (start === -1) {throw new Error(`No CHANGELOG.md section found for version ${version}`);}
  const next = lines.findIndex((line, i) => i > start && line.startsWith("## ["));
  return lines
    .slice(start + 1, next === -1 ? undefined : next)
    .join("\n")
    .trim();
}

function stripTechnicalDetails(section) {
  return section
    .replace(/[ \t]*<details>[\s\S]*?<\/details>/g, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function git(args) {
  try {
    return execFileSync("git", args, { cwd: rootDir, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function compareVersions(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {if (pa[i] !== pb[i]) {return pa[i] - pb[i];}}
  return 0;
}

function findPreviousTag(version) {
  const tags = git(["tag", "--list", "v*"]).split("\n").filter((t) => /^v\d+\.\d+\.\d+$/.test(t));
  const older = tags
    .map((t) => t.slice(1))
    .filter((v) => compareVersions(v, version) < 0)
    .sort(compareVersions);
  return older.length ? `v${older[older.length - 1]}` : null;
}

function repoSlug() {
  const pkg = JSON.parse(readFileSync(path.join(rootDir, "package.json"), "utf8"));
  const url = typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url;
  return url?.match(/github\.com[/:]([^/]+\/[^/.]+)/)?.[1];
}

export function buildReleaseNotes(version, previousTag = findPreviousTag(version)) {
  const repo = repoSlug();
  const tag = `v${version}`;
  const parts = [];

  const highlights = readHighlights(version);
  if (highlights) {parts.push(`## Highlights\n\n${highlights}`);}

  parts.push(`## What's changed\n\n${stripTechnicalDetails(readChangelogSection(version))}`);

  parts.push(
    `## Upgrading\n\n\`\`\`bash\ndocker pull ${IMAGE}:${version}\n\`\`\`\n\n` +
      `Or, with Docker Compose: \`docker compose pull && docker compose up -d\`. ` +
      `Check the Highlights above for anything to do before upgrading.`,
  );

  if (repo && previousTag) {
    parts.push(
      `**Full changelog** (including technical details): [${previousTag}...${tag}](https://github.com/${repo}/compare/${previousTag}...${tag}) · [CHANGELOG.md](https://github.com/${repo}/blob/${tag}/CHANGELOG.md)`,
    );
  }

  return parts.join("\n\n") + "\n";
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const checking = args[0] === "--check-highlights";
  const version = (checking ? args[1] : args[0])?.replace(/^v/, "");
  if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
    console.error(
      "Usage: node build-release-notes.mjs <version> [previousTag]\n" +
        "       node build-release-notes.mjs --check-highlights <version>\n" +
        `Expected a version like 1.2.3, got "${version ?? ""}"`,
    );
    process.exit(1);
  }
  if (checking) {
    if (!readHighlights(version)) {
      const rel = path.relative(rootDir, highlightsPath(version)).replace(/\\/g, "/");
      console.error(
        `Release highlights for v${version} are missing or still only the template. Write them in ${rel} (see RELEASING.md, "Release highlights").`,
      );
      process.exit(1);
    }
    console.log(`Release highlights for v${version} found.`);
  } else {
    const previousTag = args[1];
    if (previousTag && !/^v\d+\.\d+\.\d+$/.test(previousTag)) {
      console.error(`Expected a previous tag like v1.2.3, got "${previousTag}"`);
      process.exit(1);
    }
    try {
      process.stdout.write(buildReleaseNotes(version, previousTag || undefined));
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
  }
}
