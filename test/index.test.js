import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { buildBrief, classifyChange, loadSummary, parseSummary, renderMarkdown } from '../src/index.js';
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('parses markdown change summaries', () => {
  const summary = loadSummary('fixtures/change-summary.md');
  assert.equal(summary.title, 'Release Gate README and CLI refresh');
  assert.ok(summary.files.includes('src/cli.js'));
  assert.ok(summary.verification.some(item => item.includes('npm test')));
});

test('parses json change summaries', () => {
  const brief = buildBrief(loadSummary('fixtures/change-summary.json'));
  assert.equal(brief.type, 'fix');
  assert.equal(brief.warnings.length, 0);
});

test('rejects invalid json field shapes with a stable field-specific error', () => {
  assert.throws(
    () => parseSummary('{"title":"Update","files":"src/cli.js"}', 'summary.json'),
    { message: 'invalid JSON field "files": expected an array of strings' },
  );
  assert.throws(
    () => parseSummary('{"title":["Update"]}', 'summary.json'),
    { message: 'invalid JSON field "title": expected a string' },
  );
});

test('warns when evidence is missing', () => {
  const brief = buildBrief(parseSummary('# Tiny update\n\n## Summary\nChanged README only.'));
  assert.ok(brief.warnings.includes('missing verification evidence'));
});

test('ignores section-like headings inside fenced code blocks', () => {
  const brief = buildBrief(parseSummary(`# Parser update

## Summary
Documents a Markdown example.

\`\`\`md
## Verification
- not actually evidence
\`\`\`
`));
  assert.deepEqual(brief.evidence, []);
  assert.ok(brief.warnings.includes('missing verification evidence'));
});

test('ignores backtick-fenced headings and prose when deriving title and fallback summary', () => {
  const summary = parseSummary(`\`\`\`md
# Internal Example
example prose
\`\`\`

# Real Change

Actual summary paragraph.
`);

  assert.equal(summary.title, 'Real Change');
  assert.equal(summary.summary, 'Actual summary paragraph.');
});

test('ignores tilde-fenced headings and prose when deriving title and fallback summary', () => {
  const summary = parseSummary(`~~~~markdown
# Internal Example
example prose
~~~~

# Real Change

Actual summary paragraph.
`);

  assert.equal(summary.title, 'Real Change');
  assert.equal(summary.summary, 'Actual summary paragraph.');
});

test('accepts optional closing markers on ATX section headings', () => {
  const brief = buildBrief(parseSummary(`# Parser update

## Verification ##
- npm test passes
`));
  assert.deepEqual(brief.evidence, ['npm test passes']);
  assert.ok(!brief.warnings.includes('missing verification evidence'));
});

test('matches markdown section names without substring collisions', () => {
  const summary = loadSummary('fixtures/unrelated-headings.md');
  assert.deepEqual(summary.verification, []);
  assert.deepEqual(summary.artifacts, []);
  assert.deepEqual(buildBrief(summary).warnings, [
    'missing verification evidence',
    'missing artifact links or file references',
  ]);
});

test('accepts every documented markdown section name and alias', () => {
  const summary = parseSummary(`# Alias coverage

## Overview
Overview text.
## Changes
- src/index.js
## Checks
- npm test passed
## Outputs
- report.md
## Known Issues
- None
## Users
- Maintainers`);

  assert.equal(summary.summary, 'Overview text.');
  assert.deepEqual(summary.files, ['src/index.js']);
  assert.deepEqual(summary.verification, ['npm test passed']);
  assert.deepEqual(summary.artifacts, ['report.md']);
  assert.deepEqual(summary.risks, ['None']);
  assert.deepEqual(summary.audience, ['Maintainers']);
});

test('CLI keeps both evidence warnings for unrelated headings', () => {
  const result = runCli('fixtures/unrelated-headings.md', '--format', 'json');
  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout).warnings, [
    'missing verification evidence',
    'missing artifact links or file references',
  ]);
});

test('renders markdown report', () => {
  const output = renderMarkdown(buildBrief(loadSummary('fixtures/change-summary.md')));
  assert.match(output, /## Release Notes/);
  assert.match(output, /npm test passed/);
});

test('keeps multiline values inside the intended markdown fields', () => {
  const brief = buildBrief(loadSummary('fixtures/multiline-change-summary.json'));
  const output = renderMarkdown(brief);
  assert.equal((output.match(/^## /gm) || []).length, 7);
  assert.doesNotMatch(output, /^## Injected/m);
  assert.doesNotMatch(output, /^- escaped list item/m);
  assert.match(output, /^# Multiline release <br> ## Injected title$/m);
  assert.match(output, /- npm test <br> ## Injected evidence/);
  assert.match(output, /- report\.txt <br> - escaped list item/);
  assert.match(output, /- Review output <br> ## Injected risk/);
});

test('CLI markdown contains only the report headings for multiline JSON', () => {
  const output = execFileSync(process.execPath, ['src/cli.js', 'fixtures/multiline-change-summary.json', '--format', 'markdown'], { encoding: 'utf8' });
  assert.equal((output.match(/^## /gm) || []).length, 7);
  assert.doesNotMatch(output, /^## Injected/m);
  assert.doesNotMatch(output, /^- escaped list item/m);
});

test('CLI JSON preserves multiline input semantics', () => {
  const output = execFileSync(process.execPath, ['src/cli.js', 'fixtures/multiline-change-summary.json', '--format', 'json'], { encoding: 'utf8' });
  const brief = JSON.parse(output);
  assert.equal(brief.title, 'Multiline release\n## Injected title');
  assert.equal(brief.evidence[0], 'npm test\n## Injected evidence');
  assert.equal(brief.artifacts[0], 'report.txt\n- escaped list item');
  assert.equal(brief.risks[0], 'Review output\n## Injected risk');
});

test('classifies change signals as words and supported word forms', () => {
  for (const [title, expected] of [
    ['Add export support', 'feature'],
    ['Added export support', 'feature'],
    ['Tests for export support', 'test'],
    ['Testing export support', 'test'],
    ['Fix export handling', 'fix'],
    ['Fixed export handling', 'fix'],
    ['README docs update', 'docs'],
  ]) {
    assert.equal(classifyChange({ title, summary: '', files: [] }), expected, title);
  }
});

test('does not classify keywords embedded in unrelated words', () => {
  for (const title of [
    'Address release wording',
    'Contest results',
    'Newest release notes',
    'Assertion update',
  ]) {
    assert.equal(classifyChange({ title, summary: '', files: [] }), 'mixed', title);
  }
});

test('classification is case-insensitive and ties resolve to mixed', () => {
  assert.equal(classifyChange({ title: 'FIXED EXPORT HANDLING', summary: '', files: [] }), 'fix');
  assert.equal(classifyChange({ title: 'Add tests', summary: '', files: [] }), 'mixed');
});

test('classifies signals in file paths without matching filename substrings', () => {
  assert.equal(classifyChange({ title: 'Update content', summary: '', files: ['docs/README.md'] }), 'docs');
  assert.equal(classifyChange({ title: 'Update content', summary: '', files: ['test/parser.test.js'] }), 'test');
  assert.equal(classifyChange({ title: 'Update content', summary: '', files: ['src/contest.js'] }), 'mixed');
});

test('cli reports package version', () => {
  const version = execFileSync(process.execPath, ['src/cli.js', '--version'], {
    encoding: 'utf8',
  }).trim();
  assert.equal(version, packageJson.version);
});

test('cli accepts --format before the input file', () => {
  const result = runCli('--format', 'json', 'fixtures/change-summary.md');
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).title, 'Release Gate README and CLI refresh');
});

test('cli accepts --format after the input file', () => {
  const result = runCli('fixtures/change-summary.md', '--format', 'json');
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).title, 'Release Gate README and CLI refresh');
});

test('cli rejects duplicate --format options regardless of position', () => {
  for (const args of [
    ['--format', 'json', '--format', 'markdown', 'fixtures/change-summary.md'],
    ['--format', 'json', 'fixtures/change-summary.md', '--format', 'markdown'],
    ['fixtures/change-summary.md', '--format', 'json', '--format', 'markdown'],
  ]) {
    const result = runCli(...args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Error: duplicate option "--format"/);
    assert.match(result.stderr, /Usage:/);
    assert.equal(result.stdout, '');
  }
});

test('cli help exits successfully without an input file', () => {
  const result = runCli('--help');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /^Usage:/);
  assert.equal(result.stderr, '');
});

test('cli rejects invalid options and arguments with concise usage errors', () => {
  for (const [args, message] of [
    [['fixtures/change-summary.md', '--format'], 'missing value for --format'],
    [['fixtures/change-summary.md', '--format', 'xml'], 'unsupported format "xml"'],
    [['fixtures/change-summary.md', '--unknown'], 'unknown option "--unknown"'],
    [['fixtures/change-summary.md', 'extra.md'], 'unexpected positional argument "extra.md"'],
  ]) {
    const result = runCli(...args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(result.stderr, /Usage:/);
    assert.doesNotMatch(result.stderr, /\n\s+at /);
  }
});

function runCli(...args) {
  return spawnSync(process.execPath, ['src/cli.js', ...args], { encoding: 'utf8' });
}
