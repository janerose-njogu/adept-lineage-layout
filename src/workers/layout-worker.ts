// Main client thread that ties together the various layout workers
import type { Node, Edge } from "@xyflow/react";
import type { LayoutConfig } from "../interfaces";

type LayoutType = "hierarchic";

export function executeLayout({
  nodes,
  edges,
  layoutConfig,
  layoutType = "hierarchic",
}: {
  nodes: Node[];
  edges: Edge[];
  layoutConfig: LayoutConfig;
  layoutType: LayoutType;
}): Promise<Record<string, { x: number; y: number }>> {
  let worker: Worker;
  switch (layoutType) {
    case "hierarchic":
    default:
      worker = new Worker(new URL("./hierarchic.worker.ts", import.meta.url), {
        type: "module",
      });
      break;
  }
  return new Promise((resolve) => {
    worker.onmessage = (e: MessageEvent) => {
      resolve(e.data);
    };
    worker.postMessage({ nodes, edges, layoutConfig });
  });
}
