import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  ColorMode,
  ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useState, useRef, useEffect } from "react";
import { HierarchicLayout } from "@/src/layouts";
import { LayoutConfig, LayerNodeMap } from "@/src/interfaces";
import { useHierarchicDPStore } from "@/src/stores/useHierarchicDPStore";
import lineageNodes from "@/data/talendNodes.json";
import lineageEdges from "@/data/talendEdges.json";

const layoutConfig: LayoutConfig = {
  minNodeSize: 10,
  maxNodeSize: 300,
  nodeHaloVal: 100,
  nodeScaleFactor: 1,
};
function updateNodePositions(
  nodes: Node[],
  layerNodeMap: LayerNodeMap,
  nodeWidth = 150,
  nodeHeight = 100,
  layerSpacing = 200,
  nodeSpacing = 200
): Node[] {
  const positionMap = new Map<string, { x: number; y: number }>();

  for (let layerIndex = 0; layerIndex < layerNodeMap.layerCount; layerIndex++) {
    const nodesInLayer = layerNodeMap.layeredGraph[layerIndex] || [];
    const totalWidth =
      nodesInLayer.length * (nodeWidth + nodeSpacing) - nodeSpacing;

    nodesInLayer.forEach((node, nodeIndex) => {
      const x = nodeIndex * (nodeWidth + nodeSpacing) - totalWidth / 2;
      const y = layerIndex * (nodeHeight + layerSpacing);

      positionMap.set(node.id, { x, y });
    });
  }

  return nodes.map((node) => {
    const newPos = positionMap.get(node.id);
    if (newPos) {
      return {
        ...node,
        position: newPos,
      };
    }
    return node;
  });
}
export default function Flow() {
  const [colorMode, _] = useState<ColorMode>("dark");
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(
    lineageNodes as Node[]
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    lineageEdges as Edge[]
  );
  const layerProvider = useHierarchicDPStore
    .getState()
    .getData("LAYER_INDEX_DP_KEY");
  useEffect(() => {
    if (nodes.length > 0 && layerProvider) {
      setNodes((nodes) => updateNodePositions(nodes, layerProvider));
    }
  }, []);
  const hierarchicLayout = new HierarchicLayout(nodes, edges, layoutConfig);
  useHierarchicDPStore
    .getState()
    .setData("ARRANGEMENT_POLICY", hierarchicLayout.arrangementPolicy);
  const arrangementPolicy = useHierarchicDPStore
    .getState()
    .getData("ARRANGEMENT_POLICY");
  hierarchicLayout.executeLayout();
  // for (const [layerIndexStr, nodesInLayer] of Object.entries(
  //   layerProvider.layeredGraph as Record<string, LineageNode[]>
  // )) {
  //   const layerIndex = parseInt(layerIndexStr, 10);
  //   console.log(`Layer ${layerIndex}`);
  //   const layerWidth = nodesInLayer.length * (nodesInLayer[0].width + 50) - 50;
  //   nodesInLayer.forEach((node, nodeIndex) => {
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
      />
    </div>
  );
}
