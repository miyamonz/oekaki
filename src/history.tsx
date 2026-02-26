import { atom } from "jotai";
import { canvasAtom } from "./CanvasEditor";

const MAX_HISTORY = 30;
const historyStackAtom = atom<ImageData[]>([]);
const historyIndexAtom = atom(-1);

export const canUndoAtom = atom((get) => get(historyIndexAtom) > 0);
export const canRedoAtom = atom(
  (get) => get(historyIndexAtom) < get(historyStackAtom).length - 1
);

export const saveToHistoryAtom = atom(null, (get, set) => {
  const canvas = get(canvasAtom);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const currentIndex = get(historyIndexAtom);
  const stack = get(historyStackAtom);

  // 現在位置より先の履歴を切り捨て
  const newStack = [...stack.slice(0, currentIndex + 1), imageData];

  // MAX_HISTORY を超えたら古いものを削除
  if (newStack.length > MAX_HISTORY) {
    newStack.shift();
    set(historyStackAtom, newStack);
    set(historyIndexAtom, newStack.length - 1);
  } else {
    set(historyStackAtom, newStack);
    set(historyIndexAtom, newStack.length - 1);
  }
});

export const undoAtom = atom(null, (get, set) => {
  if (!get(canUndoAtom)) return;
  const canvas = get(canvasAtom);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const newIndex = get(historyIndexAtom) - 1;
  const stack = get(historyStackAtom);
  ctx.putImageData(stack[newIndex], 0, 0);
  set(historyIndexAtom, newIndex);
});

export const redoAtom = atom(null, (get, set) => {
  if (!get(canRedoAtom)) return;
  const canvas = get(canvasAtom);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const newIndex = get(historyIndexAtom) + 1;
  const stack = get(historyStackAtom);
  ctx.putImageData(stack[newIndex], 0, 0);
  set(historyIndexAtom, newIndex);
});
