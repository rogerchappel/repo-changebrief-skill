# Orchestration

1. Collect a local change summary from `git diff --stat`, PR notes, or an agent handoff.
2. Run `repo-changebrief-skill <summary-file>`.
3. Review warnings for missing verification or evidence.
4. Copy approved local output into release notes, launch docs, or post drafts.

The skill is read-only. It does not inspect remotes, publish content, or mutate a repository.
