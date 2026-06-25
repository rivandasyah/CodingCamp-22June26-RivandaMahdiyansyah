# Design Document: Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a single-page web application (SPA) that runs entirely in the browser with no backend. It is implemented as three files: `index.html`, `css/styles.css`, and `js/app.js`. All state is persisted to `localStorage` using four dedicated keys (`ebv_transactions`, `ebv_custom_categories`, `ebv_sort_order`, `ebv_theme`). The UI follows a Glassmorphism aesthetic — translucent frosted-glass cards, sky-blue hues, rounded corners — and is fully responsive from 320 px upwards.

### Goals

- Allow users to add, view, and delete income/expense transactions.
- Show a live balance summary (income, expenses, net balance).
- Render a doughnut/pie chart of spending by category using the Canvas API.
- Support custom categories, sortable transaction lists, and a dark/light theme toggle.
- Persist all data client-side; recover gracefully when storage is unavailable or corrupt.

### Technology Choices

| Concern | Choice | Rationale |
|---|---|---|
| Language / Runtime | HTML + CSS + Vanilla JS (ES2020+) | Constraint from requirements; no build step needed |
| Chart rendering | Canvas API (2D context) | Available in all modern browsers; no external dependency required |
| Persistence | `localStorage` | Browser-native, synchronous, simple key/value API |
| Styling | Single `css/styles.css` | Required by constraint; all Glassmorphism rules centralized |

---

## Architecture

The application follows a **unidirectional data-flow** pattern implemented in plain JavaScript:

```
User Interaction
      │
      ▼
  Action Handler  (event listeners in app.js)
      │
      ▼
  State Mutation  (pure functions that update the in-memory state object)
      │
      ├──► Storage Writer  (serialize state → localStorage)
      │
      └──► Renderer        (read state → re-render DOM + Canvas)
```

There is a single **global state object** (`AppState`) held in memory. All reads come from this object; all writes go through mutator functions that also trigger a render pass. This makes the data flow predictable and easy to trace.

### Module Boundaries (within `js/app.js`)

Because the project is a single JS file, logical separation is maintained through clearly named function groups:

| Group | Responsibility |
|---|---|
| `State` | Holds `AppState`; exports read/mutate helpers |
| `Storage` | Read/write helpers wrapping `localStorage` |
| `Validators` | Pure validation functions for forms |
| `Calculators` | Pure arithmetic (balance, category totals) |
| `Sorters` | Pure sort functions per `Sort_Order` value |
| `Chart` | Canvas-based doughnut chart renderer |
| `Renderer` | DOM update functions (balance card, transaction list, legend) |
| `Handlers` | Event handler functions wired in `init()` |
| `init` | Application bootstrap — loads storage, wires events, first render |

---

## Components and Interfaces

### 1. Balance Summary Card

**Purpose:** Shows current net balance, total income, and total expenses.

**DOM structure:**
```html
<section id="balance-card" class="glass-card">
  <p id="balance-display"></p>       <!-- e.g. "$1,234.56" or "-$50.00" in red -->
  <div class="summary-row">
    <span id="income-display"></span>
    <span id="expense-display"></span>
  </div>
</section>
```

**Functions:**
- `calculateBalance(transactions) → { balance, totalIncome, totalExpense }` — pure, returns rounded floats.
- `renderBalanceCard(state)` — writes formatted strings to the DOM; applies `.negative` CSS class when balance < 0.

---

### 2. Add Transaction Form

**Purpose:** Captures a new transaction and validates it before saving.

**Fields:**
- `description` — text, max 150 characters, required
- `amount` — number, 0.01–999,999,999.99, required
- `type` — select: `income` | `expense`, required
- `category` — select: defaults + custom categories, required
- `datetime` — `datetime-local` input, defaults to `now()` at submission

**Functions:**
- `validateTransactionForm(formData) → { valid: boolean, errors: Record<fieldName, string> }` — pure.
- `buildTransaction(formData) → Transaction` — assembles a Transaction object with a `crypto.randomUUID()` id and ISO timestamp.
- `handleFormSubmit(event)` — reads form, calls validator, either shows errors or saves and resets.
- `renderFormErrors(errors)` — inserts/clears inline `<span class="field-error">` elements.

---

### 3. Transaction List

**Purpose:** Displays all transactions in the current sort order.

**DOM structure:**
```html
<section id="transaction-list">
  <div id="sort-controls">…</div>
  <ul id="transactions-ul">
    <!-- <li class="transaction-item"> per transaction -->
  </ul>
  <p id="empty-placeholder" hidden>No transactions yet.</p>
</section>
```

**Functions:**
- `sortTransactions(transactions, sortOrder) → Transaction[]` — pure, returns a new sorted array.
- `renderTransactionList(state)` — clears and rebuilds `<ul>` contents; toggles placeholder.
- `handleDeleteClick(id)` — shows `confirm()` dialog; on confirmation calls `deleteTransaction(id)`.

---

### 4. Category Chart

**Purpose:** Renders a doughnut chart of expense totals by category on a `<canvas>` element.

**DOM structure:**
```html
<section id="chart-section" class="glass-card">
  <canvas id="expense-chart" width="280" height="280"></canvas>
  <ul id="chart-legend"></ul>
  <p id="no-chart-message" hidden>No expense data to display.</p>
</section>
```

**Functions:**
- `computeCategoryTotals(transactions) → { category: string, total: number, pct: number }[]` — pure; filters to expense type only; sorts by total descending.
- `getColor(index, palette) → string` — cycles through palette if index exceeds palette length.
- `drawDoughnutChart(canvas, slices)` — uses Canvas 2D API; draws arcs proportional to `pct`.
- `renderChartLegend(slices)` — builds legend `<li>` items with color swatch, label, and percentage.
- `renderChart(state)` — orchestrates the above; shows/hides `no-chart-message`.

---

### 5. Custom Category Manager

**Purpose:** Lets users add named categories beyond the defaults.

**Functions:**
- `validateCategoryName(name, existingCategories) → { valid: boolean, error: string | null }` — trims, checks non-empty, checks case-insensitive duplicate.
- `handleAddCategory(event)` — reads input, validates, saves, updates category selectors.
- `rebuildCategorySelects(state)` — rebuilds all `<select>` elements that list categories.

---

### 6. Sort Controls

**Purpose:** Allows the user to choose a sort order for the transaction list.

**Sort order values:**
| Key | Description |
|---|---|
| `default` | Reverse-chronological (newest first) |
| `amount_asc` | Amount ascending; tie-break by date desc |
| `amount_desc` | Amount descending; tie-break by date desc |
| `category_asc` | Category name A→Z (case-insensitive); tie-break by date desc |

**Functions:**
- `handleSortChange(value)` — updates `AppState.sortOrder`, persists, re-renders list.

---

### 7. Theme Toggle

**Purpose:** Switches between dark and light color schemes; persists the choice.

**Functions:**
- `applyTheme(theme)` — sets `data-theme="dark"` or `data-theme="light"` attribute on `<html>`; CSS variables drive all color changes.
- `detectInitialTheme()` — reads `ebv_theme` from storage; falls back to `prefers-color-scheme`; defaults to `light`.
- `handleThemeToggle()` — flips current theme, calls `applyTheme`, persists.

---

### 8. Storage Module

**Functions:**
- `loadFromStorage() → Partial<StoredData>` — reads all four keys; handles `SecurityError` and `JSON.parse` failures; returns safe defaults.
- `saveTransactions(transactions)` — serializes and writes `ebv_transactions`.
- `saveCustomCategories(categories)` — writes `ebv_custom_categories`.
- `saveSortOrder(order)` — writes `ebv_sort_order`.
- `saveTheme(theme)` — writes `ebv_theme`.
- `showStorageWarning(message)` — renders a dismissible non-modal banner; called when storage load fails.

---

## Data Models

### Transaction

```js
/**
 * @typedef {Object} Transaction
 * @property {string}  id          - UUID generated by crypto.randomUUID()
 * @property {string}  description - 1–150 characters
 * @property {number}  amount      - positive float, 0.01–999999999.99
 * @property {'income'|'expense'} type
 * @property {string}  category    - one of DEFAULT_CATEGORIES or a Custom_Category name
 * @property {string}  datetime    - ISO 8601 string (e.g. "2025-06-22T14:30:00")
 */
```

### AppState

```js
/**
 * @typedef {Object} AppState
 * @property {Transaction[]} transactions     - current in-memory list
 * @property {string[]}      customCategories - user-defined category names
 * @property {SortOrder}     sortOrder        - currently active sort
 * @property {'light'|'dark'} theme
 * @property {boolean}       storageAvailable - false when localStorage is inaccessible
 */
```

### SortOrder (string enum)

```js
const SORT_ORDERS = {
  DEFAULT:      'default',       // reverse-chronological
  AMOUNT_ASC:   'amount_asc',
  AMOUNT_DESC:  'amount_desc',
  CATEGORY_ASC: 'category_asc',
};
```

### Default Categories

```js
const DEFAULT_CATEGORIES = [
  'Food', 'Transport', 'Entertainment', 'Health', 'Shopping', 'Bills', 'Other'
];
```

### localStorage Schema

| Key | Value type | Content |
|---|---|---|
| `ebv_transactions` | JSON string | `Transaction[]` |
| `ebv_custom_categories` | JSON string | `string[]` |
| `ebv_sort_order` | JSON string | `SortOrder` string |
| `ebv_theme` | JSON string | `"light"` or `"dark"` |

### Chart Color Palette

A fixed array of 10 distinct HSL colors cycling as needed:

```js
const CHART_PALETTE = [
  '#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD',
  '#98D8C8','#F7DC6F','#BB8FCE','#85C1E9','#F0B27A'
];
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Balance calculation correctness

*For any* array of Transaction objects (with arbitrary mix of income and expense amounts), `calculateBalance` SHALL return a net balance equal to the sum of all income amounts minus the sum of all expense amounts, rounded to exactly two decimal places.

**Validates: Requirements 1.1**

---

### Property 2: Empty transaction list produces zero summary

*For any* call to `calculateBalance` with an empty array, the result SHALL be `{ balance: 0.00, totalIncome: 0.00, totalExpense: 0.00 }`.

**Validates: Requirements 1.5**

---

### Property 3: Transaction serialization round-trip

*For any* valid `Transaction` object, serializing it to JSON via `JSON.stringify` and then deserializing it via `JSON.parse` SHALL produce an object deeply equal to the original.

**Validates: Requirements 5.1, 5.2**

---

### Property 4: Transaction list persistence round-trip

*For any* array of Transaction objects written to `localStorage` under `ebv_transactions`, calling `loadFromStorage` SHALL restore an array deeply equal to the original.

**Validates: Requirements 5.1, 5.2, 5.3**

---

### Property 5: Whitespace-only description is invalid

*For any* form submission where the description field contains only whitespace characters (spaces, tabs, newlines), `validateTransactionForm` SHALL return `{ valid: false }` with a non-empty error message for the description field.

**Validates: Requirements 2.3**

---

### Property 6: Invalid amount is rejected

*For any* amount value that is zero, negative, non-numeric, or outside the range 0.01–999,999,999.99, `validateTransactionForm` SHALL return `{ valid: false }` with a non-empty error message for the amount field.

**Validates: Requirements 2.3, 2.4**

---

### Property 7: Adding a transaction grows the list by exactly one

*For any* valid transaction form data submitted to a transaction list of arbitrary size n, the resulting transaction list SHALL have size n + 1 and the new transaction SHALL appear in the list.

**Validates: Requirements 2.2, 2.6**

---

### Property 8: Sorting does not change list contents

*For any* array of transactions and any Sort_Order, `sortTransactions(transactions, order)` SHALL return an array containing exactly the same transaction ids as the input, with no additions or removals.

**Validates: Requirements 9.1, 9.2**

---

### Property 9: Category sort tie-break is reverse-chronological

*For any* group of transactions sharing the same category, after sorting by `category_asc`, those transactions SHALL appear in reverse-chronological order within the group (newest first).

**Validates: Requirements 9.5**

---

### Property 10: Amount sort tie-break is reverse-chronological

*For any* group of transactions sharing the same amount, after sorting by `amount_asc` or `amount_desc`, those transactions SHALL appear in reverse-chronological order within the group.

**Validates: Requirements 9.6**

---

### Property 11: Chart totals sum to 100%

*For any* non-empty array of expense transactions, the sum of all `pct` values returned by `computeCategoryTotals` SHALL equal 100 (within floating-point tolerance of ±0.01%).

**Validates: Requirements 4.1**

---

### Property 12: Chart excludes income transactions

*For any* mix of income and expense transactions, `computeCategoryTotals` SHALL produce results whose total amounts sum to exactly the sum of expense-type transaction amounts only.

**Validates: Requirements 4.1**

---

### Property 13: Custom category name deduplication

*For any* attempt to add a Custom_Category name that matches an existing category name (case-insensitive), `validateCategoryName` SHALL return `{ valid: false }` with a non-empty error message.

**Validates: Requirements 8.4**

---

### Property 14: Custom category trim before validation

*For any* category name string with leading and/or trailing whitespace, `validateCategoryName` SHALL evaluate the trimmed version; if the trimmed string is non-empty and unique, the category SHALL be accepted; if the trimmed string is empty, it SHALL be rejected.

**Validates: Requirements 8.1, 8.3**

---

### Property 15: Delete removes exactly one transaction

*For any* transaction list of size n and a valid transaction id present in the list, confirming deletion SHALL result in a list of size n − 1 with the specified id absent and all other ids preserved.

**Validates: Requirements 3.4**

---

## Error Handling

| Scenario | Behavior |
|---|---|
| `localStorage` unavailable (`SecurityError`) | `storageAvailable = false`; show dismissible non-modal banner; app works in-memory only |
| `ebv_transactions` is not valid JSON or not an array | Start with empty `Transaction[]`; show dismissible warning banner |
| `ebv_custom_categories` / `ebv_sort_order` / `ebv_theme` corrupt | Fall back to defaults silently |
| Form submitted with invalid fields | Show inline error per field; prevent save; do not reset form |
| Deletion confirmed via `confirm()` dialog | Remove from state, re-render, persist; if storage fails, show warning |
| `crypto.randomUUID()` unavailable (very old browser) | Fall back to `Math.random()`-based UUID substitute |
| Canvas not supported | Hide chart section; display text-only legend |

---

## Testing Strategy

### Unit Tests (example-based)

Focus on pure functions where specific concrete behavior can be verified:

- `calculateBalance([])` returns zero summary (Req 1.5)
- `calculateBalance` with known income/expense values returns correct totals (Req 1.1, 1.4)
- Negative balance triggers `.negative` class in rendered output (Req 1.6)
- `validateTransactionForm` rejects missing description, amount = 0, amount < 0 (Req 2.3, 2.4)
- `validateCategoryName` rejects empty string and case-insensitive duplicate (Req 8.3, 8.4)
- `sortTransactions` with `amount_asc` produces ascending order (Req 9.1)
- `sortTransactions` with `category_asc` uses case-insensitive comparison (Req 9.5)
- `computeCategoryTotals` returns empty array for income-only input (Req 4.4)
- Theme initialization reads OS preference when no stored value exists (Req 10.5)
- `loadFromStorage` returns empty defaults when storage is unavailable (Req 5.4)

### Property-Based Tests

Property-based testing is appropriate here because the core logic consists of pure functions over collections (balance arithmetic, sorting, validation, serialization) where input variation reveals edge cases that example tests miss.

**Library:** [fast-check](https://fast-check.io/) — mature PBT library for JavaScript/TypeScript, no build step required when loaded via CDN in a test HTML page, or used with Node.js + a lightweight test runner.

**Minimum iterations:** 100 per property (fast-check default is 100).

**Tag format:** `// Feature: expense-budget-visualizer, Property N: <property text>`

Properties to implement as PBT tests (mapping to Correctness Properties above):

| Property | Fast-check arbitraries |
|---|---|
| P1: Balance calculation correctness | `fc.array(fc.record({ type: fc.constantFrom('income','expense'), amount: fc.float({min:0.01, max:999999999.99}) }))` |
| P3: Serialization round-trip | `fc.record({ id: fc.uuid(), description: fc.string({minLength:1,maxLength:150}), amount: fc.float({min:0.01}), type: fc.constantFrom('income','expense'), category: fc.string(), datetime: fc.date().map(d=>d.toISOString()) })` |
| P5: Whitespace description rejected | `fc.stringOf(fc.constantFrom(' ','\t','\n'), {minLength:1})` |
| P6: Invalid amount rejected | `fc.oneof(fc.constant(0), fc.float({max:0}), fc.constant(-1), fc.constant(NaN))` |
| P7: Adding grows list by 1 | `fc.array(validTransactionArb)` combined with `fc.record(validFormArb)` |
| P8: Sort preserves contents | `fc.array(transactionArb)` × `fc.constantFrom(...SORT_ORDERS)` |
| P9: Category sort tie-break | `fc.array(transactionArb with same category)` |
| P11: Chart totals sum to 100% | `fc.array(expenseTransactionArb, {minLength:1})` |
| P12: Chart excludes income | `fc.array(transactionArb)` |
| P13: Duplicate category rejected | `fc.string()` tested against itself and case variants |
| P15: Delete removes exactly one | `fc.array(transactionArb, {minLength:1})` with a random id from the array |

### Integration / Manual Tests

- **Persistence round-trip:** Add transactions, refresh page, verify data restored.
- **Storage failure simulation:** Block `localStorage` via DevTools (storage quota 0), verify warning banner appears and app remains usable.
- **Responsive layout:** Test at 320 px, 599 px, 600 px, 1024 px viewports.
- **Theme persistence:** Switch to dark mode, refresh, verify dark mode restored.
- **Sort persistence:** Change sort order, refresh, verify sort restored.
- **Chart with single category:** Verify 100% slice displayed correctly.
- **Delete confirmation:** Confirm deletion removes transaction; cancelling leaves list unchanged.

### Accessibility Checks

- WCAG 2.1 AA contrast ratios validated manually with a contrast checker tool (e.g., WebAIM Contrast Checker) for both light and dark modes.
- Touch target sizes verified in DevTools device simulation.
- Keyboard navigation tested through all interactive controls.
