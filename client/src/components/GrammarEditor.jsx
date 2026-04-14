const GrammarEditor = ({
  grammarRules,
  inputString,
  examples,
  onSelectExample,
  onCopyGrammar,
  onAddRule,
  onRemoveRule,
  onUpdateRule,
  onInputChange,
  mode,
  onModeChange,
  onSubmit,
  onClear,
  loading,
  error
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Examples */}
      {examples && examples.length > 0 && (
        <div>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 600 }}>
            Examples
          </label>
          <select
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              onSelectExample?.(v);
              e.target.value = "";
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              boxShadow: 'none'
            }}
          >
            <option value="" disabled>Select an example grammar…</option>
            {examples.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Grammar Rules */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700 }}>
            Grammar Rules
          </label>
          <button
            type="button"
            onClick={onCopyGrammar}
            style={{
              padding: '8px 10px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 650,
            }}
            title="Copy grammar"
          >
            Copy
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {grammarRules.map((rule, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', lineHeight: 1 }}>
              <input
                type="text"
                placeholder="S"
                value={rule.lhs}
                onChange={(e) => onUpdateRule(index, 'lhs', e.target.value)}
                style={{
                  width: '70px',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '16px', fontWeight: 700, paddingBottom: 1 }}>→</span>
              <input
                type="text"
                placeholder="aSb | ε"
                value={rule.rhs}
                onChange={(e) => onUpdateRule(index, 'rhs', e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              {grammarRules.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveRule(index)}
                  style={{
                    padding: '12px',
                    border: 'none',
                    background: 'transparent',
                    color: '#ff4d4d',
                    cursor: 'pointer',
                    fontSize: '20px',
                    borderRadius: '6px',
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={onAddRule}
            style={{
              padding: '12px',
              border: 'none',
              background: 'transparent',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: 500,
              borderRadius: 'var(--radius-sm)'
            }}
          >
            + Add Rule
          </button>
        </div>
      </div>

      {/* Input String */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 700 }}>
          Input String
        </label>
        <input
          type="text"
          value={inputString}
          onChange={(e) => onInputChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            background: 'transparent',
            color: 'var(--text-primary)',
            fontFamily: 'monospace',
            fontSize: '14px',
            outline: 'none'
          }}
        />
      </div>

      {/* Derivation Mode Toggle */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 700 }}>
          Derivation Mode
        </label>
        <div className="segmented">
          <button
            type="button"
            onClick={() => onModeChange('left')}
            className={mode === 'left' ? 'active' : undefined}
          >
            Leftmost
          </button>
          <button
            type="button"
            onClick={() => onModeChange('right')}
            className={mode === 'right' ? 'active' : undefined}
          >
            Rightmost
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          style={{
            width: '100%',
            height: 44,
            padding: '0 14px',
            border: 'none',
            borderRadius: '8px',
            background: 'var(--button-primary)',
            color: 'var(--button-text)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '15px',
            fontWeight: 600,
            opacity: loading ? 0.6 : 1,
            boxShadow: 'none',
            transform: 'scale(1)',
            transition: 'transform 120ms ease, filter 120ms ease'
          }}
          onMouseEnter={(e) => {
            if (loading) return;
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.filter = 'brightness(1.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.filter = 'none';
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {loading && <span className="spinner" />}
            {loading ? 'Generating…' : 'Generate'}
          </span>
        </button>
        <button
          type="button"
          onClick={onClear}
          style={{
            width: '100%',
            height: 44,
            padding: '0 14px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            background: 'transparent',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 600,
            boxShadow: 'none'
          }}
        >
          Clear
        </button>
      </div>

      {/* Error */}
      {error && (
        <p style={{ color: 'var(--error)', fontSize: '15px', margin: 0, padding: '12px', background: 'rgba(255, 77, 77, 0.10)', borderRadius: '6px' }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default GrammarEditor;
