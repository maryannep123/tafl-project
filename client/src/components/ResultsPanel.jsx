

import ParseTree from "./ParseTree";

const ResultsPanel = ({ result, mode, setMode }) => {
  if (!result) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-400">
        Generate a string to view derivations and parse tree.
      </div>
    );
  }

  const steps = mode === "left" ? result.leftmost : result.rightmost;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Results</h2>

          <div className="flex gap-2">
            <button
              onClick={() => setMode("left")}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${mode === "left" ? "bg-emerald-500 text-black" : "bg-zinc-800 text-white"}`}
            >
              Left View
            </button>

            <button
              onClick={() => setMode("right")}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${mode === "right" ? "bg-emerald-500 text-black" : "bg-zinc-800 text-white"}`}
            >
              Right View
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-zinc-950 p-4">
          <p className="text-sm text-zinc-400">Input String</p>
          <p className="font-semibold">{result.input}</p>
        </div>

        <div className="mt-4 rounded-xl bg-zinc-950 p-4">
          <h3 className="mb-3 font-semibold">
            {mode === "left" ? "Leftmost Derivation" : "Rightmost Derivation"}
          </h3>

          <ol className="space-y-2 text-sm text-zinc-300">
            {steps?.map((step, index) => (
              <li key={index}>
                {index + 1}. {step === "" ? "ε" : step}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <ParseTree tree={result.tree} />
    </div>
  );
};

export default ResultsPanel;