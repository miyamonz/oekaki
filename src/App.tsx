import { useRef, MouseEvent, useEffect } from "react";
import { atom, useAtom } from "jotai";
function App() {
  return (
    <>
      <h1>oekaki</h1>
      <CanvasEditor />
    </>
  );
}

const isDrawingAtom = atom(false);

const CanvasEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useAtom(isDrawingAtom);
  const lastPointRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    initCanvas(canvas);
  }, []);

  // マウスを押し始めたときの処理
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    // キャンバス上での座標を計算
    lastPointRef.current = pos;
    setIsDrawing(true);
  };

  // マウスを動かしたときの処理
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const currentPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    stroke(ctx, lastPointRef.current, currentPoint);

    lastPointRef.current = currentPoint;
  };

  // マウスを離したときの処理
  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  return (
    <div>
      <div
        style={{
          marginBottom: "10px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      ></div>
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        style={{ border: "1px solid #000", background: "white" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // キャンバス外に出た場合も描画終了
      />
    </div>
  );
};

function initCanvas(canvas: HTMLCanvasElement) {
  // 白色で塗りつぶし
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function stroke(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number }
) {
  // 前回の座標から現在の座標まで線を描画
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.strokeStyle = "#000"; // 線の色（黒）
  ctx.lineWidth = 2; // 線の太さ
  ctx.stroke();
}

export default App;
