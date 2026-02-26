import { atom, useAtomValue } from "jotai";
import { atomEffect } from "jotai-effect";
import { canvasAtom } from "./CanvasEditor";
import { copyCanvas } from "./utils/copyCanvas";
import { undoAtom, redoAtom } from "./history";

const shortCutAtom = atom<KeyboardEvent | null>(null);
shortCutAtom.onMount = (set) => {
  const handler = (e: KeyboardEvent) => set(e);
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
};

const shortCutEffect = atomEffect((get, set) => {
  const event = get(shortCutAtom);
  if (!event) return;

  // Cmd+Z: Undo, Cmd+Shift+Z: Redo
  if (event.metaKey && event.key === "z") {
    event.preventDefault();
    if (event.shiftKey) {
      set(redoAtom);
    } else {
      set(undoAtom);
    }
    return;
  }

  // Cmd+C: Copy canvas
  if (event.metaKey && event.key === "c") {
    const canvas = get(canvasAtom);
    copyCanvas(canvas);
  }
});

export function useShortcut() {
  return useAtomValue(shortCutEffect);
}
