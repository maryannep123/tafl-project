import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toPng } from 'html-to-image';
import ViewControls from './ViewControls';

const CfgNode = ({ data }) => {
  const isNonTerminal = !!data?.isNonTerminal;
  const isEpsilon = !!data?.isEpsilon;
  const isTerminal = !isNonTerminal;

  return (
    <div style={{ position: 'relative', width: 60, height: 60 }}>
      {/* Invisible handles so edges can attach (but user still can't connect) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ opacity: 0, width: 8, height: 8, pointerEvents: 'none' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ opacity: 0, width: 8, height: 8, pointerEvents: 'none' }}
      />

      <div
        className={`cfg-node-inner ${data?.enterClass || ''}`}
        style={{
          ...(data?.enterStyle || {}),
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: isEpsilon
            ? 'var(--node-fill-terminal)'
            : isNonTerminal
              ? 'var(--node-fill)'
              : 'var(--node-fill-terminal)',
          borderStyle: isTerminal && !isEpsilon ? 'dashed' : 'solid',
          borderWidth: isNonTerminal ? 2 : 1.5,
          borderColor: isNonTerminal ? 'var(--node-border-non-terminal)' : 'var(--node-border-terminal)',
          color: 'var(--node-text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontStyle: 'normal',
          fontWeight: 600,
          fontSize: 16,
          boxSizing: 'border-box',
        }}
      >
        {data?.label}
      </div>
    </div>
  );
};

const EDGE_MS = 250;
const NODE_MS = 300;
const STAGGER_MS = 80;

const ParseTreeCanvas = ({ tree, grammar, steps, currentStep, onAnimatingChange }) => {
  const wrapperRef = useRef(null);
  const exportAreaRef = useRef(null);
  const [rfInstance, setRfInstance] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [miniMapVisible, setMiniMapVisible] = useState(true);

  const buildTreeFromDerivation = useCallback((derivationSteps, startSymbol, grammarMap) => {
    if (!Array.isArray(derivationSteps) || derivationSteps.length === 0) return null;

    const createNode = (value) => ({
      value: value === "" ? "ε" : value,
      children: [],
    });

    const nonTerminals = grammarMap
      ? Object.keys(grammarMap).sort((a, b) => b.length - a.length)
      : [];

    const tokenize = (sentential) => {
      const s = String(sentential ?? "");
      const out = [];
      for (let i = 0; i < s.length; ) {
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

    const isNonTerminal = (sym) => /^[A-Z][A-Za-z0-9_]*$/.test(sym);
    const firstDiffIndex = (aTokens, bTokens) => {
      const min = Math.min(aTokens.length, bTokens.length);
      let i = 0;
      while (i < min && aTokens[i] === bTokens[i]) i++;
      return i;
    };

    const root = createNode(startSymbol);
    let frontier = [root];

    for (let i = 0; i < derivationSteps.length - 1; i++) {
      const fromTokens = tokenize(derivationSteps[i]);
      const toTokens = tokenize(derivationSteps[i + 1]);

      let start = firstDiffIndex(fromTokens, toTokens);
      if (start >= fromTokens.length && start >= toTokens.length) continue;

      const delta = toTokens.length - fromTokens.length;
      // Handle prefix-expansion like E -> E+E where `fromTokens` is a strict prefix of `toTokens`.
      if (delta > 0 && start === fromTokens.length && fromTokens.length > 0) {
        start = fromTokens.length - 1;
      }

      const replaced = fromTokens[start] ?? "";
      const producedLen = Math.max(0, 1 + delta);
      const producedTokens = producedLen === 0 ? [""] : toTokens.slice(start, start + producedLen);

      if (!isNonTerminal(replaced) || frontier.length !== fromTokens.length) return root;

      const targetNode = frontier[start];
      targetNode.children = producedTokens.map((t) => createNode(t));

      frontier = [
        ...frontier.slice(0, start),
        ...targetNode.children,
        ...frontier.slice(start + 1),
      ];
    }

    return root;
  }, []);

  const getFrontierPulseNodeId = useCallback(() => {
    if (!steps || steps.length === 0) return null;
    const upto = Math.min(Math.max(currentStep, 0), steps.length - 1);

    const nonTerminals = grammar ? Object.keys(grammar).sort((a, b) => b.length - a.length) : [];
    const tokenize = (sentential) => {
      const s = String(sentential ?? "");
      const out = [];
      for (let i = 0; i < s.length; ) {
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
    const isNonTerminal = (sym) => /^[A-Z][A-Za-z0-9_]*$/.test(sym);

    // Rebuild only the frontier node ids up to `upto` and return the next node to expand.
    let frontierIds = ['node-0'];
    for (let i = 0; i < upto; i++) {
      const fromTokens = tokenize(steps[i]);
      const toTokens = tokenize(steps[i + 1]);
      let start = 0;
      const min = Math.min(fromTokens.length, toTokens.length);
      while (start < min && fromTokens[start] === toTokens[start]) start++;
      if (start >= fromTokens.length && start >= toTokens.length) continue;
      const delta = toTokens.length - fromTokens.length;
      if (delta > 0 && start === fromTokens.length && fromTokens.length > 0) start = fromTokens.length - 1;
      const replaced = fromTokens[start] ?? "";
      if (!isNonTerminal(replaced) || frontierIds.length !== fromTokens.length) return null;
      const producedLen = Math.max(0, 1 + delta);
      const producedTokens = producedLen === 0 ? [""] : toTokens.slice(start, start + producedLen);
      const parentId = frontierIds[start];
      const childIds = producedTokens.map((_, idx) => `${parentId}-${idx}`);
      frontierIds = [...frontierIds.slice(0, start), ...childIds, ...frontierIds.slice(start + 1)];
    }

    const curTokens = tokenize(steps[upto]);
    const candidates = curTokens
      .map((t, idx) => ({ t, idx }))
      .filter(({ t }) => isNonTerminal(t));
    if (candidates.length === 0) return null;
    const idx = candidates[0].idx; // leftmost (matches current UI behaviour)
    return frontierIds[idx] || null;
  }, [steps, currentStep, grammar]);

  const convertTreeToNodes = useCallback((treeData) => {
    if (!treeData) return { nodes: [], edges: [] };

    const nodes = [];
    const edges = [];
    const seenIds = new Set();

    const NODE_SIZE = 60;
    const X_GAP = 40;
    const Y_GAP = 110;

    const subtreeWidth = (node) => {
      if (!node.children || node.children.length === 0) return NODE_SIZE;
      const widths = node.children.map(subtreeWidth);
      const total = widths.reduce((a, b) => a + b, 0) + X_GAP * (widths.length - 1);
      return Math.max(NODE_SIZE, total);
    };

    const traverse = (node, parentId = null, depth = 0, centerX = 0, path = '0') => {
      const id = `node-${path}`;
      if (seenIds.has(id)) return;
      seenIds.add(id);
      const isNonTerminal = /[A-Z]/.test(node.value);
      const isEpsilon = node.value === '' || node.value === 'ε';

      nodes.push({
        id,
        position: { x: centerX, y: depth * Y_GAP },
        data: { 
          label: node.value === '' ? 'ε' : node.value,
          isNonTerminal,
          isEpsilon
        },
        type: 'cfg',
      });

      if (parentId) {
        edges.push({
          id: `edge-${parentId}-${id}`,
          source: parentId,
          target: id,
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: 'var(--edge)',
            strokeWidth: 1.5,
            strokeLinecap: 'round',
            opacity: 1,
            strokeDasharray: undefined,
          },
          markerEnd: {
            type: MarkerType.Arrow,
            color: 'var(--edge)',
            width: 16,
            height: 16
          }
        });
      }

      if (node.children && node.children.length > 0) {
        const widths = node.children.map(subtreeWidth);
        const total = widths.reduce((a, b) => a + b, 0) + X_GAP * (widths.length - 1);
        let left = centerX - total / 2;

        node.children.forEach((child, index) => {
          const w = widths[index];
          const childCenter = left + w / 2;
          traverse(child, id, depth + 1, childCenter, `${path}-${index}`);
          left += w + X_GAP;
        });
      }
    };

    traverse(treeData, null, 0, 0, '0');
    return { nodes, edges };
  }, []);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    // Render a partial tree that grows with the derivation controls.
    if (steps && steps.length > 0) {
      const upto = Math.min(Math.max(currentStep, 0), steps.length - 1);
      const partial = buildTreeFromDerivation(steps.slice(0, upto + 1), steps[0], grammar);
      return convertTreeToNodes(partial);
    }
    return convertTreeToNodes(tree);
  }, [tree, grammar, steps, currentStep, buildTreeFromDerivation, convertTreeToNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const prevStepRef = useRef(currentStep);
  const timeoutsRef = useRef([]);

  useEffect(() => {
    // Cancel any pending animations on step jumps.
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    onAnimatingChange?.(false);

    const prevStep = prevStepRef.current;
    prevStepRef.current = currentStep;

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shouldAnimate = !reduceMotion && currentStep === prevStep + 1;
    if (!shouldAnimate) {
      // For Prev (single step back), fade out removed nodes first (if motion allowed).
      if (!reduceMotion && currentStep === prevStep - 1) {
        const targetIds = new Set(initialNodes.map((n) => n.id));
        const removedIds = nodes.filter((n) => !targetIds.has(n.id)).map((n) => n.id);
        if (removedIds.length > 0) {
          setNodes((curr) =>
            curr.map((n) =>
              removedIds.includes(n.id)
                ? { ...n, data: { ...n.data, enterClass: 'node-exit', enterStyle: {} } }
                : n
            )
          );
          const t = setTimeout(() => {
            setNodes(initialNodes.map((n) => ({ ...n, data: { ...n.data, enterClass: '', enterStyle: {} } })));
            setEdges(initialEdges.map((e) => ({ ...e, className: '', style: { ...e.style, '--edge-delay': '0ms' } })));
          }, 200);
          timeoutsRef.current.push(t);
          return;
        }
      }

      // Render target state instantly for jumps/clear.
      setNodes(initialNodes.map((n) => ({ ...n, data: { ...n.data, enterClass: '', enterStyle: {} } })));
      setEdges(initialEdges.map((e) => ({ ...e, className: '', style: { ...e.style, '--edge-delay': '0ms' } })));
      return;
    }

    // Animate only newly added elements.
    const prevNodeIds = new Set(nodes.map((n) => n.id));
    const prevEdgeIds = new Set(edges.map((e) => e.id));

    const nextNodes = initialNodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        enterClass: '',
        enterStyle: {},
      },
    }));
    const nextEdges = initialEdges.map((e) => ({ ...e, className: '', style: { ...(e.style || {}), '--edge-delay': '0ms' } }));

    const newNodeIds = new Set(nextNodes.filter((n) => !prevNodeIds.has(n.id)).map((n) => n.id));
    const newEdges = nextEdges.filter((e) => !prevEdgeIds.has(e.id));

    // Sort new children left-to-right by target x (stagger order).
    const nodeById = new Map(nextNodes.map((n) => [n.id, n]));
    const orderedNewNodeIds = Array.from(newNodeIds)
      .map((id) => nodeById.get(id))
      .filter(Boolean)
      .sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0))
      .map((n) => n.id);

    const delayForNodeId = new Map();
    orderedNewNodeIds.forEach((id, idx) => delayForNodeId.set(id, idx * STAGGER_MS));

    // Mark new edges for enter animation with stagger.
    const edgeById = new Map(newEdges.map((e) => [e.id, e]));
    for (const e of nextEdges) {
      if (!edgeById.has(e.id)) continue;
      const targetDelay = delayForNodeId.get(e.target) ?? 0;
      e.className = 'edge-enter';
      e.style = { ...(e.style || {}), '--edge-delay': `${targetDelay}ms` };
    }

    // Mark new nodes for enter animation after their edge finishes (~50ms after line arrives).
    for (const n of nextNodes) {
      if (!newNodeIds.has(n.id)) continue;
      const d = delayForNodeId.get(n.id) ?? 0;
      n.data = {
        ...n.data,
        enterClass: 'node-enter',
        enterStyle: { '--node-delay': `${Math.max(0, EDGE_MS - 50 + d)}ms` },
      };
    }

    // Pulse the active frontier node.
    if (pulseId) {
      const pulseNode = nextNodes.find((n) => n.id === pulseId);
      if (pulseNode) {
        pulseNode.data = {
          ...pulseNode.data,
          enterClass: `${pulseNode.data.enterClass || ''} node-pulse`.trim(),
        };
      }
    }

    setEdges(nextEdges);
    setNodes(nextNodes);

    // Remove enter classes after animations complete.
    const childCount = orderedNewNodeIds.length;
    const totalMs = childCount === 0 ? 0 : (EDGE_MS - 50) + NODE_MS + (childCount - 1) * STAGGER_MS;
    if (totalMs > 0) onAnimatingChange?.(true);

    const t = setTimeout(() => {
      onAnimatingChange?.(false);
      setNodes((curr) => curr.map((n) => ({ ...n, data: { ...n.data, enterClass: '', enterStyle: {} } })));
      setEdges((curr) => curr.map((e) => ({ ...e, className: '', style: { ...(e.style || {}), '--edge-delay': '0ms' } })));
    }, totalMs + 20);
    timeoutsRef.current.push(t);
  }, [currentStep, initialNodes, initialEdges]); // intentionally omit nodes/edges to avoid retrigger loops

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const pulseId = getFrontierPulseNodeId();
  const nodeTypes = useMemo(() => ({ cfg: CfgNode }), []);

  const handleExportPng = useCallback(async () => {
    if (!exportAreaRef.current) return;

    try {
      setIsExporting(true);
      // Let React commit the "export mode" (hide minimap/background) before capture.
      await new Promise((r) => setTimeout(r, 0));

      const bg =
        getComputedStyle(document.documentElement).getPropertyValue('--background')?.trim() || undefined;

      const dataUrl = await toPng(exportAreaRef.current, {
        cacheBust: true,
        backgroundColor: bg,
        pixelRatio: 2,
        filter: (node) => {
          const el = node;
          if (!el || !el.classList) return true;
          // Remove the “box thingy” (minimap) + grid bg from exports
          if (el.classList.contains('react-flow__minimap')) return false;
          if (el.classList.contains('react-flow__background')) return false;
          if (el.classList.contains('react-flow__controls')) return false;
          return true;
        },
      });

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `cfg-tree-step-${currentStep + 1}.png`;
      a.click();
    } finally {
      setIsExporting(false);
    }
  }, [currentStep]);

  const handleRecenter = useCallback(() => {
    // Make the entire tree visible (fit all nodes).
    rfInstance?.fitView?.({ padding: 0.25, duration: 250 });
  }, [rfInstance]);

  const handleFullscreen = useCallback(async () => {
    const el = wrapperRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // ignore if Fullscreen API not available
    }
  }, []);

  const exportFitAndRestore = useCallback(async () => {
    if (!rfInstance) return;
    const prevViewport = rfInstance.getViewport?.();
    rfInstance.fitView?.({ padding: 0.25, duration: 0 });
    await new Promise((r) => setTimeout(r, 50));
    try {
      await handleExportPng();
    } finally {
      if (prevViewport && rfInstance.setViewport) {
        rfInstance.setViewport(prevViewport, { duration: 0 });
      }
    }
  }, [rfInstance, handleExportPng]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ViewControls
        onZoomIn={() => rfInstance?.zoomIn?.({ duration: 150 })}
        onZoomOut={() => rfInstance?.zoomOut?.({ duration: 150 })}
        onRecenter={handleRecenter}
        onFullscreen={handleFullscreen}
        onExportPng={exportFitAndRestore}
        miniMapVisible={miniMapVisible}
        onToggleMiniMap={() => setMiniMapVisible((v) => !v)}
      />

      {/* Export area: tree only (no overlay controls) */}
      <div ref={exportAreaRef} style={{ position: 'absolute', inset: 0 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onInit={setRfInstance}
          nodesConnectable={false}
          edgesUpdatable={false}
          connectOnClick={false}
          fitView
          style={{ background: 'var(--background)' }}
        >
          {!isExporting && <Background color="var(--border)" gap={20} />}
          {/* Removed built-in Controls (we have our own at top-right) */}
          {!isExporting && miniMapVisible && (
            <MiniMap
              pannable
              zoomable
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
              }}
              nodeColor={(node) => {
                if (node.data.isEpsilon) return 'var(--node-fill)';
                if (node.data.isNonTerminal) return 'var(--accent)';
                return 'var(--node-fill-terminal)';
              }}
              maskColor="rgba(0, 0, 0, 0.5)"
            />
          )}
        </ReactFlow>
      </div>
    </div>
  );
};

export default ParseTreeCanvas;
