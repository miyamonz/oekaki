import { atom, useAtom } from "jotai";
import { useRef, useEffect, useCallback } from "react";

const MAX_HISTORY = 10;
const historyAtom = atom<ImageData[]>([]);
function useHistory() {
  return useAtom(historyAtom);
}
const currentHistoryIndexAtom = atom<number>(0);
function useCurrentHistoryIndex() {
  return useAtom(currentHistoryIndexAtom);
}
export function useSaveToHistory(
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  const [, setHistory] = useHistory();
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
export function useRestoreFromHistory(
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

// const saveToHistory = useSaveToHistory(canvasRef);

// const restoreFromHistory = useRestoreFromHistory(canvasRef);

// const [currentHistoryIndex] = useCurrentHistoryIndex();
// // Undo処理
// const handleUndo = useCallback(() => {
//   if (currentHistoryIndex <= 0) return;
//   restoreFromHistory(currentHistoryIndex - 1);
// }, [currentHistoryIndex, restoreFromHistory]);

// // Redo処理
// const handleRedo = useCallback(() => {
//   if (currentHistoryIndex >= history.length - 1) return;
//   restoreFromHistory(currentHistoryIndex + 1);
// }, [currentHistoryIndex, restoreFromHistory]);
