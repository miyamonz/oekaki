import { atom, useAtom } from "jotai";
import { useRef, MouseEvent, useCallback, useEffect } from "react";
import { Gyazo } from "gyazo-api-ts";

function App() {
  return (
    <>
      <h1>oekaki</h1>
      <CanvasEditor />
    </>
  );
}

const MAX_HISTORY = 10;
const historyAtom = atom<ImageData[]>([]);
function useHistory() {
  return useAtom(historyAtom);
}
const currentHistoryIndexAtom = atom<number>(0);
function useCurrentHistoryIndex() {
  return useAtom(currentHistoryIndexAtom);
}

function useSaveToHistory(
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  const [history, setHistory] = useHistory();
  const [currentHistoryIndex, setCurrentHistoryIndex] =
    useCurrentHistoryIndex();
  const currentHistoryIndexRef = useRef(currentHistoryIndex);
  useEffect(() => {
    currentHistoryIndexRef.current = currentHistoryIndex;
  }, [currentHistoryIndex]);
  // キャンバスの状態を履歴に保存
  return useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    setHistory((prev) => {
      const newHistory = prev.slice(0, currentHistoryIndexRef.current + 1);
      const updatedHistory = [...newHistory, imageData];
      if (updatedHistory.length > MAX_HISTORY) {
        updatedHistory.shift();
        setCurrentHistoryIndex(MAX_HISTORY - 2);
      } else {
        setCurrentHistoryIndex(updatedHistory.length - 1);
      }
      return updatedHistory;
    });
  }, [canvasRef, setCurrentHistoryIndex, setHistory]);
}

function useRestoreFromHistory(
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  const [history] = useHistory();
  return useCallback(
    (index: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(history[index], 0, 0);
    },
    [history, canvasRef]
  );
}

const CanvasEditor = () => {
  // canvas 要素の参照を保持するための useRef
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 描画中かどうかを管理するためのフラグ
  const isDrawingRef = useRef(false);
  // 前回のマウス座標を保持するための ref
  const lastPointRef = useRef({ x: 0, y: 0 });

  const saveToHistory = useSaveToHistory(canvasRef);

  const restoreFromHistory = useRestoreFromHistory(canvasRef);

  const [currentHistoryIndex] = useCurrentHistoryIndex();
  // Undo処理
  const handleUndo = useCallback(() => {
    if (currentHistoryIndex <= 0) return;
    restoreFromHistory(currentHistoryIndex - 1);
  }, [currentHistoryIndex, restoreFromHistory]);

  // Redo処理
  const handleRedo = useCallback(() => {
    if (currentHistoryIndex >= history.length - 1) return;
    restoreFromHistory(currentHistoryIndex + 1);
  }, [currentHistoryIndex, restoreFromHistory]);

  // キャンバスの初期化時に最初の状態を保存
  const handleCanvasInit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 白色で塗りつぶし
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  }, [saveToHistory]);

  // キャンバスの初期化
  useEffect(() => {
    handleCanvasInit();
  }, [handleCanvasInit]);

  // マウスを押し始めたときの処理
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    // キャンバス上での座標を計算
    lastPointRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    isDrawingRef.current = true;
  };

  // マウスを動かしたときの処理
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return; // 描画中でなければ何もしない

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
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
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      saveToHistory();
    }
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
      >
        <button onClick={handleUndo} disabled={currentHistoryIndex <= 0}>
          Undo
        </button>
        <span>
          {currentHistoryIndex + 1} / {history.length}
        </span>
        <button
          onClick={handleRedo}
          disabled={currentHistoryIndex >= history.length - 1}
        >
          Redo
        </button>
      </div>
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

export default App;
