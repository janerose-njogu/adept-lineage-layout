import {
  LayoutConfig,
  LineageNode,
  LineageEdge,
  EdgePriorities,
  TraversalResult,
} from "@/src/interfaces";
import { Node, Edge } from "@xyflow/react";
import {
  ComponentArrangementPolicy,
  LayeringStrategy,
  WeightHeuristic,
  LayoutOrientation,
} from "@/src/types";
import { GraphTraversal } from "@/src/algorithms";

export class HierarchicLayout {
  private _graphNodes: Node[];
  private _graphEdges: Edge[];
  private _layoutConfig: LayoutConfig;
  private _layoutOrientation: LayoutOrientation;

  private _gridSpacing: number;
  private _minimumLayerDistance: number;
  private _arrangementPolicy: ComponentArrangementPolicy;
  private _layeringStrategy: LayeringStrategy;
  private _weightHeuristic: WeightHeuristic;
  private _enableProcessWithConstraints: boolean;

  constructor(nodes: Node[], edges: Edge[], layoutConfig: LayoutConfig) {
    this._graphNodes = nodes;
    this._graphEdges = edges;
    this._layoutConfig = layoutConfig;
    this._layoutOrientation = "LEFT_TO_RIGHT";
    this._minimumLayerDistance = 20;

    // disable grid spacing by default
    this._gridSpacing = 0;
    this._arrangementPolicy = "COMPACT";
    this._layeringStrategy = "DEFAULT";

    this._weightHeuristic = "BARYCENTER";

    this._enableProcessWithConstraints = false;
  }
  set arrangementPolicy(policy: ComponentArrangementPolicy) {
    this._arrangementPolicy = policy;
  }
  get arrangementPolicy() {
    return this._arrangementPolicy;
  }
  get gridSpacing(): number {
    return this._gridSpacing;
  }
  set layoutOrientation(orientation: LayoutOrientation) {
    if (
      orientation !== "BOTTOM_TO_TOP" &&
      orientation !== "TOP_TO_BOTTOM" &&
      orientation !== "LEFT_TO_RIGHT" &&
      orientation !== "RIGHT_TO_LEFT"
    ) {
      throw new Error(
        "Invalid layout orientation. Must be one of: BOTTOM_TO_TOP, TOP_TO_BOTTOM, LEFT_TO_RIGHT, RIGHT_TO_LEFT."
      );
    }
    this._layoutOrientation = orientation;
  }
  get layoutOrientation(): LayoutOrientation {
    return this._layoutOrientation;
  }

  set gridSpacing(spacing: number) {
    this._gridSpacing = spacing;
  }
  set layeringStrategy(strategy: LayeringStrategy) {
    if (
      strategy !== "TOPOLOGICAL" &&
      strategy !== "BFS" &&
      strategy !== "WEIGHTED" &&
      strategy !== "DEFAULT"
    ) {
      throw new Error(
        "Invalid layering strategy. Must be one of: TOPOLOGICAL, BFS, WEIGHTED, DEFAULT."
      );
    }
    this._layeringStrategy = strategy;
  }
  get layeringStrategy() {
    return this._layeringStrategy;
  }
  get weightHeuristic() {
    return this._weightHeuristic;
  }
  set weightHeuristic(heuristic: WeightHeuristic) {
    //$p1
    if (heuristic !== "BARYCENTER" && heuristic !== "MEDIAN") {
      throw new Error("Invalid weight heuristic value.");
    }
    this._weightHeuristic = heuristic;
  }
  get minimumLayerDistance() {
    // The minimum distance between adjacent layers
    return this._minimumLayerDistance;
  }
  set minimumLayerDistance(minLayerDistance: number) {
    // The minimum distance between adjacent layers
    if (minLayerDistance < 0)
      throw new Error("Negative minimum layer distance: " + minLayerDistance);
    this._minimumLayerDistance = minLayerDistance;
  }
  set enableProcessWithConstraints(processWithContraints: boolean) {
    this._enableProcessWithConstraints = processWithContraints;
  }
  get enableProcessWithConstraints() {
    return this._enableProcessWithConstraints;
  }
  // TODO: DefaultDrawingDistanceCalculator
  setGraphNodes(nodes: Node[]): void {
    this._graphNodes = nodes;
  }
  setGraphEdges(edges: Edge[]): void {
    this._graphEdges = edges;
  }
  get graphEdges(): LineageEdge[] {
    return this._graphEdges;
  }
  get graphNodes(): LineageNode[] {
    return this._graphNodes;
  }
  addNode(node: Node): void {
    this._graphNodes.push(node);
  }
  addEdge(edge: Edge): void {
    this._graphEdges.push(edge);
  }
  removeNode(nodeId: string): void {
    this._graphNodes = this._graphNodes.filter((n) => n.id !== nodeId);
    this._graphEdges = this._graphEdges.filter(
      (e) => e.source !== nodeId && e.target !== nodeId
    );
  }
  removeEdges(edgeId: string): void {
    this._graphEdges = this._graphEdges.filter((e) => e.id !== edgeId);
  }
  updateNodes(updatedNode: Node): void {
    this._graphNodes = this._graphNodes.map((n) =>
      n.id === updatedNode.id ? updatedNode : n
    );
  }
  updateEdges(updatedEdge: Edge): void {
    this._graphEdges = this._graphEdges.map((e) =>
      e.id === updatedEdge.id ? updatedEdge : e
    );
  }
  private groupNodesByLayer(
    nodeLayers: Map<string, number>
  ): Record<number, string[]> {
    const layerMap: Record<number, string[]> = {};
    for (const [nodeId, layer] of nodeLayers.entries()) {
      if (!layerMap[layer]) {
        layerMap[layer] = [];
      }
      layerMap[layer].push(nodeId);
    }
    return layerMap;
  }
  private getLayerIndexes(layerMap: Record<number, string[]>): number[] {
    return Object.keys(layerMap)
      .map(Number)
      .sort((a, b) => a - b);
  }
  private getLayerCount(layerMap: Record<number, string[]>): number {
    return Object.keys(layerMap).length;
  }
  private orderNodesWithinLayers(
    layerMap: Record<number, string[]>,
    nodeChildren: Map<string, string[]>
  ): Record<number, string[]> {
    // TODO:  improve it even further with: Median heuristics (median of parents’ positions)
    const orderedLayerMap: Record<number, string[]> = {};

    for (const layer of Object.keys(layerMap)
      .map(Number)
      .sort((a, b) => a - b)) {
      const nodesInLayer = layerMap[layer];

      // Sort nodes by number of incoming edges (nodes with more incoming edges later)
      const sortedNodes = [...nodesInLayer].sort((a, b) => {
        const aIncoming = this.countIncomingEdges(a, nodeChildren);
        const bIncoming = this.countIncomingEdges(b, nodeChildren);
        return aIncoming - bIncoming;
      });

      orderedLayerMap[layer] = sortedNodes;
    }

    return orderedLayerMap;
  }

  private countIncomingEdges(
    nodeId: string,
    nodeChildren: Map<string, string[]>
  ): number {
    let count = 0;
    for (const [parent, children] of nodeChildren.entries()) {
      if (children.includes(nodeId)) {
        count++;
      }
    }
    return count;
  }
  executeLayout() {
    // TRAVERSE GRAPH
    const traversal = new GraphTraversal();
    const startNodes = traversal.findStartNodes(
      this._graphNodes,
      this._graphEdges
    );
    let traversalStack: TraversalResult = {
      rootNode: null,
      nodeChildren: new Map(),
      nodeLayers: new Map(),
    };
    for (const startNode of startNodes) {
      const partialTraversal = traversal.traverse(
        startNode,
        this._graphNodes,
        this._graphEdges
      );
      if (!traversalStack.rootNode) {
        traversalStack.rootNode = partialTraversal.rootNode;
      }
      for (const [
        parent,
        children,
      ] of partialTraversal.nodeChildren.entries()) {
        if (!traversalStack.nodeChildren.has(parent)) {
          traversalStack.nodeChildren.set(parent, []);
        }
        traversalStack.nodeChildren.get(parent)!.push(...children);
      }

      // Merge nodeLayers
      for (const [nodeId, layer] of partialTraversal.nodeLayers.entries()) {
        if (!traversalStack.nodeLayers.has(nodeId)) {
          traversalStack.nodeLayers.set(nodeId, layer);
        }
      }
    }

    // LAYERING - LAYER ORDERING
    const layerMap = this.groupNodesByLayer(traversalStack.nodeLayers);
    console.log("layerMap", layerMap);

    const orderedLayers = this.getLayerIndexes(layerMap);
    console.log("orderedLayers", orderedLayers);

    const layerCount = this.getLayerCount(layerMap);
    console.log("layerCount", layerCount);

    // NODE ORDERING WITHIN LAYERS
    const orderedLayerMap = this.orderNodesWithinLayers(
      layerMap,
      traversalStack.nodeChildren
    );
    console.log("orderedLayerMap", orderedLayerMap);
  }
}
