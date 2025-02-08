import { useAtomValue } from "jotai";
import { atomEffect } from "jotai-effect";
import { messageEventFromOutsideAtom } from "./messageEvent";
import { canvasAtom } from "./CanvasEditor";
import { setArrayBufferToCanvas } from "./utils/setArrayBufferToCanvas";

const postMessageEventEffect = atomEffect((get) => {
  const event = get(messageEventFromOutsideAtom);
  if (!event) return;

  if (event.data instanceof ArrayBuffer) {
    const canvas = get(canvasAtom);
    setArrayBufferToCanvas(event.data, canvas);
  }
});

export function useSubscribeArrayBufferEvent() {
  return useAtomValue(postMessageEventEffect);
}
