import { useState, useEffect } from "react";
import { Sun, Moon, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import axios from "axios";
import GrammarEditor from "./components/GrammarEditor";
import DerivationStepsList from "./components/DerivationStepsList";
import PlaybackControls from "./components/PlaybackControls";
import ViewControls from "./components/ViewControls";
import ParseTreeCanvas from "./components/ParseTreeCanvas";

function App() {
  const [grammarRules, setGrammarRules] = useState([{ lhs: 'S', rhs: 'aSb|ε' }]);
  const [inputString, setInputString] = useState("aaabbb");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("left");
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  const examples = [
    {
      id: "anbn-epsilon",
      label: "aⁿbⁿ (S → aSb | ε) · aaabbb",
      grammar: [{ lhs: "S", rhs: "aSb|ε" }],
      input: "aaabbb",
    },
    {
      id: "anbn-ab",
      label: "aⁿbⁿ (S → AB, A → aA|a, B → bB|b) · aaabbb",
      grammar: [
        { lhs: "S", rhs: "AB" },
        { lhs: "A", rhs: "aA|a" },
        { lhs: "B", rhs: "bB|b" },
      ],
      input: "aaabbb",
    },
    {
      id: "palindrome",
      label: "Palindrome over {a,b} · abba",
      grammar: [{ lhs: "S", rhs: "aSa|bSb|a|b|ε" }],
      input: "abba",
    },
    {
      id: "expr-ambiguous",
      label: "Ambiguous expr (E → E+E | E*E | (E) | id) · id+id*id",
      grammar: [{ lhs: "E", rhs: "E+E|E*E|(E)|id" }],
      input: "id+id*id",
    },
  ];

  const handleSelectExample = (id) => {
    const ex = examples.find((e) => e.id === id);
    if (!ex) return;
    setGrammarRules(ex.grammar);
    setInputString(ex.input);
    setResult(null);
    setError("");
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const handleCopyGrammar = async () => {
    const lines = grammarRules
      .map((r) => {
        const lhs = (r.lhs ?? "").trim();
        const rhs = (r.rhs ?? "").trim();
        if (!lhs || !rhs) return null;
        return `${lhs} -> ${rhs}`;
      })
      .filter(Boolean)
      .join("\n");
    if (!lines) return;
    try {
      await navigator.clipboard.writeText(lines);
    } catch {
      // ignore
    }
  };

  const addGrammarRule = () => {
    setGrammarRules([...grammarRules, { lhs: '', rhs: '' }]);
  };

  const removeGrammarRule = (index) => {
    setGrammarRules(grammarRules.filter((_, i) => i !== index));
  };

  const updateGrammarRule = (index, field, value) => {
    const updatedRules = [...grammarRules];
    updatedRules[index][field] = value;
    setGrammarRules(updatedRules);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setCurrentStep(0);

    try {
      const normalizedGrammar = grammarRules
        .map((rule) => {
          const lhsRaw = (rule.lhs ?? "").trim();
          const rhsRaw = (rule.rhs ?? "").trim();

          // Allow pasting full rules like "S -> AB" or "S → AB" into either field.
          const combined = rhsRaw ? `${lhsRaw} -> ${rhsRaw}` : lhsRaw;
          const arrowMatch = combined.match(/^(.*?)\s*(?:->|→)\s*(.*)$/);
          if (arrowMatch) {
            return { lhs: arrowMatch[1].trim(), rhs: arrowMatch[2].trim() };
          }

          return { lhs: lhsRaw, rhs: rhsRaw };
        })
        .filter((r) => r.lhs && r.rhs);

      const res = await axios.post("/api/derive", {
        grammar: normalizedGrammar,
        string: inputString,
        startSymbol: normalizedGrammar[0]?.lhs || "S",
      });

      if (!res.data.leftmost && !res.data.rightmost) {
        setError("This string does not fall valid under the given grammar.");
      } else {
        setResult(res.data);
      }
    } catch (err) {
      setError("This string does not fall valid under the given grammar.");
    } finally {
      setLoading(false);
    }
  };

  const steps = mode === "left" ? result?.leftmost : result?.rightmost;
  const tree = result?.tree;

  const [isAnimatingTree, setIsAnimatingTree] = useState(false);

  useEffect(() => {
    if (!isPlaying || !steps || steps.length === 0) return;
    if (isAnimatingTree) return;
    if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }

    // Speed controls only the pause between steps; animations run at fixed timing.
    const pauseMs = Math.max(0, 700 / playbackSpeed);
    const id = setTimeout(() => {
      setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
    }, pauseMs);

    return () => clearTimeout(id);
  }, [isPlaying, steps, playbackSpeed, currentStep, isAnimatingTree]);

  const handleClear = () => {
    setResult(null);
    setError("");
    setCurrentStep(0);
    setIsPlaying(false);
  };

  return (
    <div className="app-shell">
      <div className="app-header">
        <div>
          <h1 className="app-title">CFG Visualiser</h1>
          <p className="app-subtitle">Context-Free Grammar · Derivation · Parse Tree</p>
        </div>
        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={() => setIsLeftCollapsed((v) => !v)}
            title={isLeftCollapsed ? "Expand left panel" : "Collapse left panel"}
          >
            {isLeftCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <button
            className="icon-btn"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      <div className="layout">
        <div className={`sidebar ${isLeftCollapsed ? "collapsed" : ""}`} aria-hidden={isLeftCollapsed}>
          {!isLeftCollapsed && (
            <div className="sidebar-scroll">
              <GrammarEditor
                grammarRules={grammarRules}
                inputString={inputString}
                examples={examples}
                onSelectExample={handleSelectExample}
                onCopyGrammar={handleCopyGrammar}
                onAddRule={addGrammarRule}
                onRemoveRule={removeGrammarRule}
                onUpdateRule={updateGrammarRule}
                onInputChange={setInputString}
                mode={mode}
                onModeChange={setMode}
                onSubmit={handleSubmit}
                onClear={handleClear}
                loading={loading}
                error={error}
              />

              {steps && steps.length > 0 && (
                <DerivationStepsList
                  steps={steps}
                  currentStep={currentStep}
                  onStepClick={setCurrentStep}
                  mode={mode}
                />
              )}
            </div>
          )}
        </div>

        <div className="main">
          {steps && steps.length > 0 && (
            <div className="topbar">
              <PlaybackControls
                currentStep={currentStep}
                totalSteps={steps.length}
                onPrev={() => setCurrentStep(Math.max(0, currentStep - 1))}
                onNext={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                onPlayPause={() => setIsPlaying(!isPlaying)}
                isPlaying={isPlaying}
                speed={playbackSpeed}
                onSpeedChange={setPlaybackSpeed}
              />
            </div>
          )}

          <div className="tree-area">
            {tree ? (
              <ParseTreeCanvas
                tree={tree}
                grammar={result?.grammar}
                steps={steps}
                currentStep={currentStep}
                onAnimatingChange={setIsAnimatingTree}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Submit grammar to view parse tree
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;