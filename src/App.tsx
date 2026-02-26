import { Suspense } from "react";
import { CanvasEditor, CopyButton } from "./CanvasEditor";

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="app">
        <h1>oekaki</h1>
        <CanvasEditor />
        <CopyButton />
      </div>
    </Suspense>
  );
}

export default App;
