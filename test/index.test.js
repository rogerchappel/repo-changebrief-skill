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

test('renders markdown report', () => {
  const output = renderMarkdown(buildBrief(loadSummary('fixtures/change-summary.md')));
  assert.match(output, /## Release Notes/);
  assert.match(output, /npm test passed/);
});

test('classifies docs changes', () => {
  assert.equal(classifyChange({ title: 'README docs update', summary: '', files: ['README.md'] }), 'docs');
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
