import { useState, useCallback, useRef, useEffect } from "react";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { atomEffect } from "jotai-effect";
import { useSubscribeMessageEvent, useDrawPendingImage, waitingForImageAtom } from "./arrayBufferEffect";
import { useShortcut } from "./shortcut";
import { copyCanvas, canvasToBlob } from "./utils/copyCanvas";
import { useSubscribeMouseEvent } from "./mouseEvent";
import {
  canUndoAtom,
  canRedoAtom,
  undoAtom,
  redoAtom,
  saveToHistoryAtom,
} from "./history";

const canvasRawAtom = atom<HTMLCanvasElement | null>(null);
export const canvasAtom = atom<HTMLCanvasElement>((get) => {
  const canvas = get(canvasRawAtom);
  if (canvas) return canvas;

  throw new Error("canvas not found");
});

export type Tool = "pen" | "eraser";
export const toolAtom = atom<Tool>("pen");

export const canvasWidthAtom = atom(600);
export const canvasHeightAtom = atom(400);

const canvasSizeEffect = atomEffect((get) => {
  const canvas = get(canvasAtom);
  if (!canvas) return;
  const w = get(canvasWidthAtom);
  const h = get(canvasHeightAtom);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 初回: まだサイズ未設定
  if (canvas.width === 0 && canvas.height === 0) {
    canvas.width = w;
    canvas.height = h;
    initCanvas(canvas);
    return;
  }

  // サイズが同じなら何もしない
  if (canvas.width === w && canvas.height === h) return;

  // 現在の内容を保存してリサイズ
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  canvas.width = w;
  canvas.height = h;
  initCanvas(canvas);
  ctx.putImageData(imageData, 0, 0);
});


export const CanvasEditor = () => {
  useSubscribeMessageEvent();
  const waiting = useAtomValue(waitingForImageAtom);

  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage({ type: "oekaki:ready" }, "*");
    }
  }, []);

  if (waiting) {
    return <div className="loading-overlay">Loading...</div>;
  }

  return <CanvasEditorInner />;
};

const CanvasEditorInner = () => {
  useAtomValue(canvasSizeEffect);
  useShortcut();
  useDrawPendingImage();

  return (
    <>
      <Toolbar />
      <Canvas />
      <BottomToolbar />
    </>
  );
};

const PRESET_COLORS = [
  "#000000",
  "#ffffff",
  "#ff0000",
  "#0000ff",
  "#00aa00",
  "#ffcc00",
  "#ff6600",
  "#8800aa",
  "#888888",
];

function Divider() {
  return <div className="toolbar-divider" />;
}

function Toolbar() {
  return (
    <div className="toolbar">
      <ToolSection />
      <Divider />
      <ColorSection />
      <Divider />
      <LineWidthSection />
      <Divider />
      <ActionSection />
    </div>
  );
}

function ToolSection() {
  const [tool, setTool] = useAtom(toolAtom);
  return (
    <div className="toolbar-section">
      <button
        className={`tool-btn ${tool === "pen" ? "active" : ""}`}
        onClick={() => setTool("pen")}
      >
        Pen
      </button>
      <button
        className={`tool-btn ${tool === "eraser" ? "active" : ""}`}
        onClick={() => setTool("eraser")}
      >
        Eraser
      </button>
    </div>
  );
}

const colorRawAtom = atom("#000000");
export const colorAtom = atom((get) => get(colorRawAtom));

function ColorSection() {
  const [color, setColor] = useAtom(colorRawAtom);
  const setTool = useSetAtom(toolAtom);
  const updateColorHistory = useSetAtom(updateColorHistoryAtom);

  const selectColor = (c: string) => {
    setColor(c);
    setTool("pen");
    updateColorHistory(c);
  };

  return (
    <div className="toolbar-section">
      <input
        className="current-color"
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        onBlur={() => updateColorHistory(color)}
      />
      <div className="color-palette">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            className="color-swatch"
            style={{ background: c }}
            onClick={() => selectColor(c)}
          />
        ))}
      </div>
      <ColorHistory />
    </div>
  );
}

const colorHistoryAtom = atom<string[]>([]);
const updateColorHistoryAtom = atom(null, (get, set, color: string) => {
  const colorHistory = get(colorHistoryAtom);
  // プリセットに含まれる色や既に履歴にある色は追加しない
  if (PRESET_COLORS.includes(color) || colorHistory.includes(color)) return;
  const newHistory = [...colorHistory, color];
  set(colorHistoryAtom, newHistory.slice(-5));
});

function ColorHistory() {
  const colorHistory = useAtomValue(colorHistoryAtom);
  const setColor = useSetAtom(colorRawAtom);
  if (colorHistory.length === 0) return null;
  return (
    <div className="color-palette">
      {colorHistory.map((c) => (
        <button
          key={c}
          className="color-swatch"
          style={{ background: c }}
          onClick={() => setColor(c)}
        />
      ))}
    </div>
  );
}

const LINE_WIDTH_PRESETS = [1, 2, 4, 8, 14, 24];

export const lineWidthAtom = atom(2);

function LineWidthSection() {
  const [lineWidth, setLineWidth] = useAtom(lineWidthAtom);
  return (
    <div className="toolbar-section">
      <div className="line-width-section">
        {LINE_WIDTH_PRESETS.map((w) => (
          <button
            key={w}
            className={`width-swatch ${lineWidth === w ? "active" : ""}`}
            onClick={() => setLineWidth(w)}
            title={`${w}px`}
          >
            <svg width={28} height={28} viewBox="0 0 28 28">
              <circle
                cx={14}
                cy={14}
                r={Math.max(w / 2, 0.5)}
                fill="#333"
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

function CanvasSizeSection() {
  const [width, setWidth] = useAtom(canvasWidthAtom);
  const [height, setHeight] = useAtom(canvasHeightAtom);
  return (
    <div className="toolbar-section">
      <div className="canvas-size-section">
        <input
          className="size-input"
          type="number"
          min={100}
          max={2000}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
        />
        <span className="size-x">x</span>
        <input
          className="size-input"
          type="number"
          min={100}
          max={2000}
          value={height}
          onChange={(e) => setHeight(Number(e.target.value))}
        />
      </div>
    </div>
  );
}

function ActionSection() {
  const undo = useSetAtom(undoAtom);
  const redo = useSetAtom(redoAtom);
  const canUndo = useAtomValue(canUndoAtom);
  const canRedo = useAtomValue(canRedoAtom);
  const saveToHistory = useSetAtom(saveToHistoryAtom);
  const clearCanvas = useClearCanvas();

  return (
    <div className="toolbar-section">
      <button className="tool-btn" onClick={undo} disabled={!canUndo}>
        Undo
      </button>
      <button className="tool-btn" onClick={redo} disabled={!canRedo}>
        Redo
      </button>
      <button
        className="tool-btn"
        onClick={() => {
          clearCanvas();
          saveToHistory();
        }}
      >
        Clear
      </button>
    </div>
  );
}

function useClearCanvas() {
  const canvas = useAtomValue(canvasRawAtom);
  return () => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };
}

function Canvas() {
  const setCanvas = useSetAtom(canvasRawAtom);
  useAtomValue(canvasSizeEffect);
  useShortcut();

  const setMouseEvent = useSubscribeMouseEvent();
  const lineWidth = useAtomValue(lineWidthAtom);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setMouseEvent(e);
    },
    [setMouseEvent],
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      setCursor(null);
      setMouseEvent(e);
    },
    [setMouseEvent],
  );

  return (
    <div className="canvas-area">
      <canvas
        ref={(el) => {
          if (el) setCanvas(el);
        }}
        onPointerDown={setMouseEvent}
        onPointerMove={handlePointerMove}
        onPointerUp={setMouseEvent}
        onPointerLeave={handlePointerLeave}
        onPointerEnter={setMouseEvent}
        onPointerOut={setMouseEvent}
        onPointerOver={setMouseEvent}
        onPointerCancel={setMouseEvent}
      />
      {cursor && (
        <div
          className="brush-cursor"
          style={{
            left: cursor.x,
            top: cursor.y,
            width: lineWidth,
            height: lineWidth,
          }}
        />
      )}
      <ResizeHandle />
    </div>
  );
}

function ResizeHandle() {
  const setWidth = useSetAtom(canvasWidthAtom);
  const setHeight = useSetAtom(canvasHeightAtom);
  const dragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0, w: 0, h: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      setWidth(Math.max(100, startPos.current.w + dx));
      setHeight(Math.max(100, startPos.current.h + dy));
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [setWidth, setHeight]);

  return (
    <div
      className="resize-handle"
      onPointerDown={(e) => {
        dragging.current = true;
        const area = e.currentTarget.closest(".canvas-area");
        const canvas = area?.querySelector("canvas");
        startPos.current = {
          x: e.clientX,
          y: e.clientY,
          w: canvas?.width ?? 600,
          h: canvas?.height ?? 400,
        };
        e.preventDefault();
      }}
    />
  );
}

function BottomToolbar() {
  return (
    <div className="toolbar bottom-toolbar">
      <CanvasSizeSection />
    </div>
  );
}

export function CopyButton() {
  const canvas = useAtomValue(canvasRawAtom);
  const [copied, setCopied] = useState(false);
  return (
    <div className="bottom-bar">
      <button
        className={`tool-btn ${copied ? "copied" : ""}`}
        onClick={async () => {
          if (!canvas) return;
          await copyCanvas(canvas);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);

          if (window.opener) {
            await new Promise((resolve) => setTimeout(resolve, 10));
            window.opener.postMessage("copied", "*");
            window.close();
          }
        }}
      >
        {copied ? "Copied!" : "Copy to Clipboard"}
      </button>
      <SendToOpenerButton />
    </div>
  );
}

type SendState = "idle" | "sending" | "done";

function SendToOpenerButton() {
  const canvas = useAtomValue(canvasRawAtom);
  const [state, setState] = useState<SendState>("idle");
  const [hasOpener, setHasOpener] = useState(false);

  useEffect(() => {
    setHasOpener(!!window.opener);
  }, []);

  useEffect(() => {
    if (state !== "sending") return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type !== "oekaki:upload-complete") return;
      setState("done");
      window.close();
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [state]);

  if (!hasOpener) return null;

  const label = { idle: "Save to Cosense", sending: "Saving...", done: "Done!" }[state];

  return (
    <button
      className={`tool-btn save-btn ${state === "done" ? "copied" : ""}`}
      disabled={state !== "idle"}
      onClick={async () => {
        if (!canvas) return;
        setState("sending");
        const blob = await canvasToBlob(canvas);
        const buffer = await blob.arrayBuffer();
        window.opener.postMessage({ type: "oekaki:image", data: buffer }, "*", [buffer]);
      }}
    >
      {label}
    </button>
  );
}

function initCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
