# repo-changebrief-skill

Local-first agent skill for turning repository change summaries into release notes, demo outlines, and post drafts that stay tied to verification evidence.

## Quickstart

```bash
npm install
npm run smoke
node src/cli.js fixtures/change-summary.md --format markdown
node src/cli.js fixtures/change-summary.json --format json
```

## Input Shape

Markdown inputs can include `Summary`, `Changed Files`, `Verification`, `Artifacts`, `Risks`, and `Audience` sections. JSON inputs use the same field names in camel case.

## Limitations

The tool cannot know whether a claim is true beyond the provided summary. Missing verification and artifact evidence is surfaced as warnings.

## Safety Notes

Output is a draft. Human approval is required before public release notes, social posts, or launch materials are published.

## Local Verification

```sh
npm run check
npm test
npm run smoke
npm run package:smoke
npm run release:check
```

`npm run release:check` is the PR and release gate. It runs static checks, the
test suite, the fixture-backed CLI smoke, and a structured package smoke that
verifies the tarball includes the CLI, library, fixtures, example brief,
release notes, security policy, code of conduct, and license without bundling
the test suite.
