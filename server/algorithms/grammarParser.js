const parseGrammar = (grammarInput) => {
  const grammar = {};

  const normalizeProduction = (prod) => {
    const trimmed = String(prod ?? "").trim();
    // Common epsilon spellings / encodings
    if (
      trimmed === "" ||
      trimmed === "ε" ||
      trimmed === "ϵ" ||
      trimmed === "Є" ||
      trimmed.toLowerCase() === "epsilon" ||
      // mojibake that often appears when copying Greek epsilon
      trimmed === "Îµ"
    ) {
      return "";
    }
    // CFG inputs often include spaces like "E -> E + E"; treat whitespace as formatting, not terminals.
    return trimmed.replace(/\s+/g, "");
  };

  // Handle both string format and array format
  if (typeof grammarInput === 'string') {
    // Parse from string format (backward compatibility)
    const lines = grammarInput.split("\n");
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) return;

      const arrowIndex = trimmedLine.indexOf('->');
      if (arrowIndex === -1) return;

      const left = trimmedLine.substring(0, arrowIndex).trim();
      const right = trimmedLine.substring(arrowIndex + 2).trim();

      if (!left || !right) return;

      const productions = right.split('|').map(prod => {
        return normalizeProduction(prod);
      });

      grammar[left] = productions;
    });
  } else if (Array.isArray(grammarInput)) {
    // Parse from array format (new format: [{lhs: 'S', rhs: 'aSb|Îµ'}, ...])
    grammarInput.forEach(rule => {
      if (!rule.lhs || !rule.rhs) return;

      const lhs = rule.lhs.trim();
      const rhs = rule.rhs.trim();

      // Split RHS by | to handle multiple productions
      const productions = rhs.split('|').map(prod => {
        return normalizeProduction(prod);
      });

      if (grammar[lhs]) {
        // Merge productions if LHS already exists
        grammar[lhs] = [...grammar[lhs], ...productions];
      } else {
        grammar[lhs] = productions;
      }
    });
  }

  return grammar;
};

module.exports = { parseGrammar };