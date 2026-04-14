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

