const generateLeftmostDerivation = (grammar, startSymbol, target) => {
  // Strategy: Try pattern-based approach for recursive grammars
  const patternResult = tryPatternBased(grammar, startSymbol, target);
  if (patternResult) return patternResult;
  
  // Fallback to DFS with pruning (handles ambiguous / left-recursive better than BFS caps)
  return dfsDerivation(grammar, startSymbol, target);
};

const dfsDerivation = (grammar, startSymbol, target) => {
  const nonTerminals = Object.keys(grammar).sort((a, b) => b.length - a.length);
  const minLens = computeMinTerminalLengths(grammar, nonTerminals);

  const maxSteps = Math.max(30, target.length * 6);
  const maxExpansions = 20000;
  let expansions = 0;

  const seen = new Map(); // key -> bestRemainingStepsSeen

  const isCompatible = (symbol) => {
    // terminals in `symbol` must appear in `target` in order
    let i = 0;
    for (let s = 0; s < symbol.length; ) {
      const nt = matchNonTerminal(symbol, s, nonTerminals);
      if (nt) {
        s += nt.length;
        continue;
      }
      const ch = symbol[s];
      while (i < target.length && target[i] !== ch) i++;
      if (i >= target.length) return false;
      i++;
      s++;
    }
    return true;
  };

  const minPossibleLen = (symbol) => {
    let len = 0;
    for (let i = 0; i < symbol.length; ) {
      const nt = matchNonTerminal(symbol, i, nonTerminals);
      if (nt) {
        len += minLens.get(nt) ?? Infinity;
        i += nt.length;
      } else {
        len += 1;
        i += 1;
      }
    }
    return len;
  };

  const recurse = (symbol, steps) => {
    if (++expansions > maxExpansions) return null;
    if (symbol === target) return steps;
    if (steps.length > maxSteps) return null;

    const minLen = minPossibleLen(symbol);
    if (!Number.isFinite(minLen) || minLen > target.length) return null;
    if (symbol.length > target.length * 3) return null;
    if (!isCompatible(symbol)) return null;

    const key = `${symbol}|${steps.length}`;
    if (seen.has(key)) return null;
    seen.set(key, true);

    const leftmost = findLeftmostNonTerminal(symbol, grammar);
    if (!leftmost) return null;

    const { index, nonTerminal } = leftmost;
    const productions = [...grammar[nonTerminal]].sort((a, b) => {
      // Prefer productions that keep us closer to target length and reduce NTs
      const nextA = symbol.substring(0, index) + a + symbol.substring(index + nonTerminal.length);
      const nextB = symbol.substring(0, index) + b + symbol.substring(index + nonTerminal.length);
      return Math.abs(minPossibleLen(nextA) - target.length) - Math.abs(minPossibleLen(nextB) - target.length);
    });

    for (const production of productions) {
      const nextSymbol = symbol.substring(0, index) + production + symbol.substring(index + nonTerminal.length);
      const result = recurse(nextSymbol, [...steps, nextSymbol]);
      if (result) return result;
    }
    return null;
  };

  return recurse(startSymbol, [startSymbol]);
};

const matchNonTerminal = (symbol, i, nonTerminals) => {
  for (const nt of nonTerminals) {
    if (symbol.substring(i, i + nt.length) === nt) return nt;
  }
  return null;
};

const computeMinTerminalLengths = (grammar, nonTerminals) => {
  // Fixed point: shortest number of terminal characters each NT can derive.
  const minLen = new Map();
  for (const nt of nonTerminals) minLen.set(nt, Infinity);

  let changed = true;
  let iters = 0;
  while (changed && iters++ < 200) {
    changed = false;
    for (const nt of nonTerminals) {
      for (const prod of grammar[nt] ?? []) {
        let len = 0;
        let ok = true;
        for (let i = 0; i < prod.length; ) {
          const inner = matchNonTerminal(prod, i, nonTerminals);
          if (inner) {
            const v = minLen.get(inner);
            if (!Number.isFinite(v) || v === Infinity) { ok = false; break; }
            len += v;
            i += inner.length;
          } else {
            len += 1;
            i += 1;
          }
        }
        if (prod === "") len = 0;
        if (ok && len < (minLen.get(nt) ?? Infinity)) {
          minLen.set(nt, len);
          changed = true;
        }
      }
    }
  }
  return minLen;
};

const tryPatternBased = (grammar, startSymbol, target) => {
  // Check if this looks like a recursive grammar pattern
  for (const nonTerminal of Object.keys(grammar)) {
    const productions = grammar[nonTerminal];
    
    // Check if there's a recursive production and an epsilon production
    const hasRecursive = productions.some(p => p.includes(nonTerminal));
    const hasEpsilon = productions.some(p => p === '' || p === 'ε');
    
    if (hasRecursive && hasEpsilon && nonTerminal === startSymbol) {
      // Try different numbers of recursive applications
      const recursiveProd = productions.find(p => p.includes(nonTerminal));
      for (let i = 0; i <= 10; i++) {
        const steps = applyRecursiveNTimes(grammar, startSymbol, recursiveProd, i, nonTerminal);
        if (steps) {
          // Now apply epsilon
          const finalSteps = applyEpsilon(grammar, steps[steps.length - 1], nonTerminal, steps);
          if (finalSteps && finalSteps[finalSteps.length - 1] === target) {
            return finalSteps;
          }
        }
      }
    }
  }
  return null;
};

const applyRecursiveNTimes = (grammar, symbol, production, n, nonTerminal) => {
  const steps = [symbol];
  let current = symbol;
  
  for (let i = 0; i < n; i++) {
    const index = current.indexOf(nonTerminal);
    if (index === -1) return null;
    
    current = current.substring(0, index) + production + current.substring(index + nonTerminal.length);
    steps.push(current);
  }
  
  return steps;
};

const applyEpsilon = (grammar, symbol, nonTerminal, existingSteps) => {
  const index = symbol.indexOf(nonTerminal);
  if (index === -1) return null;
  
  const nextSymbol = symbol.substring(0, index) + '' + symbol.substring(index + nonTerminal.length);
  return [...existingSteps, nextSymbol];
};

const bfsDerivation = (grammar, startSymbol, target, maxDepth = 15) => {
  const queue = [{ symbol: startSymbol, steps: [startSymbol] }];
  const visited = new Set();
  
  while (queue.length > 0) {
    const { symbol, steps } = queue.shift();
    
    if (symbol === target) return steps;
    if (visited.has(symbol)) continue;
    visited.add(symbol);
    if (steps.length > maxDepth) continue;
    
    const leftmostIndex = findLeftmostNonTerminal(symbol, grammar);
    if (!leftmostIndex) continue;
    
    const { index, nonTerminal } = leftmostIndex;
    for (const production of grammar[nonTerminal]) {
      const nextSymbol = symbol.substring(0, index) + production + symbol.substring(index + nonTerminal.length);
      if (nextSymbol.length <= target.length * 2) {
        queue.push({ symbol: nextSymbol, steps: [...steps, nextSymbol] });
      }
    }
  }
  return null;
};

const recursiveWithEpsilon = (grammar, symbol, target, steps = [], depth = 0) => {
  if (symbol === target) return [...steps, symbol];
  if (depth > 15) return null;
  
  const leftmostIndex = findLeftmostNonTerminal(symbol, grammar);
  if (!leftmostIndex) return null;
  
  const { index, nonTerminal } = leftmostIndex;
  const productions = [...grammar[nonTerminal]].sort((a, b) => {
    // Prioritize epsilon if we're close to target length
    const nextA = symbol.substring(0, index) + a + symbol.substring(index + nonTerminal.length);
    const nextB = symbol.substring(0, index) + b + symbol.substring(index + nonTerminal.length);
    return Math.abs(nextA.length - target.length) - Math.abs(nextB.length - target.length);
  });
  
  for (const production of productions) {
    const nextSymbol = symbol.substring(0, index) + production + symbol.substring(index + nonTerminal.length);
    if (nextSymbol.length <= target.length * 2) {
      const result = recursiveWithEpsilon(grammar, nextSymbol, target, [...steps, symbol], depth + 1);
      if (result) return result;
    }
  }
  return null;
};

const simpleDFS = (grammar, symbol, target, steps = [], visited = new Set()) => {
  if (symbol === target) return [...steps, symbol];
  if (steps.length > 12) return null;
  
  const stateKey = symbol;
  if (visited.has(stateKey)) return null;
  visited.add(stateKey);
  
  const leftmostIndex = findLeftmostNonTerminal(symbol, grammar);
  if (!leftmostIndex) return null;
  
  const { index, nonTerminal } = leftmostIndex;
  for (const production of grammar[nonTerminal]) {
    const nextSymbol = symbol.substring(0, index) + production + symbol.substring(index + nonTerminal.length);
    if (nextSymbol.length <= target.length * 2) {
      const result = simpleDFS(grammar, nextSymbol, target, [...steps, symbol], new Set(visited));
      if (result) return result;
    }
  }
  return null;
};

const findLeftmostNonTerminal = (symbol, grammar) => {
  for (let i = 0; i < symbol.length; i++) {
    for (const nonTerminal of Object.keys(grammar).sort((a, b) => b.length - a.length)) {
      if (symbol.substring(i, i + nonTerminal.length) === nonTerminal) {
        return { index: i, nonTerminal };
      }
    }
  }
  return null;
};

module.exports = { generateLeftmostDerivation };