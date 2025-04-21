import { CoordinateExtent, Edge } from "@xyflow/react";
import { HierarchicalLayoutLayerType } from "../types";

interface NodeData {
  fixed?: boolean;
  layerType?: HierarchicalLayoutLayerType;
}
interface EdgeData {}
export interface LineageNode {
  id: string;
  elementId?: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  data?: NodeData;
  sourceHandles?: string[];
  targetHandles?: string[];
  className?: string;
  hidden?: boolean;
  type?: string;
  extent?: string | CoordinateExtent | "parent" | undefined;
}
export interface LineageEdge {
  id: string;
  elementId?: string;
  type?: string;
  data?: EdgeData;
  hidden?: boolean;
  source: string; //startNodeElementId
  target: string; //endNodeElementId
  sourceHandle?: string;
  targetHandle?: string;
}
export interface DataProvider {
  graphData: Record<string, any>;
  setData: (key: string, value: any) => void;
  getData: (key: string) => any;
}

export interface LayoutConfig {
  minNodeSize: number;
  maxNodeSize: number;
  nodeHaloVal: number;
  nodeScaleFactor: number;
}

export interface LayeredGraph {
  [layerIndex: number]: LineageNode[];
}

export interface LayerNodeMap {
  layeredGraph: LayeredGraph;
  reversedEdges: LineageEdge[];
  layerCount: number;
}

export interface LayerNodeWeights {
  [layerIndex: number]: {
    [nodeId: string]: number;
  };
}
export interface LayerEdgeWeights {
  [layerIndex: number]: {
    [edgeId: string]: number;
  };
}
export interface LayerNodeOrders {
  [layerIndex: number]: {
    [nodeId: string]: number;
  };
}
export interface EdgePriorities {
  [edgeId: string]: number;
}
