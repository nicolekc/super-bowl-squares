# UI Testing Standards

This document defines our standards for UI testing. Claude should reference
this when implementing or testing UI components.

## Core Principle: Accessibility-First Testing

UI correctness is verified through **accessibility semantics**, not visual
appearance. If a component has correct ARIA attributes and semantic HTML,
it will be accessible AND testable.

## Required Standards

### Semantic HTML First
- Use `<button>` not `<div onClick>`
- Use `<nav>`, `<main>`, `<header>`, `<footer>` for landmarks
- Use proper heading hierarchy (`<h1>` → `<h2>` → `<h3>`)
- Use `<label>` elements properly associated with inputs

### ARIA Attributes for Interactive Elements
- Buttons without visible text: `aria-label`
- Toggle buttons: `aria-pressed`
- Expandable sections: `aria-expanded`
- Form inputs: `aria-required`, `aria-invalid` for validation states
- Modals: `role="dialog"`, `aria-labelledby`, `aria-modal`
- Loading states: `aria-busy`
- Dynamic content: `aria-live` regions where appropriate

### Verification Approach

When verifying UI changes:
1. The accessibility tree should reflect the intended UI structure
2. Interactive elements should be reachable and have meaningful names
3. State changes should be reflected in ARIA attributes
4. No console errors related to accessibility

## Tools Available

- **Playwright** is available in the container for browser-based testing
- Playwright can capture **accessibility snapshots** showing the semantic
  structure of a page
- Use accessibility snapshots to verify UI correctness without relying on
  visual comparison

## When to Apply

These standards apply when:
- Creating new UI components
- Modifying existing UI
- Writing tests for UI functionality
- Verifying acceptance criteria that involve user interface

Claude should determine the specific testing approach based on the project's
existing test setup (discovered in CLAUDE.md).
