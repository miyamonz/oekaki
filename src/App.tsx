import { useRef } from "react";
function App() {
  return (
    <>
      <h1>React Canvas お絵かきエディタ</h1>
      <CanvasEditor />
    </>
  );
}

const CanvasEditor = () => {
  // canvas 要素の参照を保持するための useRef
  const canvasRef = useRef(null);
  // 描画中かどうかを管理するためのフラグ
  const isDrawingRef = useRef(false);
  // 前回のマウス座標を保持するための ref
  const lastPointRef = useRef({ x: 0, y: 0 });

  // マウスを押し始めたときの処理
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    // キャンバス上での座標を計算
    lastPointRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    isDrawingRef.current = true;
  };

  // マウスを動かしたときの処理
  const handleMouseMove = (e) => {
    if (!isDrawingRef.current) return; // 描画中でなければ何もしない

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const currentPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    // 前回の座標から現在の座標まで線を描画
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.strokeStyle = "#000"; // 線の色（黒）
    ctx.lineWidth = 2; // 線の太さ
    ctx.stroke();

    // 現在の座標を次回の起点として保存
    lastPointRef.current = currentPoint;
  };

  // マウスを離したときの処理
  const handleMouseUp = () => {
    isDrawingRef.current = false;
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        style={{ border: "1px solid #000" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // キャンバス外に出た場合も描画終了
      />
    </div>
  );
};

export default App;
