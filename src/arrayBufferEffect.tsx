import { atom, useAtomValue } from "jotai";
import { atomEffect } from "jotai-effect";
import { messageEventFromOutsideAtom } from "./messageEvent";
import { canvasAtom, canvasWidthAtom, canvasHeightAtom } from "./CanvasEditor";
import { setArrayBufferToCanvas, arrayBufferToImage } from "./utils/setArrayBufferToCanvas";

export const waitingForImageAtom = atom(
  window.location.hash === "#from-cosense"
);

// 受信した画像をcanvasマウント前に一時保持する
const pendingImageAtom = atom<HTMLImageElement | null>(null);

// メッセージ受信: 画像をデコードしてサイズ反映 + pendingに保持
const receiveEffect = atomEffect((get, set) => {
  const event = get(messageEventFromOutsideAtom);
  if (!event) return;

  const msg = event.data;
  console.log("received message:", msg);
  if (msg?.type === "oekaki:image" && msg.data instanceof ArrayBuffer) {
    arrayBufferToImage(msg.data).then((img) => {
      set(canvasWidthAtom, img.naturalWidth);
      set(canvasHeightAtom, img.naturalHeight);
      set(pendingImageAtom, img);
      set(waitingForImageAtom, false);
    });
  }
});

// canvasマウント後: pendingImageがあれば描画
const drawPendingEffect = atomEffect((get, set) => {
  const img = get(pendingImageAtom);
  if (!img) return;
  const canvas = get(canvasAtom);
  requestAnimationFrame(() => {
    setArrayBufferToCanvas(img, canvas);
    set(pendingImageAtom, null);
  });
});

export function useSubscribeMessageEvent() {
  return useAtomValue(receiveEffect);
}

export function useDrawPendingImage() {
  return useAtomValue(drawPendingEffect);
}
