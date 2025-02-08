import { atom, useAtomValue } from "jotai";
import { atomEffect } from "jotai-effect";
import { canvasAtom } from "./CanvasEditor";
import { copyCanvas } from "./utils/copyCanvas";

const shortCutAtom = atom<KeyboardEvent | null>(null);
shortCutAtom.onMount = (set) => {
  document.addEventListener("keydown", (e) => {
    set(e);
  });
};
const shortCutEffect = atomEffect((get) => {
  const event = get(shortCutAtom);
  if (!event) return;
  //console.log(event);

  // hooks呼び出し側が判断する仕組みのほうがいい気がする
  // command + c
  if (event.metaKey && event.key === "c") {
    const canvas = get(canvasAtom);
    if (!canvas) return;
    copyCanvas(canvas);
  }
});

export function useShortcut() {
  return useAtomValue(shortCutEffect);
}
