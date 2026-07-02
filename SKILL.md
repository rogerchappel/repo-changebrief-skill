# repo-changebrief-skill

Use this skill when an agent has completed repository work and needs concise, evidence-backed launch content from a local change summary.

## Inputs
- Markdown or JSON summary with changed files, verification commands, artifacts, risks, and audience notes.
- Optional `--format json` for downstream automation.

## Side-effect boundaries
- Reads only the input file.
- Writes only stdout.
- Never publishes posts, tags releases, opens PRs, or edits external systems.

## Approval requirements
Human approval is required before using generated text in public release notes, social posts, or customer-facing updates.

## Validation
Run `npm test`, `npm run check`, `npm run smoke`, and `bash scripts/validate.sh` before packaging changes.
