#!/usr/bin/env node
'use strict';

/**
 * Builds a GitHub Release body for a tag: the human-readable, categorized
 * CHANGELOG.md section for that version up top, with the full commit
 * history for that range tucked into a collapsed <details> accordion for
 * anyone who wants the "why" behind each change.
 *
 * Usage: node scripts/build-release-notes.mjs <tag>   (e.g. v1.2.0)
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const tag = process.argv[2];
if (!tag) {
  console.error('Usage: build-release-notes.mjs <tag>');
  process.exit(1);
}
const version = tag.replace(/^v/, '');

// version comes from a CLI arg (the git tag); escape it fully before
// interpolating into a RegExp, not just the dots, so it can't inject
// regex syntax or blow up on unexpected input.
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractChangelogSection(version) {
  const changelog = readFileSync('CHANGELOG.md', 'utf8');
  const headingPattern = new RegExp(`^## \\[${escapeRegExp(version)}\\].*$`, 'm');
  const match = headingPattern.exec(changelog);
  if (!match) {
    return `_No CHANGELOG.md entry found for ${version}._`;
  }
  const afterHeading = changelog.slice(match.index + match[0].length);
  const nextHeadingIndex = afterHeading.search(/^## \[/m);
  const section =
    nextHeadingIndex === -1 ? afterHeading : afterHeading.slice(0, nextHeadingIndex);
  return section.trim();
}

function previousTag(tag) {
  try {
    return execFileSync('git', ['describe', '--tags', '--abbrev=0', `${tag}^`], {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return null; // first release -- no previous tag to diff against
  }
}

function commitLog(range) {
  const raw = execFileSync(
    'git',
    ['log', range, '--pretty=format:### %s%n%n%b%n---COMMIT-END---'],
    { maxBuffer: 10 * 1024 * 1024 }
  ).toString();

  return raw
    .split('---COMMIT-END---')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join('\n\n');
}

const summary = extractChangelogSection(version);
const prevTag = previousTag(tag);
const range = prevTag ? `${prevTag}..${tag}` : tag;
const fullLog = commitLog(range);

const body = `${summary}

<details>
<summary>📋 Full commit details</summary>

${fullLog || '_No commits in this range._'}

</details>
`;

process.stdout.write(body);
