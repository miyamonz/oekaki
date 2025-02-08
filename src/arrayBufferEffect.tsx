import { atomEffect } from "jotai-effect";
import { canvasAtom } from "./CanvasEditor";

function setArrayBufferToCanvas(
  arrayBuffer: ArrayBuffer,
  canvas: HTMLCanvasElement
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  arrayBufferToImage(arrayBuffer).then((img) => {
    ctx.drawImage(img, 0, 0);
    console.log("paste to canvas");
  });
}

function arrayBufferToImage(arrayBuffer: ArrayBuffer) {
  const img = new Image();
  img.src = URL.createObjectURL(new Blob([arrayBuffer]));
  return new Promise<HTMLImageElement>((resolve) => {
    img.onload = () => {
      resolve(img);
    };
  });
}

// postMessageをフィルタしたうえで、特定の条件にマッチしたらなにかするみたいな書き方のほうがいいだろう

export const arrayBufferEffect = atomEffect((get) => {
  window.addEventListener("message", (event) => {
    if (event.origin === window.location.origin) return;
    console.log(event.origin, event);

    // TODO: データがarrayBufferであるからといって、pngであるかはわからん
    // is-pngとかでチェックすると良い？
    // いや、メタデータも欲しくなるし、やっぱりevent.data自体じゃなくてevent.data.data.になりそうだな
    if (event.data instanceof ArrayBuffer) {
      const canvas = get(canvasAtom);
      if (!canvas) return;
      setArrayBufferToCanvas(event.data, canvas);
    }
  });
});
