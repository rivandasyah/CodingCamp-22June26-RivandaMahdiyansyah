# Implementation Plan: Expense & Budget Visualizer

## Overview

Implement a single-page web application in three files (`index.html`, `css/styles.css`, `js/app.js`) following the unidirectional data-flow architecture defined in the design. Tasks proceed from scaffolding → core logic → UI rendering → optional features → integration, with property-based tests (fast-check) placed immediately after the functions they verify.

## Tasks

- [x] 1. Scaffold project structure and constants
  - Create `index.html` with semantic sections: `#balance-card`, `#transaction-form`, `#transaction-list`, `#chart-section`, `#category-manager`, `#sort-controls`, and a theme toggle button in the header
  - Create `css/styles.css` with CSS custom properties for light/dark themes, Glassmorphism card rules (`backdrop-filter`, `background-opacity`, `border-radius ≥ 12px`, `box-shadow`), and a responsive grid (single-column `< 600px`, two-column `≥ 600px`)
  - Create `js/app.js` skeleton with the `AppState` object, `DEFAULT_CATEGORIES`, `SORT_ORDERS`, `CHART_PALETTE` constants, and empty stubs for every module group (State, Storage, Validators, Calculators, Sorters, Chart, Renderer, Handlers, init)
  - _Requirements: 6.1, 6.2, 6.4, 6.5, 7.1, 7.2, 7.3, 7.5_

- [x] 2. Implement Storage module and AppState bootstrap
  - [x] 2.1 Implement `loadFromStorage()` — reads all four `ebv_*` keys, handles `SecurityError` and JSON parse failures, returns safe defaults; implement `saveTransactions`, `saveCustomCategories`, `saveSortOrder`, `saveTheme`; implement `showStorageWarning(message)`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [x] 2.2 Write property test for transaction serialization round-trip (Property 3)
    - **Property 3: Transaction serialization round-trip**
    - **Validates: Requirements 5.1, 5.2**
  - [x] 2.3 Write property test for transaction list persistence round-trip (Property 4)
    - **Property 4: Transaction list persistence round-trip**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 3. Implement Validators module
  - [x] 3.1 Implement `validateTransactionForm(formData)` — validates description (non-empty, max 150 chars after trim), amount (numeric, range 0.01–999,999,999.99), type, category; returns `{ valid, errors }`
    - _Requirements: 2.3, 2.4_
  - [x] 3.2 Write property test for whitespace-only description rejection (Property 5)
    - **Property 5: Whitespace-only description is invalid**
    - **Validates: Requirements 2.3**
  - [x] 3.3 Write property test for invalid amount rejection (Property 6)
    - **Property 6: Invalid amount is rejected**
    - **Validates: Requirements 2.3, 2.4**
  - [x] 3.4 Implement `validateCategoryName(name, existingCategories)` — trims input, checks non-empty, checks case-insensitive duplicate; returns `{ valid, error }`
    - _Requirements: 8.1, 8.3, 8.4_
  - [x] 3.5 Write property test for custom category deduplication (Property 13)
    - **Property 13: Custom category name deduplication**
    - **Validates: Requirements 8.4**
  - [x] 3.6 Write property test for category trim-before-validation (Property 14)
    - **Property 14: Custom category trim before validation**
    - **Validates: Requirements 8.1, 8.3**

- [x] 4. Implement Calculators and Sorters modules
  - [x] 4.1 Implement `calculateBalance(transactions)` — pure function returning `{ balance, totalIncome, totalExpense }` rounded to two decimal places
    - _Requirements: 1.1, 1.4, 1.5_
  - [x] 4.2 Write property test for balance calculation correctness (Property 1)
    - **Property 1: Balance calculation correctness**
    - **Validates: Requirements 1.1**
  - [x] 4.3 Write property test for empty transaction list producing zero summary (Property 2)
    - **Property 2: Empty transaction list produces zero summary**
    - **Validates: Requirements 1.5**
  - [x] 4.4 Implement `computeCategoryTotals(transactions)` — pure function that filters to expense type, groups by category, computes totals and percentages, sorts by total descending
    - _Requirements: 4.1, 4.2_
  - [x] 4.5 Write property test for chart totals summing to 100% (Property 11)
    - **Property 11: Chart totals sum to 100%**
    - **Validates: Requirements 4.1**
  - [x] 4.6 Write property test for chart excluding income transactions (Property 12)
    - **Property 12: Chart excludes income transactions**
    - **Validates: Requirements 4.1**
  - [x] 4.7 Implement `sortTransactions(transactions, sortOrder)` — pure function covering all four `SORT_ORDERS` with reverse-chronological tie-breaking for `amount_asc`, `amount_desc`, and `category_asc`
    - _Requirements: 9.1, 9.5, 9.6_
  - [x] 4.8 Write property test for sort preserving list contents (Property 8)
    - **Property 8: Sorting does not change list contents**
    - **Validates: Requirements 9.1, 9.2**
  - [x] 4.9 Write property test for category sort tie-break (Property 9)
    - **Property 9: Category sort tie-break is reverse-chronological**
    - **Validates: Requirements 9.5**
  - [x] 4.10 Write property test for amount sort tie-break (Property 10)
    - **Property 10: Amount sort tie-break is reverse-chronological**
    - **Validates: Requirements 9.6**

- [x] 5. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement State mutation helpers and transaction CRUD
  - [x] 6.1 Implement `buildTransaction(formData)` — assembles a `Transaction` object using `crypto.randomUUID()` (with `Math.random()` fallback), ISO datetime defaulting to `Date.now()`
    - _Requirements: 2.1, 2.2_
  - [x] 6.2 Implement `addTransaction(formData)` state mutator — validates form, calls `buildTransaction`, appends to `AppState.transactions`, calls `saveTransactions`, triggers render
    - _Requirements: 2.2, 2.5, 2.6_
  - [x] 6.3 Write property test for adding a transaction growing the list by exactly one (Property 7)
    - **Property 7: Adding a transaction grows the list by exactly one**
    - **Validates: Requirements 2.2, 2.6**
  - [x] 6.4 Implement `deleteTransaction(id)` state mutator — removes transaction by id from `AppState.transactions`, calls `saveTransactions`, triggers render
    - _Requirements: 3.4, 3.5_
  - [x] 6.5 Write property test for delete removing exactly one transaction (Property 15)
    - **Property 15: Delete removes exactly one transaction**
    - **Validates: Requirements 3.4**

- [x] 7. Implement Chart module (Canvas doughnut renderer)
  - [x] 7.1 Implement `getColor(index, palette)` — cycles through `CHART_PALETTE`
    - _Requirements: 4.2_
  - [x] 7.2 Implement `drawDoughnutChart(canvas, slices)` — uses Canvas 2D API to draw arc segments proportional to `pct`; detects canvas support and hides chart section when unavailable
    - _Requirements: 4.1, 4.2_
  - [x] 7.3 Implement `renderChartLegend(slices)` — builds `<li>` items with color swatch, category label, and percentage; shows/hides `#no-chart-message`
    - _Requirements: 4.4, 4.5_
  - [x] 7.4 Implement `renderChart(state)` — orchestrates `computeCategoryTotals`, `drawDoughnutChart`, and `renderChartLegend`
    - _Requirements: 4.3, 4.4, 4.5_

- [x] 8. Implement Renderer module (DOM updates)
  - [x] 8.1 Implement `renderBalanceCard(state)` — writes formatted currency strings to `#balance-display`, `#income-display`, `#expense-display`; applies `.negative` CSS class when balance < 0
    - _Requirements: 1.2, 1.3, 1.4, 1.6_
  - [x] 8.2 Implement `renderTransactionList(state)` — clears and rebuilds `#transactions-ul` with `<li class="transaction-item">` entries showing description, category, amount (distinct income/expense colors), date; toggles `#empty-placeholder`
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 8.3 Implement `renderFormErrors(errors)` — inserts/clears inline `<span class="field-error">` elements adjacent to each field
    - _Requirements: 2.3_
  - [x] 8.4 Implement `rebuildCategorySelects(state)` — rebuilds all `<select>` category options combining `DEFAULT_CATEGORIES` and `customCategories` with identical visual styling
    - _Requirements: 8.2, 8.7_
  - [x] 8.5 Implement top-level `render(state)` — calls `renderBalanceCard`, `renderTransactionList`, `renderChart`, and `rebuildCategorySelects` in sequence
    - _Requirements: 1.3, 2.6, 3.4_

- [x] 9. Implement Handlers module and form wiring
  - [x] 9.1 Implement `handleFormSubmit(event)` — reads form fields, calls `validateTransactionForm`; on failure calls `renderFormErrors`; on success calls `addTransaction`, clears errors, resets form
    - _Requirements: 2.2, 2.3, 2.5, 2.6, 2.7_
  - [x] 9.2 Implement `handleDeleteClick(id)` — shows `confirm()` dialog; on confirmation calls `deleteTransaction(id)`
    - _Requirements: 3.4, 3.5_
  - [x] 9.3 Implement `handleAddCategory(event)` — reads category input, calls `validateCategoryName`, on failure shows error, on success updates `AppState.customCategories`, calls `saveCustomCategories`, calls `rebuildCategorySelects`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [x] 9.4 Implement `handleSortChange(value)` — updates `AppState.sortOrder`, calls `saveSortOrder` (removes key on `'default'`), calls `renderTransactionList`
    - _Requirements: 9.2, 9.3, 9.7_

- [x] 10. Implement Theme module and `init()` bootstrap
  - [x] 10.1 Implement `applyTheme(theme)` — sets `data-theme` attribute on `<html>`; implement `detectInitialTheme()` — reads `ebv_theme` from storage, falls back to `prefers-color-scheme`, defaults to `'light'`; implement `handleThemeToggle()` — flips theme, calls `applyTheme`, calls `saveTheme`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  - [x] 10.2 Implement `init()` — calls `loadFromStorage`, populates `AppState`, calls `detectInitialTheme`, calls `applyTheme`, wires all event listeners (form submit, delete delegation, add-category, sort change, theme toggle), calls `render(AppState)`
    - _Requirements: 5.3, 5.4, 5.6, 8.6, 9.4, 10.6_

- [x] 11. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 12. Apply Glassmorphism styles and responsive layout in `css/styles.css`
  - [x] 12.1 Add `.glass-card` rule with `backdrop-filter: blur(8px–24px)`, `background` at 0.1–0.4 opacity, `box-shadow` spread ≤ 24px, `border-radius ≥ 12px`; define CSS custom properties for light and dark palettes (HSL 190°–220°); add `[data-theme="dark"]` overrides
    - _Requirements: 7.1, 7.2, 10.2, 10.3_
  - [x] 12.2 Add responsive grid rules: single-column layout below 600px (including hamburger/bottom-nav collapse for navigation), two-column layout at ≥ 600px; ensure no horizontal scroll at 320px; set touch targets ≥ 44×44px for all interactive elements; use `rem`/`%`/`vw` units throughout
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 13. Set up fast-check test runner and wire all property tests
  - [x] 13.1 Create `tests/app.test.js` (or `tests/pbt.html`) loading fast-check via CDN/npm; import or inline all pure functions under test; configure minimum 100 iterations per property; add tag comments `// Feature: expense-budget-visualizer, Property N: <text>` for each test
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 13.2 Run all 11 fast-check properties (P1, P3, P5–P9, P11–P13, P15) and confirm they pass; fix any implementation bugs surfaced by the runner
    - _Requirements: 1.1, 1.5, 2.2, 2.3, 2.4, 2.6, 3.4, 4.1, 5.1, 5.2, 5.3, 8.1, 8.3, 8.4, 9.1, 9.2, 9.5, 9.6_

- [x] 14. Final checkpoint — Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- The design uses plain JS (ES2020+) — no build step or transpiler is needed
- fast-check can be loaded via CDN (`https://cdn.skypack.dev/fast-check`) for a zero-install test setup
- All 15 correctness properties from the design are covered; properties P2, P4, P10 are covered inside tasks 4.3, 2.3, and 4.10 respectively
- The `data-theme` attribute approach means all color changes are CSS-only — no JS re-renders needed for theme switches
- Checkpoints at tasks 5, 11, and 14 ensure incremental validation

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["3.1", "3.4", "4.1", "4.4", "4.7", "6.1", "7.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2", "3.3", "3.5", "3.6", "4.2", "4.3", "4.5", "4.6", "4.8", "4.9", "4.10", "6.2", "7.2"] },
    { "id": 3, "tasks": ["6.3", "6.4", "7.3", "8.1", "8.2", "8.3", "8.4"] },
    { "id": 4, "tasks": ["6.5", "7.4", "8.5"] },
    { "id": 5, "tasks": ["9.1", "9.2", "9.3", "9.4", "10.1"] },
    { "id": 6, "tasks": ["10.2", "12.1", "12.2"] },
    { "id": 7, "tasks": ["13.1"] },
    { "id": 8, "tasks": ["13.2"] }
  ]
}
```
