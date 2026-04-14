const { parseGrammar } = require("../algorithms/grammarParser");
const { generateLeftmostDerivation } = require("../algorithms/leftmost");
const { generateRightmostDerivation } = require("../algorithms/rightmost");
const { buildParseTreeFromDerivation } = require("../algorithms/treeBuilder");

const deriveString = (req, res) => {
  try {
    const { grammar, string, startSymbol = "S" } = req.body;

    const parsedGrammar = parseGrammar(grammar);
    const normalizedString = String(string ?? "").replace(/\s+/g, "");

    const leftmost = generateLeftmostDerivation(parsedGrammar, startSymbol, normalizedString);
    const rightmost = generateRightmostDerivation(parsedGrammar, startSymbol, normalizedString);
    const tree =
      leftmost && leftmost.length > 0
        ? buildParseTreeFromDerivation(leftmost, startSymbol, parsedGrammar)
        : rightmost && rightmost.length > 0
          ? buildParseTreeFromDerivation(rightmost, startSymbol, parsedGrammar)
          : null;

    res.json({
      success: true,
      grammar: parsedGrammar,
      input: normalizedString,
      startSymbol,
      leftmost,
      rightmost,
      tree
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { deriveString };