import { atom, useSetAtom, useAtomValue } from "jotai";
import { atomEffect } from "jotai-effect";
import { canvasAtom, colorAtom, lineWidthAtom, toolAtom } from "./CanvasEditor";
import { saveToHistoryAtom } from "./history";

export function useSubscribeMouseEvent() {
  const setMouseEvent = useSetAtom(mouseEventAtom);
  useAtomValue(drawEffect);
  return setMouseEvent;
}

const mouseEventAtom = atom<React.MouseEvent<HTMLCanvasElement> | null>(null);

const drawEffect = atomEffect((get, set) => {
  const event = get(mouseEventAtom);
  if (!event) return;

  const canvas = get(canvasAtom);
  const tool = get(toolAtom);

  switch (event.type) {
    case "pointerdown": {
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

      if (tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else {
        ctx.globalCompositeOperation = "source-over";
        const color = get(colorAtom);
        ctx.strokeStyle = color;
      }

      const lineWidth = get(lineWidthAtom);
      ctx.lineWidth = lineWidth;
      stroke(ctx, lastPoint, currentPoint);

      // compositeOperation をリセット
      ctx.globalCompositeOperation = "source-over";

      set(lastPointAtom, currentPoint);
      break;
    }
    case "pointerup": {
      if (get(isDrawingAtom)) {
        set(isDrawingAtom, false);
        set(saveToHistoryAtom);
      }
      break;
    }
    case "pointerleave": {
      if (get(isDrawingAtom)) {
        set(isDrawingAtom, false);
        set(saveToHistoryAtom);
      }
      break;
    }
  }
});

const isDrawingAtom = atom(false);

type Point = { x: number; y: number };
const lastPointAtom = atom<Point>({ x: 0, y: 0 });

function getPoint(
  canvas: HTMLCanvasElement,
  event: React.MouseEvent<HTMLCanvasElement>,
) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function stroke(ctx: CanvasRenderingContext2D, from: Point, to: Point) {
  ctx.beginPath();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}
