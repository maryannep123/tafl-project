## CFG Visualiser

A small web app for **visualising context-free grammar (CFG) derivations and parse trees**.

- **Frontend**: React + Vite
- **Backend**: Express (API at `:5050`)
- **Tree rendering**: React Flow

## Features

- **Grammar editor** (multiple rules, `|` alternatives, supports `ε` / `epsilon`)
- **Leftmost / rightmost derivations** with step navigation (Prev/Next/Play) and a speed slider
- **Animated tree build** per derivation step (edge draw + node pop, with reduced-motion support)
- **Minimap** + zoom/fit/fullscreen controls
- **Export parse tree to PNG**
- **Example grammars dropdown**
- **Theme toggle** (light/dark)

## Project structure

```
cfg-visualiser-main/
  client/   # React UI (Vite)
  server/   # Express API
```

## Prerequisites

- Node.js (recommended: latest LTS)
- npm

## Setup

Install dependencies:

```bash
npm install --prefix server
npm install --prefix client
```

## Run locally (dev)

### 1) Start the backend (port 5050)

```bash
cd server
node index.js
```

Backend health check:

```bash
curl http://localhost:5050/
```

### 2) Start the frontend (port 5173)

```bash
cd client
npm run dev
```

Open:

- `http://localhost:5173`

The Vite dev server proxies API requests to the backend (`/api/*` → `http://localhost:5050`).

## API

### `POST /api/derive`

Request body:

```json
{
  "grammar": [{ "lhs": "S", "rhs": "aSb|ε" }],
  "string": "aaabbb",
  "startSymbol": "S"
}
```

Response includes:

- `leftmost`: array of sentential forms (steps)
- `rightmost`: array of sentential forms (steps)
- `tree`: parse tree object (used by the UI)

## Notes / tips

- **Start symbol**: the app uses the first rule’s LHS as the start symbol.
- **Whitespace**: whitespace inside productions / input is ignored by the backend.
- **Ambiguous grammars**: the app will show *one* valid derivation/tree if found (it does not enumerate all parses).

## Scripts

### Client

```bash
cd client
npm run dev
npm run build
npm run preview
```

### Server

```bash
cd server
npm run dev   # nodemon (may hit OS file-watch limits on some setups)
npm run start
```

