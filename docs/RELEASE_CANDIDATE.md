# Release Candidate

## Scope

Initial public build of `repo-changebrief-skill`, a local-first CLI and skill for turning repository change summaries into release notes, demo outlines, post drafts, evidence lists, and risk notes.

## Verification

- `npm test` passed
- `npm run check` passed
- `npm run smoke` passed
- `bash scripts/validate.sh` passed

## Safety Review

- No network calls.
- No repository mutation.
- No publishing side effects.
- Missing verification or artifact evidence is surfaced as warnings.

## Classification

ship
