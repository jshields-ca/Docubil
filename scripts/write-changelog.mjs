// Writes the next CHANGELOG.md entry from the pending .changeset/*.md files,
// before `changeset version` deletes them. Adapted from LatestArr's script of
// the same name. Docubil is a single package, so Changesets' own changelog
// writer is turned off (.changeset/config.json) and this script owns the
// root CHANGELOG.md: one entry per version, grouped by the bold category tag
// each changeset starts with, each bullet linked to the PR that added it.
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCommitInfo } from "@changesets/get-github-info";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const changesetDir = path.join(rootDir, ".changeset");
const changelogPath = path.join(rootDir, "CHANGELOG.md");
const rootPkgPath = path.join(rootDir, "package.json");

// Matches the category tags CONTRIBUTING.md's "Writing a changeset" section
// asks every changeset to start with. Security comes first: for a tool people
// trust with their documents, it's the section a reader most needs to see.
// A changeset without a recognised tag still renders, under "Other", rather
// than being silently dropped.
const CATEGORY_ORDER = ["Security", "New", "Improved", "Fixed", "Other"];
const TAG_PATTERN = /\*\*(Security|New|Improved|Fixed):\*\*\s*/g;

function parseChangeset(filePath) {
  // Windows checkouts may have CRLF line endings.
  const raw = readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {return null;}
  const [, frontmatter, body] = match;
  const bumps = [...frontmatter.matchAll(/"[^"]+":\s*(major|minor|patch)/g)].map((m) => m[1]);
  return { bumps, summary: body.trim() };
}

function bumpVersion(version, bumpType) {
  const [major, minor, patch] = version.split(".").map(Number);
  if (bumpType === "major") {return `${major + 1}.0.0`;}
  if (bumpType === "minor") {return `${major}.${minor + 1}.0`;}
  return `${major}.${minor}.${patch + 1}`;
}

// PRs are squash-merged, so the commit that added a changeset file (not a
// later edit to its wording) is the one that identifies its PR. Returns null
// rather than throwing, e.g. for a changeset not yet committed locally.
function findIntroducingCommit(filePath) {
  try {
    const out = execFileSync("git", ["log", "--diff-filter=A", "-1", "--format=%H", "--", filePath], {
      cwd: rootDir,
      encoding: "utf8",
    }).trim();
    return out || null;
  } catch {
    return null;
  }
}

// Best-effort only: no GITHUB_TOKEN (a local dry run), a network hiccup, or
// GitHub not yet indexing a fresh commit all degrade to "no link", never to
// a failed release.
async function resolvePrLink(filePath, repo) {
  if (!repo || !process.env.GITHUB_TOKEN) {return null;}
  const commit = findIntroducingCommit(filePath);
  if (!commit) {return null;}
  try {
    const info = await getCommitInfo({ repo, commit });
    return info?.pull ? { number: info.pull.number, url: info.pull.url } : null;
  } catch (err) {
    console.warn(`Couldn't resolve a PR link for ${path.basename(filePath)}: ${err.message}`);
    return null;
  }
}

// Splits a changeset body into one entry per category tag: its category, its
// plain-language lede (the first paragraph, kept on one line with the PR
// link), what follows it (bullets and paragraphs, as written), and the
// <details> technical block if there is one. A body with two tags becomes an
// entry under each heading; the details block stays with the first.
function splitChangeset(summary) {
  const text = summary.replace(/\r\n/g, "\n").trim();
  const detailsIndex = text.indexOf("<details>");
  const ledePart = (detailsIndex === -1 ? text : text.slice(0, detailsIndex)).trim();
  const details = detailsIndex === -1 ? "" : text.slice(detailsIndex).trim();
  const tags = [...ledePart.matchAll(TAG_PATTERN)];
  const parts =
    tags.length === 0 || tags[0].index !== 0
      ? [{ category: "Other", body: ledePart }]
      : tags.map((tag, i) => ({
          category: tag[1],
          // A tag that opens a bullet ("- **Fixed:** ...") leaves that
          // bullet's dash behind at the end of the previous part.
          body: ledePart
            .slice(tag.index + tag[0].length, tags[i + 1]?.index)
            .replace(/\n[ \t]*-[ \t]*$/, "")
            .trim(),
        }));
  return parts.map(({ category, body }, i) => {
    const lines = body.split("\n");
    // The lede runs until a blank line or the first bullet.
    const end = lines.findIndex((line, n) => n > 0 && (line.trim() === "" || /^\s*[-*] /.test(line)));
    const ledeLines = end === -1 ? lines : lines.slice(0, end);
    return {
      category,
      lede: ledeLines.map((line) => line.trim()).join(" "),
      more: end === -1 ? "" : lines.slice(end).join("\n").trim(),
      details: i === 0 ? details : "",
    };
  });
}

// Indents a block so it belongs to the list item above it.
function indent(block) {
  return block
    .split("\n")
    .map((line) => (line.trim() ? `  ${line}` : ""))
    .join("\n");
}

function formatBullet({ lede, more, details }, prLink) {
  const link = prLink ? ` ([#${prLink.number}](${prLink.url}))` : "";
  return [`- ${lede}${link}`, more && indent(more), details && indent(details)].filter(Boolean).join("\n\n");
}

// "https://github.com/owner/repo.git" -> "owner/repo"
function repoSlug(pkg) {
  const url = typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url;
  return url?.match(/github\.com[/:]([^/]+\/[^/.]+)/)?.[1];
}

const files = readdirSync(changesetDir)
  .filter((f) => f.endsWith(".md") && f !== "README.md")
  .sort();

const changesets = files
  .map((f) => ({ file: f, ...parseChangeset(path.join(changesetDir, f)) }))
  .filter((c) => c && c.summary && c.summary.length > 0);

if (changesets.length === 0) {
  console.log("No pending changesets — nothing to write to CHANGELOG.md");
  process.exit(0);
}

const highestBump = changesets.some((c) => c.bumps.includes("major"))
  ? "major"
  : changesets.some((c) => c.bumps.includes("minor"))
    ? "minor"
    : "patch";

const rootPkg = JSON.parse(readFileSync(rootPkgPath, "utf8"));
const newVersion = bumpVersion(rootPkg.version, highestBump);
const today = new Date().toISOString().slice(0, 10);
const repo = repoSlug(rootPkg);

let linksResolved = 0;
const entries = [];
for (const c of changesets) {
  const prLink = await resolvePrLink(path.join(changesetDir, c.file), repo);
  if (prLink) {linksResolved++;}
  for (const split of splitChangeset(c.summary)) {
    entries.push({ ...split, bullet: formatBullet(split, prLink) });
  }
}

const byCategory = new Map();
for (const entry of entries) {
  if (!byCategory.has(entry.category)) {byCategory.set(entry.category, []);}
  byCategory.get(entry.category).push(entry.bullet);
}

const sections = CATEGORY_ORDER.filter((category) => byCategory.has(category))
  .map((category) => `### ${category}\n\n${byCategory.get(category).join("\n\n")}`)
  .join("\n\n");

const newSection = `## [${newVersion}] - ${today}\n\n${sections}\n\n`;

const changelog = readFileSync(changelogPath, "utf8");
const firstEntryIndex = changelog.search(/^## \[/m);
const insertAt = firstEntryIndex === -1 ? changelog.length : firstEntryIndex;
writeFileSync(changelogPath, changelog.slice(0, insertAt) + newSection + changelog.slice(insertAt));
console.log(
  `Wrote CHANGELOG.md entry for ${newVersion} (${changesets.length} changeset(s), ${highestBump} bump, ${linksResolved} PR link(s) resolved)`,
);
