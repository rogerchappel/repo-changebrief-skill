# repo-changebrief-skill

Local-first agent skill for turning repository change summaries into release notes, demo outlines, and post drafts that stay tied to verification evidence.

## Quickstart

```bash
npm install
npm run smoke
node src/cli.js fixtures/change-summary.md --format markdown
node src/cli.js fixtures/change-summary.json --format json
node src/cli.js --format json fixtures/change-summary.md
```

## Input Shape

Markdown inputs can include `Summary`, `Changed Files`, `Verification`, `Artifacts`, `Risks`, and `Audience` sections. JSON inputs use the same field names in camel case. `source`, `title`, and `summary` must be strings; `files`, `verification`, `artifacts`, `risks`, and `audience` must be arrays of strings.

The input file can appear before or after `--format`. Run `node src/cli.js --help`
for usage. Unsupported formats, unknown options, and extra input files are
rejected with a concise error.

## Limitations

The tool cannot know whether a claim is true beyond the provided summary. Missing verification and artifact evidence is surfaced as warnings.

Change types are inferred deterministically from case-insensitive signals in the
title, summary, and changed-file paths. Signals must be complete words; common
documented forms such as `add`/`added`, `test`/`tests`/`testing`, and
`fix`/`fixed` are supported. Each signal contributes once per type, fixes in
the title or summary receive extra weight, and a highest-score tie (or no
signals) produces `mixed`. This intentionally avoids substring guesses such as
`add` in `address` or `test` in `contest`, but it cannot infer synonyms that are
not in the built-in signal list.

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
