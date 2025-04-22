import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  ColorMode,
  ReactFlowInstance,
  MiniMap,
  Controls,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useState, useRef, useEffect } from "react";
import { HierarchicLayout } from "@/src/layouts";
import { LayoutConfig } from "@/src/interfaces";
import lineageNodes from "@/data/talendNodes.json";
import lineageEdges from "@/data/talendEdges.json";

const layoutConfig: LayoutConfig = {
  nodeWidth: 300,
  nodeHeight: 300,
  horizontalSpacing: 500,
  verticalSpacing: 500,
  layoutOrientation: "LR",
  minimumLayerDistance: 20,
};

export default function Flow() {
  const [colorMode, _] = useState<ColorMode>("light");
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(
    lineageNodes as Node[]
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    lineageEdges as Edge[]
  );
  useEffect(() => {
    if (nodes.length > 0) {
      const hierarchicLayout = new HierarchicLayout(nodes, edges, layoutConfig);
      const positions = hierarchicLayout.executeLayout();
      console.log("Positions: ", positions);

      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          const pos = positions[node.id];
          if (pos) {
            return {
              ...node,
              position: positions[node.id] || node.position,
            };
          }
          return node;
        })
      );
    }
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "900px" }}>
      <ReactFlow
        id="reactflow"
        onInit={(instance) => {
          reactFlowRef.current = instance;
        }}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        colorMode={colorMode}
        fitView
      >
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor="#0000FF"
          pannable={true}
          zoomable={true}
        />
        <Controls />
      </ReactFlow>
    </div>
  );
}
