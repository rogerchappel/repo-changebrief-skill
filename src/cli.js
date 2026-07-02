#!/usr/bin/env node
import { buildBrief, loadSummary, renderMarkdown } from './index.js';

const args = process.argv.slice(2);
const file = args.find(arg => !arg.startsWith('-'));
const format = valueAfter(args, '--format') || 'markdown';
if (!file || args.includes('--help')) {
  console.log('Usage: repo-changebrief-skill <summary.md|summary.json> [--format markdown|json]');
  process.exit(file ? 0 : 1);
}
const brief = buildBrief(loadSummary(file));
if (format === 'json') console.log(JSON.stringify(brief, null, 2));
else console.log(renderMarkdown(brief));

function valueAfter(args, flag) { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; }
