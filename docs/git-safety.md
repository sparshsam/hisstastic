# Git Safety

## Policy

HissTastic follows the ecosystem branch-safety posture: preserve clear history, avoid surprise rewrites, and prefer ordinary pushes after reviewed commits.

## Rules

- Never force-push `main`.
- Never rewrite protected or shared branches, including modernization coordination branches.
- Prefer normal `git push` after commits.
- Use feature branches for scoped work.
- Force-push only on isolated feature branches when absolutely necessary, such as correcting a branch before anyone else is relying on it.
- If force-push is used, explain the reason in the final report, pull request, or handoff note.

## Agent Expectations

AI agents should state the active branch, keep commits logically grouped, push frequently, and avoid history rewrites unless the user explicitly permits them for the isolated feature branch.
