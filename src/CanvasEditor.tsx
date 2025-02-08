import { atom, useAtom, useAtomValue } from "jotai";
import { atomEffect } from "jotai-effect";
import { useRef } from "react";
import { arrayBufferEffect } from "./arrayBufferEffect";
import { useShortcut } from "./shortcut";
import { copyCanvas } from "./utils/copyCanvas";

export const canvasAtom = atom<HTMLCanvasElement | null>(null);

const initCanvasEffect = atomEffect((get) => {
  const canvas = get(canvasAtom);
  if (!canvas) return;
  initCanvas(canvas);
});
const isDrawingAtom = atom(false);
export const CanvasEditor = () => {
  const [canvas, setCanvas] = useAtom(canvasAtom);
  useAtomValue(initCanvasEffect);
  useShortcut();
  useAtomValue(arrayBufferEffect);
  const [isDrawing, setIsDrawing] = useAtom(isDrawingAtom);
  const lastPointRef = useRef({ x: 0, y: 0 });

  // マウスを押し始めたときの処理
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    // キャンバス上での座標を計算
    lastPointRef.current = pos;
    setIsDrawing(true);
  };

  // マウスを動かしたときの処理
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvas) return;

    if (!isDrawing) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const currentPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    stroke(ctx, lastPointRef.current, currentPoint);

    lastPointRef.current = currentPoint;
  };

  // マウスを離したときの処理
  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  return (
    <canvas
      ref={setCanvas}
      width={600}
      height={400}
      style={{ border: "1px solid #000", background: "white" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};
export function CopyButton() {
  const canvas = useAtomValue(canvasAtom);
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
function stroke(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number }
) {
  // 前回の座標から現在の座標まで線を描画
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.strokeStyle = "#000"; // 線の色（黒）
  ctx.lineWidth = 2; // 線の太さ
  ctx.stroke();
}
