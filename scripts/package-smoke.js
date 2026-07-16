import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

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
  'SECURITY.md',
  'CODE_OF_CONDUCT.md'
];
const forbidden = [
  'test/index.test.js'
];

const missing = required.filter((file) => !files.has(file));
const unexpected = forbidden.filter((file) => files.has(file));
if (missing.length > 0 || unexpected.length > 0) {
  console.error('Package smoke missing files: ' + missing.join(', '));
  if (unexpected.length > 0) {
    console.error('Package smoke unexpectedly included: ' + unexpected.join(', '));
  }
  process.exit(1);
}

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const version = execFileSync(process.execPath, ['src/cli.js', '--version'], { encoding: 'utf8' }).trim();
if (version !== packageJson.version) {
  console.error('Package smoke failed; CLI --version did not match package.json');
  process.exit(1);
}

console.log(`package smoke ok: ${pack.files.length} files`);
