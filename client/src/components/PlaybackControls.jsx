import { SkipBack, Play, Pause, SkipForward } from "lucide-react";

const PlaybackControls = ({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  onPlayPause,
  isPlaying,
  speed,
  onSpeedChange
}) => {
  const baseButton = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--surface-2)',
    fontSize: '15px',
    fontWeight: 500,
  };

  const maxIndex = Math.max(0, (totalSteps ?? 1) - 1);
  const progress = maxIndex === 0 ? 0 : currentStep / maxIndex;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '18px', width: '100%', maxWidth: '980px' }}>
      <button
        onClick={onPrev}
        disabled={currentStep === 0}
        style={{
          ...baseButton,
          color: currentStep === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
          cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
          opacity: currentStep === 0 ? 0.5 : 1
        }}
      >
        <SkipBack size={20} />
        Prev
      </button>

      <button
        onClick={onPlayPause}
        style={{
          ...baseButton,
          color: 'var(--text-primary)',
          cursor: 'pointer',
        }}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        {isPlaying ? 'Pause' : 'Play'}
      </button>

      <button
        onClick={onNext}
        disabled={currentStep === totalSteps - 1}
        style={{
          ...baseButton,
          color: currentStep === totalSteps - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
          cursor: currentStep === totalSteps - 1 ? 'not-allowed' : 'pointer',
          opacity: currentStep === totalSteps - 1 ? 0.5 : 1
        }}
      >
        Next
        <SkipForward size={20} />
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 220 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700 }}>
            Step {currentStep + 1} / {totalSteps}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700 }}>
            Speed {speed}×
          </span>
        </div>

        <div style={{ height: 8, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.round(progress * 100)}%`, background: 'var(--accent)' }} />
        </div>

        <input
          type="range"
          min={0.5}
          max={4}
          step={0.5}
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent)' }}
          aria-label="Playback speed"
        />
      </div>
    </div>
  );
};

export default PlaybackControls;
