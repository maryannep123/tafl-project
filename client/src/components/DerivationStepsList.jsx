const highlightExpanding = (sentential, mode) => {
  const s = sentential === '' ? 'ε' : String(sentential ?? '');
  const isNT = (ch) => /[A-Z]/.test(ch);
  if (s === 'ε') return [{ text: s, highlight: false }];

  const idx =
    mode === 'right'
      ? (() => {
          for (let i = s.length - 1; i >= 0; i--) if (isNT(s[i])) return i;
          return -1;
        })()
      : (() => {
          for (let i = 0; i < s.length; i++) if (isNT(s[i])) return i;
          return -1;
        })();

  if (idx === -1) return [{ text: s, highlight: false }];
  return [
    { text: s.slice(0, idx), highlight: false },
    { text: s.slice(idx, idx + 1), highlight: true },
    { text: s.slice(idx + 1), highlight: false },
  ].filter((p) => p.text.length > 0);
};

const DerivationStepsList = ({ steps, currentStep, onStepClick, mode }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 12 }}>
      <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700 }}>
        {mode === 'left' ? 'Leftmost' : 'Rightmost'} Derivation Steps
      </label>
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          maxHeight: '350px',
          overflowY: 'auto'
        }}
      >
        {steps.map((step, index) => (
          <div
            key={index}
            onClick={() => onStepClick(index)}
            style={{
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              cursor: 'pointer',
              borderRadius: '6px',
              background: index === currentStep ? 'var(--accent)' : 'transparent',
              color: index === currentStep ? 'var(--button-text)' : 'var(--text-primary)',
              transition: 'background 0.15s ease, color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (index === currentStep) return;
              e.currentTarget.style.background = 'rgba(124, 79, 47, 0.12)';
            }}
            onMouseLeave={(e) => {
              if (index === currentStep) return;
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{ fontSize: '12px', minWidth: '30px', color: index === currentStep ? 'var(--button-text)' : 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 700 }}>
              {index + 1}.
            </span>
            <span style={{ fontSize: '14px', color: index === currentStep ? 'var(--button-text)' : 'var(--text-primary)', fontFamily: 'monospace' }}>
              {highlightExpanding(step, mode).map((part, i) =>
                part.highlight ? (
                  <span
                    key={i}
                    style={{
                      background: 'rgba(250, 246, 240, 0.18)',
                      border: '1px solid rgba(250, 246, 240, 0.28)',
                      color: index === currentStep ? 'var(--button-text)' : 'var(--text-primary)',
                      padding: '1px 6px',
                      borderRadius: '999px',
                      margin: '0 2px',
                    }}
                  >
                    {part.text}
                  </span>
                ) : (
                  <span key={i}>{part.text}</span>
                )
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DerivationStepsList;
