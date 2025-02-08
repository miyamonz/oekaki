export const copyCanvas = async (canvas: HTMLCanvasElement) => {
  try {
    // Convert the canvas to a blob
    const blob = await canvasToBlob(canvas);

    // Create ClipboardItem and write to clipboard
    const item = new ClipboardItem({ "image/png": blob });
    await navigator.clipboard.write([item]);
  } catch (err) {
    console.error("Failed to copy:", err);
    alert("Failed to copy image to clipboard");
  }
};
function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
    }, "image/png");
  });
}
