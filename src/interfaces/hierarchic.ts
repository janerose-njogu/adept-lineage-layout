import { CoordinateExtent, Node } from "@xyflow/react";
import { LayoutOrientation } from "../types";


interface EdgeData {}
export interface LineageNode {
  id: string;
  elementId?: string;
  position: { x: number; y: number };
  width?: number | undefined;
  height?: number | undefined;
  data?: Record<string, unknown> | undefined;
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
  source: string;
  target: string;
  sourceHandle?: string | null | undefined;
  targetHandle?: string | null | undefined;
}
export interface DataProvider {
  graphData: Record<string, any>;
  setData: (key: string, value: any) => void;
  getData: (key: string) => any;
}
export interface StackEntry {
  node: Node;
  parent: Node | null;
  depth: number;
}
export interface TraversalResult {
  rootNode: string | null;
  nodeChildren: Map<string, string[]>;
  nodeLayers: Map<string, number>;
}
export interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
  layoutOrientation: LayoutOrientation;
  minimumLayerDistance: number;
}