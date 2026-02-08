---
name: discover
description: Explore a project and populate CLAUDE.md with tech stack, patterns, and testing setup
---

# Project Discovery

Explore this project and update CLAUDE.md with the following sections. If CLAUDE.md doesn't exist, create it first.

## 1. Tech Stack

Check package.json, config files, and source code to identify:
- Frameworks and libraries used
- Build tools and bundlers
- Key dependencies and their purposes

## 2. Project Structure

Describe the folder organization:
- What goes where
- Key directories and their purposes
- Entry points

## 3. Coding Patterns

Identify INTENTIONAL patterns and conventions that appear consistent across the codebase:
- Component structure patterns
- State management approach
- Styling approach (CSS modules, Tailwind, styled-components, etc.)
- API/data fetching patterns
- Error handling patterns

**IMPORTANT:** Only document patterns that appear intentional and consistent. Ignore inconsistencies or anti-patterns—these are technical debt, not standards to follow.

## 4. Testing Setup

Document the testing infrastructure:
- What test framework is used?
- Where do tests live?
- Any testing utilities or patterns in use?
- How to run specific tests vs all tests?
- Test command (usually `npm test`)

## 5. Dev Server

- What port does the dev server run on?
- Any environment setup needed?
- How to start development?

## Guidelines

**AVOID REDUNDANCY:**
- Do NOT duplicate information already in README.md or other docs
- Do NOT document things that are obvious or easily discoverable
- ONLY include: critical info, non-obvious patterns, context that saves searching the whole project
- Keep it concise—this file should reduce cognitive load, not add to it

**Do NOT invent patterns that don't exist. Only document what you observe.**

Save the updated CLAUDE.md when done and summarize what you found.
