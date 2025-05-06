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
import { useState, useRef, useEffect, useCallback } from "react";
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

export default function FlowCanvas() {
  const [colorMode, _] = useState<ColorMode>("light");
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(
    lineageNodes as Node[]
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    lineageEdges as Edge[]
  );
  const hierarchicLayout = new HierarchicLayout(nodes, edges, layoutConfig);
  useEffect(() => {
    if (nodes.length > 0) {
      const positions = hierarchicLayout.executeLayout();
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
  const onNodeMouseEnter = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const connectedNodes = hierarchicLayout.findAllConnectedElements(node.id);
      if (connectedNodes) {
        setNodes((nds) =>
          nds.map((n) => {
            if (connectedNodes.has(n.id)) {
              return {
                ...n,
                style: {
                  ...n.style,
                  border: "3px solid #ed3441",
                  boxShadow: "0 0 10px #ed3441",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                },
              };
            }
            return n;
          })
        );
      }
    },
    [setNodes]
  );

  const onNodeMouseLeave = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          style: {
            ...n.style,
            border: undefined,
            boxShadow: undefined,
            transition: undefined,
          },
        }))
      );
    },
    [setNodes]
  );
  const onEdgeMouseEnter = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id === edge.id) {
            return {
              ...e,
              style: {
                ...e.style,
                stroke: "#ed3441",
                strokeWidth: 3,
                transition: "stroke 0.2s ease, stroke-width 0.2s ease",
              },
            };
          }
          return e;
        })
      );
    },
    [setEdges]
  );

  const onEdgeMouseLeave = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id === edge.id) {
            return {
              ...e,
              style: {
                ...e.style,
                stroke: undefined,
                strokeWidth: undefined,
                transition: undefined,
              },
            };
          }
          return e;
        })
      );
    },
    [setEdges]
  );
  return (
    <div style={{ width: "100%", height: "900px" }}>
      <ReactFlow
        id="reactflow"
        onInit={(instance) => {
          reactFlowRef.current = instance;
        }}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onEdgeMouseEnter={onEdgeMouseEnter}
        onEdgeMouseLeave={onEdgeMouseLeave}
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
