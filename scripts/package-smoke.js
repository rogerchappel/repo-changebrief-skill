import { execFileSync } from 'node:child_process';

const output = execFileSync('npm', ['pack', '--dry-run', '--json'], { encoding: 'utf8' });
const [pack] = JSON.parse(output);
const files = new Set(pack.files.map((file) => file.path));
const required = [
  'src/cli.js',
  'src/index.js',
  'fixtures/change-summary.md',
  'fixtures/change-summary.json',
  'examples/release-brief.md',
  'docs/RELEASE_CANDIDATE.md',
  'docs/SAFETY.md',
  'SKILL.md',
  'README.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'LICENSE',
  'SECURITY.md'
];

const missing = required.filter((file) => !files.has(file));
if (missing.length > 0) {
  console.error('Package smoke missing files: ' + missing.join(', '));
  process.exit(1);
}

console.log(`package smoke ok: ${pack.files.length} files`);
