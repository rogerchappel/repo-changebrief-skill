import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBrief, classifyChange, loadSummary, parseSummary, renderMarkdown } from '../src/index.js';

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
