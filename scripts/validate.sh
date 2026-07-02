#!/usr/bin/env bash
set -euo pipefail
npm run check
npm test
npm run smoke >/tmp/repo-changebrief-skill-smoke.md
test -s /tmp/repo-changebrief-skill-smoke.md
