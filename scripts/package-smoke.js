import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const workspace = mkdtempSync(join(tmpdir(), 'repo-changebrief-package-smoke-'));

try {
  const output = execFileSync('npm', ['pack', '--json', '--pack-destination', workspace], { encoding: 'utf8' });
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
const tarball = join(workspace, pack.filename);
execFileSync('npm', ['init', '--yes'], { cwd: workspace, stdio: 'ignore' });
execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball], {
  cwd: workspace,
  stdio: 'ignore',
});
const cli = join(workspace, 'node_modules', '.bin', 'repo-changebrief-skill');
const version = execFileSync(cli, ['--version'], { encoding: 'utf8' }).trim();
if (version !== packageJson.version) {
  console.error('Package smoke failed; CLI --version did not match package.json');
  process.exit(1);
}

const rendered = execFileSync(cli, [
  join(workspace, 'node_modules', 'repo-changebrief-skill', 'fixtures', 'change-summary.md'),
  '--format',
  'json',
], { encoding: 'utf8' });
const brief = JSON.parse(rendered);
if (brief.title !== 'Release Gate README and CLI refresh' || brief.type !== 'mixed') {
  console.error('Package smoke failed; installed CLI conversion returned unexpected output');
  process.exitCode = 1;
} else {
  console.log(`package smoke ok: ${pack.files.length} files; installed CLI verified`);
}

} finally {
  rmSync(workspace, { recursive: true, force: true });
}
