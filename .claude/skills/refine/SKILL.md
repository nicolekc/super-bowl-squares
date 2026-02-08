---
name: refine
description: Review a PRD for task sizing and acceptance criteria quality
---

# PRD Refinement

Review the PRD file provided as an argument for task sizing and acceptance criteria quality.

**Usage:** `/refine <prd-path>` (e.g., `/refine prds/001_feature.json`)

## What to Check

### Right-Sized Tasks

A task is the right size when it:
- Is completable in one focused session
- Has a clear "done" state (testable)
- Has explicit dependencies (if any)

### Too Big (needs splitting)

Split a task if it:
- Has multiple distinct deliverables
- Naturally breaks into "first X, then Y"
- Would require multiple commits to complete properly

### Too Small (needs merging)

Merge tasks if they:
- Are just sub-steps of another task
- Cannot be tested independently
- Would be awkward to commit separately

### Task Dependencies

Task IDs are for REFERENCE ONLY—not execution order. Ralph picks the best next task dynamically.

If tasks have hard dependencies, they should be noted in the description:
- "Requires: 003" or "After auth is complete"
- Numeric order does NOT imply execution order

### Acceptance Criteria Quality

Good criteria test PURPOSE, not implementation:
- "User can log in with email/password" (purpose - good)
- "Login form calls /api/auth endpoint" (implementation - too rigid)

Avoid criteria that:
- Specify exact function names or file structures
- Require specific libraries or patterns
- Test internal state rather than observable behavior

## Your Output

Read the PRD file and evaluate each task. Output your assessment in this format:

For each task, provide ONE of:
- **KEEP:** [task id] - [reason it's well-sized]
- **SPLIT:** [task id] into [list of subtasks with brief descriptions]
- **MERGE:** [task ids] into [single task description]
- **FIX:** [task id] - [what's wrong with the acceptance criteria]

If all tasks are properly sized with good acceptance criteria, simply output:

**PRD is ready**

## Guidelines

- Be practical, not pedantic—small imperfections are fine
- Focus on tasks that would actually cause problems during implementation
- Consider whether the tasks flow logically given their dependencies
- Check that `testsPassing: false` for incomplete tasks and `testsPassing: true` for done tasks
