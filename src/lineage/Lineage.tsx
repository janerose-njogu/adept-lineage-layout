import ReactFlow from "reactflow";
import "reactflow/dist/style.css";

const nodes = [
  {
    id: "1",
    position: { x: 0, y: 0 },
    data: { label: "Hello" },
    type: "default",
  },
  {
    id: "2",
    position: { x: 200, y: 100 },
    data: { label: "World" },
    type: "default",
  },
];

const edges = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
  },
];

export default function Flow() {
  return (
    <div style={{ width: "100%", height: "500px" }}>
      <ReactFlow nodes={nodes} edges={edges} fitView />
    </div>
  );
}
