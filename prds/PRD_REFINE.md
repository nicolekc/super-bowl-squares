# PRD Refinement

Review the PRD for task sizing and acceptance criteria quality.

## Right-Sized Task
- Completable in one focused session
- Has clear "done" state (testable)
- Dependencies are explicit

## Too Big (split it)
- Has multiple distinct deliverables
- Naturally breaks into "first X, then Y"

## Too Small (merge it)
- Just a sub-step of another task
- Can't be tested independently

## Task Order

Task IDs are for REFERENCE ONLY—not execution order.
Ralph picks the best next task dynamically based on:
- What's already done
- What makes logical sense
- Dependencies between tasks

If tasks have hard dependencies, note them in the description:
- "Requires: 003" or "After auth is complete"
- Do NOT assume numeric order = execution order

## Acceptance Criteria Quality

Good criteria test PURPOSE, not implementation:
- "User can log in with email/password" (purpose)
- "Login form calls /api/auth endpoint" (implementation - too rigid)

Avoid:
- Specifying exact function names or file structures
- Requiring specific libraries or patterns
- Testing internal state rather than observable behavior

### Subjective Criteria Are Acceptable

Some tasks involve UX improvements, redesigns, or creative problem-solving where criteria are inherently subjective:
- "Layout uses available space effectively"
- "Panel is pleasant and efficient to use"
- "Navigation placement is appropriate for power users"

**This is fine** as long as:
1. The **problems** being solved are clearly stated
2. Core **workflows are verified E2E** (user can still do X, Y, Z)
3. The implementer has enough context to exercise good judgment

Don't force artificial precision on inherently subjective goals. Trust the implementer to do good work, and verify the workflows still function.

## Acceptance Criteria Must Be Testable

Every criterion must be worded as a **test assertion**, not a feature description. The criterion should describe what a test verifies, not just that code exists.

**BAD (feature description):**
- "Filter bar with multi-select model chips"
- "Scrollable message list with auto-scroll"
- "Heart/favorite icon on each run item"

**GOOD (test assertion):**
- "Test verifies multiple models can be selected in filter bar simultaneously"
- "Test verifies message list scrolls to bottom when new message arrives"
- "Test verifies clicking heart icon toggles favorite state and persists to database"

The code is NOT done when the feature exists in production. The code is done when **tests verify the behavior**.

## Tests Must Exercise the Implementation

"Test verifies X" is dangerous wording. It allows tests that assert expected outcomes without exercising the code that produces them. The test passes, but proves nothing.

**The failure modes:**
- **Mock tests**: Set up mock return values, verify the mock returned what you told it to (`expect(mock).toBe(whatISetUp)`)
- **Tautology tests**: `expect(true).toBe(true)`, `expect(result).toBeDefined()` without checking correctness
- **Existence tests**: E2E test checks element exists, but doesn't verify it functions
- **Non-TypeScript tests**: SQL/scripts tested via mocks that never execute the actual artifact

**The fix:** Acceptance criteria should specify what behavior is exercised, not just what outcome is checked.

BAD (outcome only):
- "Test verifies user can log in"
- "Test verifies migration assigns run numbers"
- "Test verifies button appears"

GOOD (behavior exercised):
- "Test submits login form with valid credentials and verifies session is created"
- "Integration test executes migration SQL against test database and verifies run numbers are assigned"
- "Test clicks button and verifies the modal opens"

**Ask yourself:** Will this test execute the code and verify its intended purpose? If the test could pass for some other reason—without the code ever running—the criteria need to be more specific about how the behavior is exercised.

### Special Case: Non-TypeScript Deliverables

When the deliverable is raw SQL, shell scripts, or config files, be explicit that the test must execute the artifact:

- "Integration test executes the migration SQL against a test database..."
- "Test runs the shell script and verifies..."

Mock-based tests are never appropriate for these deliverables.

### Special Case: Investigation Tasks

Some tasks require investigation before the fix is known - the root cause isn't clear upfront.

**Small investigation (investigate + fix in one task):**

When the fix is likely straightforward once the root cause is found, keep it as one task. Follow TDD:
1. Investigate to find root cause
2. Write regression test that reproduces the bug (fails)
3. Implement the fix
4. Test passes

Example criteria:
- "Root cause is identified and documented in code comment"
- "Regression test written first, reproducing the bug"
- "Fix implemented, regression test passes"

**Large investigation (split into two tasks):**

When the investigation is substantial or the fix scope is unclear, split:

Task A - Investigation:
- Produces findings document at a **specified location** (e.g., `docs/investigations/xyz.md`)
- Documents: root cause, analysis, recommended approach
- No code changes, no tests
- Task description must specify the report path so follow-up task can reference it

Example criteria:
- "Findings documented in `docs/investigations/002-hash-bug.md`"
- "Report includes root cause analysis and recommended fix approach"

Task B - Fix (depends on Task A):
- References the findings document from Task A
- Follows TDD: write failing regression test, then implement fix
- Standard implementation criteria

The key: pure investigation produces **documentation at a known location**. Tests come with implementation, written first (TDD), passing at task completion.

### Special Case: Research-Then-Implement Tasks

Some tasks require research before implementation - the right approach isn't known upfront. These should usually be **split into two tasks**:

1. **Research task**: Investigate approaches, document findings
   - Criteria: "Findings documented with trade-offs analysis"
   - Criteria: "Recommended approach identified with rationale"

2. **Implementation task**: Build based on research (depends on research task)
   - Standard testable criteria for the implementation

**When to split vs. keep as one task:**
- **Split** if acceptance criteria for the implementation depend on research findings (you can't write them until research is done)
- **Keep as one** if acceptance criteria can be defined upfront, even if some exploration is needed to find the solution

The key distinction: Can you write testable acceptance criteria now, or do you need research to know what "done" looks like?

### Multi-Step Features Need End-to-End Criteria

For features involving multiple components or steps, acceptance criteria should include at least one integration test that verifies the pieces work together.

BAD (missing integration):
- "Filter dropdown renders with options"
- "API returns filtered results"
- "Results list displays items"

GOOD:
- (...other tests)
- "E2E: User selects filter option, results update to show only matching items"

If the feature requires A → B → C to work together, include criteria that test the full A → B → C flow.

## Output Format

For each task:
- KEEP: [task id] - [reason]
- SPLIT: [task id] into [subtasks]
- MERGE: [task ids] into [single task]
- FIX: [task id] - [criteria issue]

Or if all tasks are ready: "PRD is ready"

## Schema & Structure

Keep the PRD schema simple. All critical guidance should be traceable from task descriptions.

**Principles:**
- Task descriptions are the source of truth for what to implement
- Meta fields (outside tasks) should explain how to use the PRD, not contain implementation guidance
- If a task needs structured data in separate fields (e.g., `locations_to_review`), the description must reference it: "See locations_to_review for files to modify"
- Avoid deeply nested or overly complex field structures - they get ignored

**Anti-patterns:**
- Architecture details only in a top-level `architecture` field that tasks don't reference
- Important constraints buried in `notes` arrays
- Task descriptions that assume the implementer read other sections

## Implementer Trust Balance

We want the implementer to function as a senior engineer:
- Follow architectural guidance when provided
- Handle edge cases with long-term thinking
- Intuit appropriate solutions when something unexpected comes up

The way we write specs influences this - over-prescription infantilizes; under-specification lets them drift.

**The balance:**
- When architectural decisions matter, state them explicitly - expect them to be followed
- Leave room for judgment on implementation details not covered by the spec
- If a pattern was chosen to prevent a specific problem, explain why: "Use atomic upsert to prevent duplicate numbers under concurrent creation"
- Call out anti-patterns when prior attempts failed: "Never calculate run numbers dynamically - always read from the persisted field"
- Don't over-specify implementation details (function names, file paths, internal structure) unless there's a reason - trust them to make reasonable choices within your architectural boundaries

## Concrete Examples Are Valuable

Don't confuse "avoid over-specification" with "remove helpful examples." The implementer works autonomously and can't come back for clarification, so concrete starting points are valuable.

**The problem is rigid framing, not examples themselves:**

BAD (prescriptive):
- "The migration should contain two SQL statements"
- "Use exactly this query"

GOOD (guidance):
- "Something like this should work: [SQL example]"
- "A window function with ROW_NUMBER() should work well here"

Tentative language ("something like this should work", "one approach would be") gives the implementer a concrete starting point while leaving room to iterate if the example needs adjustment.
