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
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Hierarchic } from "@/src/index";
import { LayoutConfig } from "@/src/interfaces";
import { executeLayout } from "@/src/workers/layout-worker";
import LineageEdge from "./LineageEdge";
// import lineageNodes from "@/data/talendNodes.json";
// import lineageEdges from "@/data/talendEdges.json";
import lineageNodes from "@/data/dummyNodes";
import lineageEdges from "@/data/dummyEdges";
export type LayoutOrientation = "TB" | "LR";

const layoutConfig: LayoutConfig = {
  nodeWidth: 300,
  nodeHeight: 300,
  horizontalSpacing: 0,
  verticalSpacing: 0,
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
  const hierarchicLayout = new Hierarchic(nodes, edges, layoutConfig);
  useEffect(() => {
    if (nodes.length > 0) {
      // const positions = hierarchicLayout.executeLayout();
      executeLayout({
        nodes,
        edges,
        layoutConfig,
        layoutType: "hierarchic",
      }).then((positions) => {
        console.log("Positions from worker:", positions);
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
      });
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
      setEdges((eds) =>
        eds.map((e) =>
          e.source === node.id || e.target === node.id
            ? {
              ...e,
              style: {
                ...e.style,
                stroke: "#ed3441",
                strokeWidth: 3,
                transition: "stroke 0.2s ease, stroke-width 0.2s ease",
              },
            }
            : e
        )
      );
    }, [setNodes, setEdges]
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
      setEdges((eds) =>
        eds.map((e) =>
          e.source === node.id || e.target === node.id
            ? {
              ...e,
              style: {
                ...e.style,
                stroke: undefined,
                strokeWidth: undefined,
                transition: undefined,
              },
            }
            : e
        )
      );
    }, [setNodes, setEdges]
  );
  const [layoutOrientation, setLayoutOrientation] = useState<LayoutOrientation>("LR");

  const edgeTypes = useMemo(
    () => ({
      customEdge: (edgeProps: any) => {
        return <LineageEdge {...edgeProps} layoutOrientation={layoutOrientation} key={edgeProps.id + layoutOrientation} />;
      },
    }),
    [layoutOrientation]
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
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
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
