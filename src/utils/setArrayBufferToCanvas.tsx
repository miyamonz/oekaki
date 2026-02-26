export function setArrayBufferToCanvas(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(img, 0, 0);
  console.log("paste to canvas");
}
export function arrayBufferToImage(arrayBuffer: ArrayBuffer) {
  const img = new Image();
  img.src = URL.createObjectURL(new Blob([arrayBuffer]));
  return new Promise<HTMLImageElement>((resolve) => {
    img.onload = () => {
      resolve(img);
    };
  });
}
