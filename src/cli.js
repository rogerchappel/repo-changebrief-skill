#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { buildBrief, loadSummary, renderMarkdown } from './index.js';

const args = process.argv.slice(2);
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const usage = 'Usage: repo-changebrief-skill <summary.md|summary.json> [--format markdown|json]';

if (args.length === 1 && args[0] === '--version') {
  console.log(packageJson.version);
  process.exit(0);
}

if (args.length === 1 && args[0] === '--help') {
  console.log(usage);
  process.exit(0);
}

try {
  const { file, format } = parseArgs(args);
  const brief = buildBrief(loadSummary(file));
  if (format === 'json') console.log(JSON.stringify(brief, null, 2));
  else console.log(renderMarkdown(brief));
} catch (error) {
  console.error(`Error: ${error.message}`);
  console.error(usage);
  process.exitCode = 1;
}

function parseArgs(values) {
  let file;
  let format = 'markdown';
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === '--format') {
      const candidate = values[index + 1];
      if (!candidate || candidate.startsWith('-')) throw new Error('missing value for --format');
      if (!['markdown', 'json'].includes(candidate)) throw new Error(`unsupported format "${candidate}"`);
      format = candidate;
      index += 1;
    } else if (value.startsWith('-')) {
      throw new Error(`unknown option "${value}"`);
    } else if (file) {
      throw new Error(`unexpected positional argument "${value}"`);
    } else {
      file = value;
    }
  }
  if (!file) throw new Error('missing summary file');
  return { file, format };
}
