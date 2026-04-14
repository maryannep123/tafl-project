/**
 * Build a parse tree from a derivation sequence.
 * This avoids needing a full CFG parser and stays consistent with the visualised derivation.
 *
 * Expected node shape:
 * { value: string, children: Node[] }
 */
const buildParseTreeFromDerivation = (steps, startSymbol, grammarMap) => {
  if (!Array.isArray(steps) || steps.length === 0) return null;

  const createNode = (value) => ({
    value: value === "" ? "ε" : value,
    children: [],
  });

  // Current sentential form represented as a list of leaf nodes (terminals/non-terminals).
  const root = createNode(startSymbol);
  let frontier = [root];

  const isNonTerminal = (sym) => /^[A-Z][A-Za-z0-9_]*$/.test(sym);

  const nonTerminals = grammarMap
    ? Object.keys(grammarMap).sort((a, b) => b.length - a.length)
    : [];

  const tokenize = (sentential) => {
    const s = String(sentential ?? "");
    const out = [];
    for (let i = 0; i < s.length; ) {
      // Prefer matching known non-terminals from the grammar (handles sequences like "AB" => "A","B")
      let matched = null;
      for (const nt of nonTerminals) {
        if (s.startsWith(nt, i)) {
          matched = nt;
          break;
        }
      }
      if (matched) {
        out.push(matched);
        i += matched.length;
        continue;
      }

      out.push(s[i]);
      i += 1;
    }
    return out;
  };

  const firstDiffIndex = (aTokens, bTokens) => {
    const min = Math.min(aTokens.length, bTokens.length);
    let i = 0;
    while (i < min && aTokens[i] === bTokens[i]) i++;
    return i;
  };

  for (let i = 0; i < steps.length - 1; i++) {
    const from = steps[i];
    const to = steps[i + 1];

    const fromTokens = tokenize(from);
    const toTokens = tokenize(to);

    // Identify which single symbol got expanded/replaced.
    let start = firstDiffIndex(fromTokens, toTokens);
    if (start >= fromTokens.length && start >= toTokens.length) continue;

    // We assume exactly one symbol is rewritten each step (leftmost/rightmost derivations).
    const delta = toTokens.length - fromTokens.length; // +k means 1 -> 1+k tokens, -1 means 1 -> 0 (ε)
    // If the sentential form is a strict prefix of the next form, the "first diff"
    // lands after the rewritten symbol (e.g., E -> E+E). In that case, rewrite the last token.
    if (delta > 0 && start === fromTokens.length && fromTokens.length > 0) {
      start = fromTokens.length - 1;
    }

    const replaced = fromTokens[start] ?? "";
    const producedLen = Math.max(0, 1 + delta);
    const produced = producedLen === 0 ? "" : toTokens.slice(start, start + producedLen).join("");

    // This builder expects a single non-terminal to be expanded each step.
    // If it isn't, bail out (tree will still be partially useful).
    if (!isNonTerminal(replaced) || frontier.length !== fromTokens.length) {
      return root;
    }

    const targetNode = frontier[start];
    const childSymbols = produced === "" ? [""] : tokenize(produced);
    targetNode.children = childSymbols.map((s) => createNode(s));

    // Replace the expanded node in the frontier with its children (or ε leaf).
    frontier = [
      ...frontier.slice(0, start),
      ...targetNode.children,
      ...frontier.slice(start + 1),
    ];
  }

  return root;
};

module.exports = { buildParseTreeFromDerivation };