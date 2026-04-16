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

  const arrayEquals = (a, b) =>
    a.length === b.length && a.every((value, index) => value === b[index]);

  const findExpansionMatch = (fromTokens, toTokens) => {
    for (let index = 0; index < fromTokens.length; index += 1) {
      const lhs = fromTokens[index];
      if (!isNonTerminal(lhs)) continue;

      const productions = grammarMap?.[lhs] ?? [];
      for (const production of productions) {
        const producedTokens = production === "" ? [] : tokenize(production);
        const candidate = [
          ...fromTokens.slice(0, index),
          ...producedTokens,
          ...fromTokens.slice(index + 1),
        ];
        if (arrayEquals(candidate, toTokens)) {
          return { index, producedTokens };
        }
      }
    }

    return null;
  };

  for (let i = 0; i < steps.length - 1; i++) {
    const from = steps[i];
    const to = steps[i + 1];

    const fromTokens = tokenize(from);
    const toTokens = tokenize(to);

    const match = findExpansionMatch(fromTokens, toTokens);
    if (!match) return root;

    const { index: start, producedTokens } = match;
    const replaced = fromTokens[start] ?? "";

    // This builder expects a single non-terminal to be expanded each step.
    // If it isn't, bail out (tree will still be partially useful).
    if (!isNonTerminal(replaced) || frontier.length !== fromTokens.length) {
      return root;
    }

    const targetNode = frontier[start];
    const childSymbols = producedTokens.length === 0 ? [""] : producedTokens;
    targetNode.children = childSymbols.map((s) => createNode(s));
    const frontierChildren = producedTokens.length === 0 ? [] : targetNode.children;

    // Replace the expanded node in the frontier with its children (or ε leaf).
    frontier = [
      ...frontier.slice(0, start),
      ...frontierChildren,
      ...frontier.slice(start + 1),
    ];
  }

  return root;
};

module.exports = { buildParseTreeFromDerivation };