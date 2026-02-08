# Ralph Instructions

Read these files first:
1. CLAUDE.md - Project context and rules
2. The PRD file (you were told which one)
3. progress.txt - What's been done

## Your Job (ONE TASK PER ITERATION)

You will complete exactly ONE task per iteration. Not zero, not two. One.

1. If not already on a feature branch, create one based on the PRD filename:
   `git checkout -b ralph/[prd-number]-[brief-description]`
   Example: `git checkout -b ralph/001-test-infrastructure`
2. Read the PRD file and find all tasks where `testsPassing: false`
3. Choose the BEST NEXT TASK to work on (not necessarily the first one—pick the most logical next step based on dependencies, complexity, and what's already done)
4. Implement ONLY that task with appropriate tests
5. Run the test command from CLAUDE.md - fix until ALL tests pass
6. Commit with a clear message describing what you did
7. Update the PRD file: set `testsPassing: true` for ONLY the completed task
8. APPEND summary to progress.txt (add to end of file, do not modify existing content)
9. STOP this iteration (the loop will start a new one)

## Rules

- **One task per iteration.** Do not continue to the next task.
- **No drive-by refactoring.** Only touch code directly related to your current task. If you see something else that needs fixing, add it as a new task to the PRD instead of fixing it now.
- **Never push to main.** Only push your feature branch.
- **Never commit failing tests.**
- **Small commits.** One logical change per commit.
- **If stuck on same task 3+ times**, mark it with a `blocked` field explaining why, then pick a different task.

## Modifying the PRD

You may modify the PRD file in these specific ways:

**Adding tasks:** If you discover something that needs to be done that isn't in the PRD, add it as a new task with a new ID and `testsPassing: false`. APPEND a note to progress.txt.

**Splitting tasks:** If a task is too large to complete in one iteration, split it into smaller subtasks:
- Keep the original task ID as a prefix (e.g., "003" becomes "003a", "003b", "003c")
- Mark the original as split by adding `"split": true`
- Create the subtasks with `testsPassing: false`
- APPEND a note to progress.txt

Do NOT delete tasks. Do NOT rename task IDs (except for splitting). Do NOT modify completed tasks.

## After Each Task

APPEND to progress.txt (add to end of file):
```
---
[TIMESTAMP]
Task: [task id]
Status: done|blocked|split

What I did:
- [Detailed list of changes made]
- [Include specific files modified]
- [Include any key decisions or approaches taken]

Commit: [hash]
Notes: [any PRD modifications, blockers encountered, or issues to flag]
```

## When All Tasks Complete

When there are no more tasks with `testsPassing: false` in the PRD file:

1. `git push -u origin [branch-name]`
2. Output exactly this completion signal (the loop script detects this):

<promise>COMPLETE</promise>

3. Then output: "✅ All tasks complete. Branch [branch-name] pushed. Please review PR on GitHub."

