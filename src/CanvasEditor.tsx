import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { atomEffect } from "jotai-effect";
import { useSubscribeArrayBufferEvent } from "./arrayBufferEffect";
import { useShortcut } from "./shortcut";
import { copyCanvas } from "./utils/copyCanvas";
import { useSubscribeMouseEvent } from "./mouseEvent";

const canvasRawAtom = atom<HTMLCanvasElement | null>(null);
export const canvasAtom = atom<HTMLCanvasElement>((get) => {
  const canvas = get(canvasRawAtom);
  if (canvas) return canvas;

  throw new Error("canvas not found");
});

const initCanvasEffect = atomEffect((get) => {
  const canvas = get(canvasAtom);
  if (!canvas) return;
  initCanvas(canvas);
});
export const CanvasEditor = () => {
  useAtomValue(initCanvasEffect);
  useShortcut();
  useSubscribeArrayBufferEvent();

  return (
    <>
      <Tool />
      <Canvas />
    </>
  );
};
function Tool() {
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
      }}
    >
      <ColorInput />
      <ColorHistory />
      <StrokeWidthInput />
    </div>
  );
}

const colorRawAtom = atom("#000000");
export const colorAtom = atom((get) => get(colorRawAtom));
function ColorInput() {
  const [color, setColor] = useAtom(colorRawAtom);
  const updateColorHistory = useSetAtom(updateColorHistoryAtom);
  return (
    <input
      type="color"
      value={color}
      onChange={(e) => setColor(e.target.value)}
      onBlur={() => {
        updateColorHistory(color);
      }}
    />
  );
}

const colorHistoryAtom = atom<string[]>([]);
const updateColorHistoryAtom = atom(null, (get, set, color: string) => {
  const colorHistory = get(colorHistoryAtom);
  if (colorHistory.includes(color)) return;
  const newHistory = [...colorHistory, color];
  // 保存する履歴数を5に制限
  set(colorHistoryAtom, newHistory.slice(-5));
});
function ColorHistory() {
  const colorHistory = useAtomValue(colorHistoryAtom);
  const setColor = useSetAtom(colorRawAtom);
  return (
    <div>
      {colorHistory.map((color) => (
        <button key={color} onClick={() => setColor(color)}>
          <div
            style={{
              width: 20,
              height: 20,
              background: color,
              border: "1px solid #000",
            }}
          ></div>
        </button>
      ))}
    </div>
  );
}

export const lineWidthAtom = atom(2);
function StrokeWidthInput() {
  const [strokeWidth, setStrokeWidth] = useAtom(lineWidthAtom);
  return (
    <input
      type="number"
      value={strokeWidth}
      onChange={(e) => setStrokeWidth(Number(e.target.value))}
    />
  );
}

function Canvas() {
  const setCanvas = useSetAtom(canvasRawAtom);
  useAtomValue(initCanvasEffect);
  useShortcut();
  useSubscribeArrayBufferEvent();

  const setMouseEvent = useSubscribeMouseEvent();

  return (
    <canvas
      ref={(el) => { if (el) setCanvas(el); }}
      width={600}
      height={400}
      style={{ border: "1px solid #000", background: "white" }}
      onPointerDown={setMouseEvent}
      onPointerMove={setMouseEvent}
      onPointerUp={setMouseEvent}
      onPointerLeave={setMouseEvent}
      onPointerEnter={setMouseEvent}
      onPointerOut={setMouseEvent}
      onPointerOver={setMouseEvent}
      onPointerCancel={setMouseEvent}
    />
  );
}
export function CopyButton() {
  const canvas = useAtomValue(canvasRawAtom);
  return (
    <button
      onClick={async () => {
        if (!canvas) return;
        await copyCanvas(canvas);

        if (window.opener) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          window.opener.postMessage("copied", "*");
          window.close();
        }
      }}
    >
      Copy to Clipboard
    </button>
  );
}

function initCanvas(canvas: HTMLCanvasElement) {
  // 白色で塗りつぶし
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
