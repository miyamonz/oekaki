import { atom, useAtomValue, useSetAtom } from "jotai";
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
  const setCanvas = useSetAtom(canvasRawAtom);
  useAtomValue(initCanvasEffect);
  useShortcut();
  useSubscribeArrayBufferEvent();

  const setMouseEvent = useSubscribeMouseEvent();

  return (
    <canvas
      ref={setCanvas}
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
};
export function CopyButton() {
  const canvas = useAtomValue(canvasRawAtom);
  return (
    <button
      onClick={() => {
        if (!canvas) return;
        copyCanvas(canvas);
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
