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

Markdown section headings are matched by their complete, case-insensitive name.
CommonMark ATX headings from `#` through `######` are supported, including
optional closing `#` markers. ATX-looking lines inside backtick or tilde fenced
code blocks remain example content and do not create or end sections.
Accepted names are `Summary`/`Overview`/`Result`, `Files`/`Changed Files`/`Changes`,
`Verification`/`Tests`/`Checks`, `Artifacts`/`Links`/`Outputs`,
`Risks`/`Limitations`/`Known Issues`, and `Audience`/`Users`. Embedded words
do not match, so headings such as `Protests` and `Backlinks` remain unrelated.
JSON inputs use the corresponding camel-case fields. `source`, `title`, and
`summary` must be strings; `files`, `verification`, `artifacts`, `risks`, and
`audience` must be arrays of strings.

JSON strings may contain newlines. Markdown output renders those newlines as
inline `<br>` breaks so user content cannot introduce report headings or extra
list items. JSON output preserves the original newline characters.

The input file can appear before or after a single `--format`. Run
`node src/cli.js --help` for usage. Duplicate `--format` options, unsupported
formats, unknown options, and extra input files are rejected with a concise
non-zero error.

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
test suite, the fixture-backed checkout CLI smoke, and an installed-artifact
gate. The package smoke verifies the tarball contents, installs that tarball in
a disposable consumer, runs its linked CLI for `--version` and a fixture-backed
conversion, and removes the consumer afterward.
