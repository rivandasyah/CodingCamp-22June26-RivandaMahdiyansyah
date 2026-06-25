# Expense & Budget Visualizer

A mobile-friendly Expense & Budget Visualizer built with HTML, CSS, and Vanilla JavaScript. The app runs fully in the browser, stores data in Local Storage, and uses a soft sky-blue Glassmorphism interface with light and dark themes.

## Features

- Add income and expense transactions
- Delete transactions with confirmation
- View current balance, total income, and total expense
- Create custom categories
- Persist transactions, categories, sorting, and theme in Local Storage
- Sort transactions by latest, amount ascending, amount descending, or category A-Z
- Visualize expense distribution with a responsive donut chart
- Toggle between light and dark mode
- Responsive layout for mobile, tablet, and desktop

## Technology Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Browser Local Storage API
- Inline SVG for chart and icons

## Project Structure

```text
.
|-- index.html
|-- css/
|   `-- styles.css
|-- js/
|   `-- app.js
|-- .kiro/
|   `-- specs/
|       `-- expense-budget-visualizer/
|           |-- requirements.md
|           |-- design.md
|           `-- tasks.md
`-- README.md
```

## Installation

No package installation is required. This project has no external runtime dependencies and no build step.

1. Clone the repository:

```bash
git clone https://github.com/<username>/<repository-name>.git
```

2. Open the project folder:

```bash
cd <repository-name>
```

3. Open `index.html` in a browser.

For local development, you can also use any static file server. Example with Python:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Screenshots

Screenshot placeholders for the deployed project:

| View | Status |
|---|---|
| Mobile light mode | Add screenshot after deployment |
| Mobile dark mode | Add screenshot after deployment |
| Desktop dashboard | Add screenshot after deployment |
| Spending chart with transactions | Add screenshot after deployment |

## GitHub Pages Deployment

This app can be deployed directly with GitHub Pages because it is a static site.

1. Push the project to GitHub.
2. Open the repository on GitHub.
3. Go to `Settings` -> `Pages`.
4. Under `Build and deployment`, set `Source` to `Deploy from a branch`.
5. Select the branch that contains `index.html`, usually `main`.
6. Select the root folder `/`.
7. Click `Save`.
8. Wait for GitHub Pages to publish the site.

The deployed URL will follow this format:

```text
https://<username>.github.io/<repository-name>/
```

## Deployment Checklist

- `index.html` exists at the project root.
- `css/styles.css` is linked from `index.html`.
- `js/app.js` is linked from `index.html`.
- No build command is required.
- No backend server is required.
- No external libraries are required.
- App data persists with Local Storage in the browser.
- GitHub Pages can serve the app from the repository root.

## Browser Support

The app is designed for current versions of:

- Chrome
- Firefox
- Microsoft Edge
- Safari
