import type { Node } from "@xyflow/react";

const lineageNodes: Node[] = [
  {
    id: "1",
    data: { label: "Node 1" },
    position: { x: 0, y: 0 },
    type: "default",
  },
  {
    id: "2",
    data: { label: "Node 2" },
    position: { x: 0, y: 100 },
    type: "default",
  },
  {
    id: "3",
    data: { label: "Node 3" },
    position: { x: 0, y: 200 },
    type: "default",
  },
  {
    id: "4",
    data: { label: "Node 4" },
    position: { x: 200, y: 100 },
    type: "default",
  },
];

export default lineageNodes;