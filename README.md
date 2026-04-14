## CFG Visualiser

CFG Visualiser is a small web app that helps you **see how a context‑free grammar generates a string**.

You can type a grammar, type a string, and the app shows:
- the **leftmost / rightmost derivation steps**
- an **animated parse tree** that builds step-by-step

## How to use it

1. Add grammar rules (one LHS per row).
2. Use `|` for multiple options on the right-hand side.
3. Use `ε` to mean “empty” (epsilon).
4. Click **Generate**.
5. Use **Prev / Next / Play** to watch the tree build.

### Example (aⁿbⁿ)

Grammar:
- `S → aSb | ε`

String:
- `aaabbb`

## Helpful notes

- **Start symbol**: the app uses the first rule’s LHS (so if your first rule is `E`, it starts from `E`).
- **Spaces don’t matter**: you can write `E → E + E` and it will still work.
- **Ambiguous grammars**: the app will show *one* valid derivation/tree if it finds one.

## Running it (local)

Install once:

```bash
npm install --prefix server
npm install --prefix client
```

Then run the backend:

```bash
cd server
node index.js
```

And run the frontend:

```bash
cd client
npm run dev
```

Open `http://localhost:5173`.

## Deploy to GitHub Pages (frontend only)

This repo includes a GitHub Action that builds the **frontend** and publishes it to GitHub Pages.

1. Push this repo to GitHub.
2. In your GitHub repo go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push to `main` (or re-run the workflow in **Actions**).

Your site will be available at:

- `https://<your-username>.github.io/<your-repo-name>/`

Note: GitHub Pages hosts the frontend only. The `/api` backend won’t run on Pages.

