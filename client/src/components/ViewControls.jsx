import { ZoomIn, ZoomOut, LocateFixed, Download, Maximize, Map } from "lucide-react";

const ViewControls = ({
  onZoomIn,
  onZoomOut,
  onRecenter,
  onFullscreen,
  onExportPng,
  miniMapVisible,
  onToggleMiniMap,
}) => {
  const buttonStyle = {
    padding: '8px',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    background: 'var(--background)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <div 
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        display: 'flex',
        gap: '4px',
        zIndex: 10
      }}
    >
      <button
        onClick={onZoomIn}
        style={buttonStyle}
        title="Zoom In"
      >
        <ZoomIn size={16} />
      </button>
      <button
        onClick={onZoomOut}
        style={buttonStyle}
        title="Zoom Out"
      >
        <ZoomOut size={16} />
      </button>
      <button
        onClick={onRecenter}
        style={buttonStyle}
        title="Fit all"
      >
        <LocateFixed size={16} />
      </button>
      <button
        onClick={onToggleMiniMap}
        style={{
          ...buttonStyle,
          borderColor: miniMapVisible ? 'var(--accent)' : 'var(--border)',
        }}
        title={miniMapVisible ? "Hide minimap" : "Show minimap"}
      >
        <Map size={16} />
      </button>
      <button
        onClick={onFullscreen}
        style={buttonStyle}
        title="Fullscreen"
      >
        <Maximize size={16} />
      </button>
      <button
        onClick={onExportPng}
        style={buttonStyle}
        title="Export PNG"
      >
        <Download size={16} />
      </button>
    </div>
  );
};

export default ViewControls;
