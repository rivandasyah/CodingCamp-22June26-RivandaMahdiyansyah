const STORAGE_KEYS = {
  transactions: "ebv_transactions",
  categories: "ebv_custom_categories",
  theme: "ebv_theme",
  sort: "ebv_sort",
};

const DEFAULT_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Bills",
  "Health",
  "Other",
];

const CHART_COLORS = [
  "#2787f5",
  "#28a978",
  "#ef6b7a",
  "#f5b84b",
  "#8c6ff7",
  "#34b7c9",
  "#f47fb0",
];

const THEME_ICONS = {
  light: [
    '<svg class="theme-toggle__icon" viewBox="0 0 24 24" aria-hidden="true">',
    '<circle cx="12" cy="12" r="4"></circle>',
    '<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>',
    "</svg>",
  ].join(""),
  dark: [
    '<svg class="theme-toggle__icon" viewBox="0 0 24 24" aria-hidden="true">',
    '<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 7 7 0 1 0 20.5 14.5Z"></path>',
    "</svg>",
  ].join(""),
};

function getStorageValue(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function setStorageValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // Keep the app usable if storage is unavailable or full.
  }
}

function loadJson(key, fallbackValue) {
  const savedValue = getStorageValue(key);

  if (savedValue === null) {
    return fallbackValue;
  }

  try {
    return JSON.parse(savedValue);
  } catch (error) {
    return fallbackValue;
  }
}

function saveJson(key, value) {
  setStorageValue(key, JSON.stringify(value));
}

function loadTransactions() {
  return loadJson(STORAGE_KEYS.transactions, []);
}

function saveTransactions(transactions) {
  saveJson(STORAGE_KEYS.transactions, transactions);
}

function loadCategories() {
  return loadJson(STORAGE_KEYS.categories, []);
}

function saveCategories(categories) {
  saveJson(STORAGE_KEYS.categories, categories);
}

function loadTheme() {
  return getStorageValue(STORAGE_KEYS.theme);
}

function saveTheme(theme) {
  setStorageValue(STORAGE_KEYS.theme, theme);
}

function loadSort() {
  return getStorageValue(STORAGE_KEYS.sort) || "latest";
}

function saveSort(sortOrder) {
  setStorageValue(STORAGE_KEYS.sort, sortOrder);
}

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const savedTransactions = loadTransactions();
const savedCategories = loadCategories();
const savedSort = loadSort();
const savedTheme = loadTheme();

const AppState = {
  transactions: Array.isArray(savedTransactions)
    ? getValidTransactions(savedTransactions)
    : [],
  customCategories: Array.isArray(savedCategories)
    ? getUniqueCustomCategories(savedCategories)
    : [],
  sortOrder: getValidSortOrder(savedSort),
  theme: getInitialTheme(savedTheme),
};

const elements = {
  transactionForm: document.querySelector("#transaction-form"),
  categoryForm: document.querySelector("#category-form"),
  categorySelect: document.querySelector("#transaction-category"),
  customCategoryInput: document.querySelector("#custom-category"),
  chartContainer: document.querySelector("#spending-chart"),
  chartLegend: document.querySelector("#chart-legend"),
  sortSelect: document.querySelector("#sort-order"),
  themeToggle: document.querySelector(".theme-toggle"),
  themeToggleLabel: document.querySelector(".theme-toggle__label"),
  transactionList: document.querySelector("#transaction-list"),
  balanceAmount: document.querySelector("#balance-amount"),
  incomeAmount: document.querySelector("#income-amount"),
  expenseAmount: document.querySelector("#expense-amount"),
};

function formatCurrency(amount) {
  return currencyFormatter.format(amount);
}

function createTransactionId() {
  if (globalThis.crypto && globalThis.crypto.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getValidTransactions(transactions) {
  return transactions
    .filter((transaction) => {
      if (!transaction) {
        return false;
      }

      const amount = Number(transaction.amount);

      return (
        transaction.id &&
        transaction.description &&
        amount > 0 &&
        ["income", "expense"].includes(transaction.type) &&
        transaction.category &&
        transaction.date
      );
    })
    .map((transaction) => ({
      ...transaction,
      amount: Number(transaction.amount),
      createdAt: transaction.createdAt || transaction.date,
    }));
}

function normalizeCategoryName(category) {
  return String(category).trim().replace(/\s+/g, " ");
}

function getCategoryKey(category) {
  return normalizeCategoryName(category).toLowerCase();
}

function isDefaultCategory(category) {
  const categoryKey = getCategoryKey(category);

  return DEFAULT_CATEGORIES.some(
    (defaultCategory) => getCategoryKey(defaultCategory) === categoryKey,
  );
}

function getUniqueCategories(categories) {
  const categoryKeys = new Set();

  return categories.reduce((uniqueCategories, category) => {
    const normalizedCategory = normalizeCategoryName(category);
    const categoryKey = getCategoryKey(normalizedCategory);

    if (!normalizedCategory || categoryKeys.has(categoryKey)) {
      return uniqueCategories;
    }

    categoryKeys.add(categoryKey);
    uniqueCategories.push(normalizedCategory);

    return uniqueCategories;
  }, []);
}

function getUniqueCustomCategories(categories) {
  return getUniqueCategories(categories).filter(
    (category) => !isDefaultCategory(category),
  );
}

function getAllCategories() {
  return [...DEFAULT_CATEGORIES, ...AppState.customCategories];
}

function categoryExists(category) {
  const categoryKey = getCategoryKey(category);

  return getAllCategories().some(
    (existingCategory) => getCategoryKey(existingCategory) === categoryKey,
  );
}

function validateCategoryInput(category) {
  const normalizedCategory = normalizeCategoryName(category);

  if (!normalizedCategory) {
    return "Category name is required.";
  }

  if (categoryExists(normalizedCategory)) {
    return "This category already exists.";
  }

  return "";
}

function getValidSortOrder(sortOrder) {
  const validSortOrders = [
    "latest",
    "amount-asc",
    "amount-desc",
    "category-az",
  ];

  return validSortOrders.includes(sortOrder) ? sortOrder : "latest";
}

function getValidTheme(theme) {
  return ["light", "dark"].includes(theme) ? theme : "";
}

function getPreferredColorSchemeTheme() {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

function getInitialTheme(savedThemeValue) {
  return getValidTheme(savedThemeValue) || getPreferredColorSchemeTheme();
}

function calculateIncome(transactions = AppState.transactions) {
  return transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);
}

function calculateExpense(transactions = AppState.transactions) {
  return transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);
}

function calculateBalance(transactions = AppState.transactions) {
  return calculateIncome(transactions) - calculateExpense(transactions);
}

function calculateExpenseByCategory(transactions = AppState.transactions) {
  return transactions.reduce((categoryTotals, transaction) => {
    if (transaction.type !== "expense") {
      return categoryTotals;
    }

    const amount = Number(transaction.amount);

    if (!amount || amount <= 0) {
      return categoryTotals;
    }

    const category = normalizeCategoryName(transaction.category) || "Other";
    categoryTotals[category] = (categoryTotals[category] || 0) + amount;

    return categoryTotals;
  }, {});
}

function getChartData() {
  const expenseByCategory = calculateExpenseByCategory();
  const totalExpense = Object.values(expenseByCategory).reduce(
    (total, amount) => total + amount,
    0,
  );

  return Object.entries(expenseByCategory).map(([category, amount], index) => ({
    category,
    amount,
    percentage: totalExpense === 0 ? 0 : (amount / totalExpense) * 100,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));
}

function getTransactionTimestamp(transaction) {
  const timestamp = new Date(transaction.createdAt || transaction.date).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getNewestTransactions(transactions = AppState.transactions) {
  return [...transactions].sort(
    (firstTransaction, secondTransaction) =>
      getTransactionTimestamp(secondTransaction) -
      getTransactionTimestamp(firstTransaction),
  );
}

function getSortedTransactions(transactions = AppState.transactions) {
  const sortedTransactions = [...transactions];

  if (AppState.sortOrder === "amount-asc") {
    return sortedTransactions.sort(
      (firstTransaction, secondTransaction) =>
        Number(firstTransaction.amount) - Number(secondTransaction.amount),
    );
  }

  if (AppState.sortOrder === "amount-desc") {
    return sortedTransactions.sort(
      (firstTransaction, secondTransaction) =>
        Number(secondTransaction.amount) - Number(firstTransaction.amount),
    );
  }

  if (AppState.sortOrder === "category-az") {
    return sortedTransactions.sort((firstTransaction, secondTransaction) =>
      normalizeCategoryName(firstTransaction.category).localeCompare(
        normalizeCategoryName(secondTransaction.category),
      ),
    );
  }

  return getNewestTransactions(sortedTransactions);
}

function refreshDashboard() {
  renderTransactions();
  renderSummary();
  renderSpendingChart();
}

function addTransaction(transaction) {
  AppState.transactions = [transaction, ...AppState.transactions];
  saveTransactions(AppState.transactions);
  refreshDashboard();
}

function deleteTransaction(transactionId) {
  AppState.transactions = AppState.transactions.filter(
    (transaction) => transaction.id !== transactionId,
  );
  saveTransactions(AppState.transactions);
  refreshDashboard();
}

function confirmTransactionDelete() {
  return window.confirm("Are you sure you want to delete this transaction?");
}

function addCustomCategory(category) {
  const normalizedCategory = normalizeCategoryName(category);

  AppState.customCategories = [
    ...AppState.customCategories,
    normalizedCategory,
  ];
  saveCategories(AppState.customCategories);
  renderCategoryOptions();
}

function getTransactionFromForm(form) {
  const formData = new FormData(form);
  const amount = Number(formData.get("amount"));

  return {
    id: createTransactionId(),
    description: formData.get("description").trim(),
    amount,
    type: formData.get("type"),
    category: formData.get("category"),
    date: formData.get("date"),
    createdAt: new Date().toISOString(),
  };
}

function clearFormValidity(form) {
  Array.from(form.elements).forEach((field) => {
    if (typeof field.setCustomValidity === "function") {
      field.setCustomValidity("");
    }
  });
}

function validateTransactionInput(transaction, form) {
  clearFormValidity(form);

  if (!transaction.description) {
    form.elements.description.setCustomValidity("Description is required.");
  }

  if (!transaction.amount || transaction.amount <= 0) {
    form.elements.amount.setCustomValidity("Amount must be greater than zero.");
  }

  if (!transaction.type) {
    form.elements.type.setCustomValidity("Select a transaction type.");
  }

  if (!transaction.category) {
    form.elements.category.setCustomValidity("Select a category.");
  }

  if (!transaction.date) {
    form.elements.date.setCustomValidity("Choose a transaction date.");
  }

  return form.checkValidity();
}

function renderSummary() {
  elements.balanceAmount.textContent = formatCurrency(calculateBalance());
  elements.incomeAmount.textContent = formatCurrency(calculateIncome());
  elements.expenseAmount.textContent = formatCurrency(calculateExpense());
}

function renderTransactions() {
  if (!elements.transactionList) {
    return;
  }

  if (AppState.transactions.length === 0) {
    elements.transactionList.innerHTML =
      '<p class="transaction-empty-state">No transactions yet. Add one to start tracking.</p>';
    return;
  }

  elements.transactionList.innerHTML = getSortedTransactions()
    .map((transaction) => {
      const transactionType =
        transaction.type === "expense" ? "expense" : "income";
      const amountPrefix = transactionType === "expense" ? "-" : "+";
      const transactionTypeLabel =
        transactionType.charAt(0).toUpperCase() + transactionType.slice(1);

      return `
        <article class="transaction-item" data-transaction-id="${escapeHtml(transaction.id)}">
          <div class="transaction-item__content">
            <h3 class="transaction-item__title">${escapeHtml(transaction.description)}</h3>
            <p class="transaction-item__meta">
              ${escapeHtml(transaction.category)} | ${escapeHtml(transaction.date)} | ${transactionTypeLabel}
            </p>
          </div>
          <p class="transaction-item__amount transaction-item__amount--${transactionType}">
            ${amountPrefix}${formatCurrency(transaction.amount)}
          </p>
          <button class="transaction-item__delete" type="button" data-delete-transaction="${escapeHtml(transaction.id)}">
            Delete
          </button>
        </article>
      `;
    })
    .join("");
}

function renderCategoryOptions() {
  if (!elements.categorySelect) {
    return;
  }

  elements.categorySelect.innerHTML = [
    '<option value="">Select category</option>',
    ...getAllCategories().map((category) => {
      const safeCategory = escapeHtml(category);

      return `<option value="${safeCategory}">${safeCategory}</option>`;
    }),
  ].join("");
}

function renderChartLegend(chartData) {
  if (!elements.chartLegend) {
    return;
  }

  elements.chartLegend.innerHTML = chartData
    .map(
      (item) => `
        <li class="chart-legend__item">
          <span class="chart-legend__marker" style="background-color: ${item.color};"></span>
          <span class="chart-legend__label">${escapeHtml(item.category)}</span>
          <span class="chart-legend__value">${item.percentage.toFixed(1)}% | ${formatCurrency(item.amount)}</span>
        </li>
      `,
    )
    .join("");
}

function renderSpendingChart() {
  if (!elements.chartContainer) {
    return;
  }

  const chartData = getChartData();

  if (chartData.length === 0) {
    elements.chartContainer.setAttribute(
      "aria-label",
      "No expense data available for the spending chart.",
    );
    elements.chartContainer.innerHTML =
      '<p class="chart-empty-state">Add an expense to see your spending chart.</p>';
    renderChartLegend([]);
    return;
  }

  const totalExpense = chartData.reduce((total, item) => total + item.amount, 0);
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  let strokeOffset = 0;

  elements.chartContainer.setAttribute(
    "aria-label",
    `Expense distribution by category. Total expenses ${formatCurrency(totalExpense)}.`,
  );

  const chartSegments = chartData
    .map((item) => {
      const segmentLength = (item.percentage / 100) * circumference;
      const segment = `
        <circle
          class="spending-chart__segment"
          cx="120"
          cy="120"
          r="${radius}"
          fill="none"
          stroke="${item.color}"
          stroke-width="28"
          stroke-dasharray="${segmentLength} ${circumference - segmentLength}"
          stroke-dashoffset="${-strokeOffset}"
          transform="rotate(-90 120 120)"
        >
          <title>${escapeHtml(item.category)}: ${item.percentage.toFixed(1)}%, ${formatCurrency(item.amount)}</title>
        </circle>
      `;

      strokeOffset += segmentLength;

      return segment;
    })
    .join("");

  elements.chartContainer.innerHTML = `
    <svg class="spending-chart" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
      <circle class="spending-chart__track" cx="120" cy="120" r="${radius}" fill="none" stroke-width="28"></circle>
      ${chartSegments}
      <circle class="spending-chart__center" cx="120" cy="120" r="50"></circle>
      <text class="spending-chart__label" x="120" y="112" text-anchor="middle">Expenses</text>
      <text class="spending-chart__amount" x="120" y="134" text-anchor="middle">${formatCurrency(totalExpense)}</text>
    </svg>
  `;

  renderChartLegend(chartData);
}

function updateThemeToggle(theme) {
  if (!elements.themeToggle || !elements.themeToggleLabel) {
    return;
  }

  const isDarkMode = theme === "dark";

  elements.themeToggle.setAttribute("aria-pressed", String(isDarkMode));
  elements.themeToggle.setAttribute(
    "aria-label",
    isDarkMode ? "Switch to light mode" : "Switch to dark mode",
  );
  elements.themeToggleLabel.innerHTML = isDarkMode
    ? THEME_ICONS.dark
    : THEME_ICONS.light;
}

function applyTheme(theme) {
  const validTheme = getValidTheme(theme) || "light";

  document.body.dataset.theme = validTheme;
  document.body.classList.toggle("dark-mode", validTheme === "dark");
  document.body.classList.toggle("light-mode", validTheme === "light");
  updateThemeToggle(validTheme);
}

function handleTransactionSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const transaction = getTransactionFromForm(form);

  if (!validateTransactionInput(transaction, form)) {
    form.reportValidity();
    return;
  }

  addTransaction(transaction);
  form.reset();
  clearFormValidity(form);
}

function handleTransactionListClick(event) {
  const deleteButton = event.target.closest("[data-delete-transaction]");

  if (!deleteButton) {
    return;
  }

  if (!confirmTransactionDelete()) {
    return;
  }

  deleteTransaction(deleteButton.dataset.deleteTransaction);
}

function handleCategorySubmit(event) {
  event.preventDefault();

  const categoryInput = elements.customCategoryInput;
  const category = normalizeCategoryName(categoryInput.value);
  const validationMessage = validateCategoryInput(category);

  categoryInput.setCustomValidity(validationMessage);

  if (validationMessage) {
    categoryInput.reportValidity();
    return;
  }

  addCustomCategory(category);
  event.currentTarget.reset();
  categoryInput.setCustomValidity("");
}

function handleSortChange(event) {
  AppState.sortOrder = getValidSortOrder(event.currentTarget.value);
  saveSort(AppState.sortOrder);
  renderTransactions();
}

function handleThemeToggle() {
  AppState.theme = AppState.theme === "dark" ? "light" : "dark";
  saveTheme(AppState.theme);
  applyTheme(AppState.theme);
}

function initTransactionLogic() {
  refreshDashboard();

  elements.transactionForm.addEventListener("submit", handleTransactionSubmit);
  elements.transactionForm.addEventListener("input", () => {
    clearFormValidity(elements.transactionForm);
  });
  elements.transactionForm.addEventListener("change", () => {
    clearFormValidity(elements.transactionForm);
  });
  elements.transactionList.addEventListener(
    "click",
    handleTransactionListClick,
  );
}

function initSorting() {
  elements.sortSelect.value = AppState.sortOrder;
  elements.sortSelect.addEventListener("change", handleSortChange);
}

function initTheme() {
  applyTheme(AppState.theme);

  if (!elements.themeToggle) {
    return;
  }

  elements.themeToggle.addEventListener("click", handleThemeToggle);
}

function initCategorySystem() {
  renderCategoryOptions();
  elements.categoryForm.addEventListener("submit", handleCategorySubmit);
  elements.customCategoryInput.addEventListener("input", () => {
    elements.customCategoryInput.setCustomValidity("");
  });
}

initTheme();
initCategorySystem();
initSorting();
initTransactionLogic();
