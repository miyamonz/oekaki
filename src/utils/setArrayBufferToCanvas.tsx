export async function setArrayBufferToCanvas(
  arrayBuffer: ArrayBuffer,
  canvas: HTMLCanvasElement
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const img = await arrayBufferToImage(arrayBuffer);
  ctx.drawImage(img, 0, 0);
  console.log("paste to canvas");
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
