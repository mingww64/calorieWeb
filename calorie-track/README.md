# Calorie Track

A small React + Vite single-page app for logging calorie intake. This repo contains the frontend source for the "calorie-track" app (inside the `calorie-track/` directory).

## What's this

The app's goal is to let users manually log foods and calories, persist entries locally in the browser as well as in cloud, and show a daily total. The README below includes a short summary of user stories and a quick-start for developers.

## Quick start

Prerequisites:
- Node.js (18+ recommended)
- npm (bundled with Node)

Install dependencies and run the dev server:

```bash
cd calorie-track
npm install
npm run dev
```

Open the dev server URL printed by Vite (usually http://localhost:5173).

Common scripts (from `package.json`):

- npm run dev     # start Vite dev server
- npm run build   # build production bundle
- npm run preview # preview production build locally
- npm run lint    # run ESLint

## Project summary

- Manual food entry: add a food name, quantity and calories and save it to today's list.
- Local persistence: entries are stored in browser storage so they survive reloads, also should be upload to cloud database for individual user.
- Daily summary: show a running total of calories for the current day.
- Edit/delete: allow corrections to previously logged items.
- Historical view: (optional) visualize last 7 days as a chart.
- Nice-to-have: AI tips and image-based recognition (future enhancements).

## Project structure

- `index.html` — app entry
- `src/main.jsx` — React entry point
- `src/App.jsx` — top-level app
- `src/components/` — UI components (HomeScreen, etc.)
- `public/` — static assets

Open `src/components` to explore the UI; `HomeScreen.jsx` is the main screen with the entry form and daily total.

## Contributing

1. Create a feature branch off `main`: `git checkout -b feature/your-short-name`
2. Make changes and keep commits small and focused.
3. Run lint and dev server locally to verify behavior.
4. Push and open a pull request against `main`.

## License

This repository includes a top-level `LICENSE` file (see project root) — follow the license terms for use and contributions.