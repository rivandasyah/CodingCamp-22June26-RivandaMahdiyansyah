# Requirements Document

## Introduction

The Expense & Budget Visualizer is a mobile-friendly, standalone web application that helps users track their daily spending. Built with HTML, CSS, and Vanilla JavaScript, it runs entirely in the browser with no backend server. Users can add transactions, view their balance, browse transaction history, and see a visual breakdown of spending by category. All data is persisted using the Browser Local Storage API. The UI follows a Glassmorphism aesthetic — translucent glass-like cards, soft sky-blue tones, rounded corners, and clear visual hierarchy — optimized for both desktop and mobile viewports.

The application also offers three optional challenges included in scope:

1. Allow users to add custom categories
2. Sort transactions by amount or category
3. Dark/light mode toggle

---

## Glossary

- **App**: The Expense & Budget Visualizer web application.
- **Transaction**: A single financial record consisting of a description, amount, category, type (income or expense), and timestamp.
- **Balance**: The running total derived from all transactions (sum of incomes minus sum of expenses).
- **Category**: A label assigned to a Transaction (e.g., Food, Transport, Entertainment). May be a default or user-defined custom category.
- **Custom_Category**: A user-defined category that is not part of the default category list.
- **Transaction_List**: The ordered collection of all Transactions stored in Local Storage.
- **Chart**: A visual representation (e.g., doughnut/pie chart) of spending broken down by Category, rendered using the Canvas API or inline SVG.
- **Storage**: The Browser Local Storage API used to persist all Transaction and settings data client-side.
- **Filter**: A user-applied constraint on the Transaction_List display (e.g., by category or sort order).
- **Sort_Order**: A user-selected ordering applied to the Transaction_List (by amount ascending/descending or by category alphabetically).
- **Theme**: The visual color scheme of the App, either Light Mode or Dark Mode.
- **Glassmorphism**: A UI design style characterized by translucent/frosted glass-like surfaces, blur effects, soft shadows, and rounded corners.

---

## Requirements

### Requirement 1: Display Balance Summary

**User Story:** As a user, I want to see my current total balance at a glance, so that I immediately understand my financial position.

#### Acceptance Criteria

1. THE App SHALL calculate the Balance as the sum of all income Transaction amounts minus the sum of all expense Transaction amounts, rounded to two decimal places.
2. THE App SHALL display the Balance prominently at the top of the main view in a Glassmorphism-styled card using a font size of at least 2rem.
3. WHEN the Transaction_List changes, THE App SHALL recalculate and re-render the Balance without a full page reload.
4. THE App SHALL display the total income and total expense as separate summary values alongside the Balance, each formatted as a non-negative number with a currency symbol and two decimal places.
5. WHEN the Transaction_List is empty, THE App SHALL display a Balance of "$0.00", a total income of "$0.00", and a total expense of "$0.00".
6. WHEN the Balance is negative, THE App SHALL display the Balance value in a visually distinct color (e.g., red) to differentiate it from a positive or zero Balance.

---

### Requirement 2: Add a Transaction

**User Story:** As a user, I want to add a new income or expense transaction with a description, amount, and category, so that I can keep a complete record of my spending.

#### Acceptance Criteria

1. THE App SHALL provide a form with fields for: description (text, maximum 150 characters), amount (number in the range 0.01–999,999,999.99), type (income or expense), category (selectable from a default list of: Food, Transport, Entertainment, Health, Shopping, Bills, Other, plus any Custom_Categories), and date/time (defaulting to the current date and time at the moment of form submission).
2. WHEN the user submits the form with all required fields populated and valid, THE App SHALL create a new Transaction and append it to the Transaction_List.
3. WHEN the user submits the form with one or more required fields missing or invalid, THE App SHALL display exactly one inline validation error message adjacent to each invalid or empty field and prevent the Transaction from being saved.
4. WHEN a Transaction amount of zero or a negative number is entered, THE App SHALL display a validation error indicating the amount must be a positive number.
5. WHEN a new Transaction is saved, THE App SHALL persist the updated Transaction_List to Storage.
6. WHEN a new Transaction is saved, THE App SHALL update the Balance, Transaction_List display, and Chart without a full page reload.
7. WHEN a new Transaction is saved successfully, THE App SHALL reset all form fields to their default values.

---

### Requirement 3: Display Transaction History

**User Story:** As a user, I want to see a scrollable list of all my past transactions, so that I can review what I have spent money on.

#### Acceptance Criteria

1. THE App SHALL display all Transactions in the Transaction_List in reverse-chronological order by default (most recent first).
2. THE App SHALL render each Transaction entry showing: description, category, amount (income and expense amounts displayed in visually distinct colors that are never identical to each other), and date.
3. WHEN the Transaction_List is empty, THE App SHALL display a placeholder message indicating no transactions have been added yet.
4. WHEN the user activates the delete control on a Transaction entry, THE App SHALL display a confirmation prompt before deletion; IF the user confirms, THE App SHALL remove the Transaction from Storage, update the Transaction_List display, recalculate the Balance, and re-render the Chart.
5. THE App SHALL require explicit user confirmation before permanently deleting a Transaction, ensuring no Transaction is removed without a deliberate user action.

---

### Requirement 4: Visualize Spending by Category (Chart)

**User Story:** As a user, I want to see a chart of my spending broken down by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE App SHALL render a Chart showing, for each Category that has at least one expense Transaction, the proportion of that Category's total expense amount relative to the sum of all expense Transaction amounts; income Transactions SHALL be excluded from the Chart calculation.
2. THE App SHALL assign a distinct color to each Category in the Chart; IF the number of Categories exceeds the size of the predefined color palette, THE App SHALL cycle through the palette rather than leaving any Category without a color.
3. WHEN the Transaction_List changes, THE App SHALL re-render the Chart to reflect the updated data.
4. WHEN there are no expense Transactions, THE App SHALL display a text message stating "No expense data to display" in place of the Chart.
5. THE App SHALL display a legend alongside the Chart mapping each color to its Category label and showing either the percentage share or the absolute amount for that Category.

---

### Requirement 5: Persist Data with Local Storage

**User Story:** As a user, I want my transaction data to be saved automatically, so that I do not lose my records when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN a Transaction is added, THE App SHALL serialize the updated Transaction_List to JSON and write it to Storage under the key `ebv_transactions`.
2. WHEN a Transaction is deleted, THE App SHALL serialize the updated Transaction_List to JSON and write it to Storage under the key `ebv_transactions`.
3. WHEN the App initializes, THE App SHALL read the value at key `ebv_transactions` from Storage; IF the value is a non-null, successfully parseable JSON string that resolves to an array, THE App SHALL restore that array as the Transaction_List.
4. WHEN Storage is unavailable or the value at `ebv_transactions` fails JSON parsing or is not an array, THE App SHALL initialize with an empty Transaction_List and display a visible, non-modal, user-dismissible warning message.
5. WHEN an application setting (Theme, Sort_Order, or Custom_Category list) changes, THE App SHALL write the updated setting to Storage under a dedicated key so that the setting is restored on next load.
6. WHEN the App initializes, THE App SHALL read all application settings from Storage and restore Theme, Sort_Order, and Custom_Category list to their last saved values if present.

---

### Requirement 6: Responsive Mobile-Friendly Layout

**User Story:** As a user, I want the app to work well on my phone as well as on my desktop, so that I can track expenses wherever I am.

#### Acceptance Criteria

1. THE App SHALL use a single-column layout on viewport widths below 600px.
2. THE App SHALL use a layout with at least two columns (main content area and a summary or navigation panel side by side) on viewport widths of 600px and above.
3. THE App SHALL apply touch-friendly tap targets with a minimum size of 44×44 CSS pixels for all interactive elements.
4. THE App SHALL render without horizontal scrolling on viewports as narrow as 320px.
5. THE App SHALL use relative units (rem, %, vw) rather than fixed pixel widths for all layout containers, input fields, and data display panels.
6. WHEN the viewport width is below 600px, THE App SHALL collapse any navigation or tab controls into a single toggle control (e.g., hamburger menu or bottom navigation bar) to prevent layout overflow.

---

### Requirement 7: Glassmorphism Visual Design

**User Story:** As a user, I want the app to look modern and visually appealing, so that using it is a pleasant experience.

#### Acceptance Criteria

1. THE App SHALL apply a Glassmorphism aesthetic on card elements using translucent card backgrounds with a `backdrop-filter` blur value between 8px and 24px, background opacity between 0.1 and 0.4, box shadows with a spread no greater than 24px, and border-radius of at least 12px.
2. THE App SHALL use a primary color palette composed of blue hues in the HSL range of 190°–220° at low-to-medium saturation (30%–70%) as the dominant visual theme across backgrounds, cards, and interactive elements.
3. THE App SHALL consolidate all visual styling into a single stylesheet (`css/styles.css`), such that no inline styles or additional external stylesheets override the defined Glassmorphism theme.
4. THE App SHALL use readable typography with sufficient contrast ratios meeting WCAG 2.1 AA for normal text (minimum 4.5:1 contrast ratio against card backgrounds).
5. THE App SHALL use a single JavaScript file located at `js/app.js` for all application logic.

---

### Requirement 8: Add Custom Categories (Optional Challenge 1)

**User Story:** As a user, I want to create my own spending categories, so that I can organize transactions in a way that fits my lifestyle.

#### Acceptance Criteria

1. THE App SHALL provide a UI control (e.g., text input and submit button) that allows the user to add a Custom_Category by entering a category name of 1–50 characters (leading and trailing whitespace trimmed before processing).
2. WHEN the user submits a new Custom_Category name that, after trimming, is non-empty and does not match any existing category name (case-insensitive), THE App SHALL add the Custom_Category to the category list and make it immediately available in the Transaction form's category selector.
3. IF the user submits a Custom_Category name that, after trimming, is empty, THE App SHALL display a validation error stating the category name cannot be blank and prevent the category from being added.
4. IF the user submits a Custom_Category name that matches an existing category name (case-insensitive comparison), THE App SHALL display a validation error stating the category already exists and prevent the duplicate from being added.
5. WHEN a new Custom_Category is added, THE App SHALL persist the updated Custom_Category list to Storage under the key `ebv_custom_categories`.
6. WHEN the App initializes, THE App SHALL read the Custom_Category list from Storage and restore all previously saved Custom_Categories so they are available in the category selector.
7. THE App SHALL render Custom_Categories and default categories using identical visual styling within the category selector, so that users cannot distinguish them by appearance alone.

---

### Requirement 9: Sort Transactions (Optional Challenge 2)

**User Story:** As a user, I want to sort my transaction list by amount or by category, so that I can find and analyze transactions more easily.

#### Acceptance Criteria

1. THE App SHALL provide a sort control that allows the user to select a Sort_Order from: amount ascending, amount descending, category alphabetically, or default (reverse-chronological).
2. WHEN the user selects a Sort_Order, THE App SHALL re-render the Transaction_List in the selected order within 100 milliseconds.
3. WHEN the Sort_Order changes, THE App SHALL persist the selected Sort_Order to Storage under the key `ebv_sort_order`.
4. WHEN the App initializes, THE App SHALL read the Sort_Order from Storage and restore the previously saved Sort_Order if present.
5. WHEN Sort_Order is set to category alphabetical, THE App SHALL sort transactions by Category name using case-insensitive comparison in ascending alphabetical order; transactions with the same Category name SHALL be ordered by reverse-chronological date as a tie-breaker.
6. WHEN Sort_Order is set to amount ascending or amount descending, transactions with identical amounts SHALL be ordered by reverse-chronological date as a tie-breaker.
7. WHEN the user resets Sort_Order to default, THE App SHALL remove the `ebv_sort_order` key from Storage and re-render the Transaction_List in reverse-chronological order.

---

### Requirement 10: Dark/Light Mode Toggle (Optional Challenge 3)

**User Story:** As a user, I want to switch between dark and light mode, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE App SHALL provide a toggle control that switches the Theme between Light Mode and Dark Mode, and SHALL visually indicate the currently active Theme on the toggle control at all times.
2. WHEN the user activates Dark Mode, THE App SHALL immediately (without a full page reload) apply a dark color scheme across all UI elements that meets WCAG 2.1 AA contrast (minimum 4.5:1 for normal text) while preserving the Glassmorphism aesthetic (translucent backgrounds, blur, rounded corners).
3. WHEN the user activates Light Mode, THE App SHALL immediately (without a full page reload) apply the default soft sky-blue light color scheme.
4. WHEN the Theme changes, THE App SHALL persist the selected Theme to Storage under the key `ebv_theme`.
5. WHEN the App initializes AND no Theme value is found in Storage, THE App SHALL read the user's OS-level color scheme preference using the `prefers-color-scheme` media query and apply the matching Theme (Dark Mode for `dark`, Light Mode for all other values).
6. WHEN the App initializes AND a Theme value is found in Storage, THE App SHALL restore and apply the saved Theme, ignoring the OS-level `prefers-color-scheme` preference.
