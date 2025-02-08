import { atom, useSetAtom, useAtomValue } from "jotai";
import { atomEffect } from "jotai-effect";
import { canvasAtom } from "./CanvasEditor";

export function useSubscribeMouseEvent() {
  const setMouseEvent = useSetAtom(mouseEventAtom);
  useAtomValue(drawEffect);
  return setMouseEvent;
}

const mouseEventAtom = atom<React.MouseEvent<HTMLCanvasElement> | null>(null);

const drawEffect = atomEffect((get, set) => {
  const event = get(mouseEventAtom);
  if (!event) return;
  //   console.log(event);

  const canvas = get(canvasAtom);

  switch (event.type) {
    case "pointerdown": {
      set(isDrawingAtom, true);
      set(isDrawingAtom, true);
      const point = getPoint(canvas, event);
      set(lastPointAtom, point);
      break;
    }
    case "pointermove": {
      if (!get(isDrawingAtom)) return;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;

      const currentPoint = getPoint(canvas, event);
      const lastPoint = get(lastPointAtom);
      stroke(ctx, lastPoint, currentPoint);

      set(lastPointAtom, currentPoint);
      break;
    }
    case "pointerup": {
      set(isDrawingAtom, false);
      break;
    }
    case "pointerleave": {
      set(isDrawingAtom, false);
      break;
    }
  }
});

const isDrawingAtom = atom(false);

type Point = { x: number; y: number };
const lastPointAtom = atom<Point>({ x: 0, y: 0 });

function getPoint(
  canvas: HTMLCanvasElement,
  event: React.MouseEvent<HTMLCanvasElement>
) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function stroke(ctx: CanvasRenderingContext2D, from: Point, to: Point) {
  // 前回の座標から現在の座標まで線を描画
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.strokeStyle = "#000"; // 線の色（黒）
  ctx.lineWidth = 2; // 線の太さ
  ctx.stroke();
}
