import { Suspense } from "react";
import { CanvasEditor, CopyButton } from "./CanvasEditor";

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <h1>oekaki</h1>
        <CanvasEditor />
        <CopyButton />
      </div>
    </Suspense>
  );
}

export default App;
