import {
  LayoutConfig,
  LineageNode,
  LineageEdge,
  TraversalResult,
} from "@/src/interfaces";
import { Node, Edge } from "@xyflow/react";
import { WeightHeuristic, LayoutOrientation } from "@/src/types";
import { GraphTraversal } from "@/src/algorithms";

export class HierarchicLayout {
  private _graphNodes: Node[];
  private _graphEdges: Edge[];
  private _layoutConfig: LayoutConfig;
  private _layoutOrientation: LayoutOrientation;

  private _gridSpacing: number;
  private _horizontalSpacing: number;
  private _verticalSpacing: number;
  private _minimumLayerDistance: number;
  private _weightHeuristic: WeightHeuristic;

  constructor(nodes: Node[], edges: Edge[], layoutConfig: LayoutConfig) {
    this._graphNodes = nodes;
    this._graphEdges = edges;
    this._layoutConfig = layoutConfig;
    this._layoutOrientation = layoutConfig.layoutOrientation;
    this._minimumLayerDistance = layoutConfig.minimumLayerDistance;

    // disable grid spacing by default
    this._gridSpacing = 0;
    this._horizontalSpacing = layoutConfig.horizontalSpacing;
    this._verticalSpacing = layoutConfig.verticalSpacing;

    this._weightHeuristic = "BARYCENTER";
  }
  get layoutConfig(): LayoutConfig {
    return this._layoutConfig;
  }
  set layoutConfig(config: LayoutConfig) {
    this._layoutConfig = config;
  }
  get gridSpacing(): number {
    return this._gridSpacing;
  }
  set gridSpacing(spacing: number) {
    this._gridSpacing = spacing;
  }
  set layoutOrientation(orientation: LayoutOrientation) {
    if (orientation !== "TB" && orientation !== "LR") {
      throw new Error("Invalid layout orientation. Must be one of: TB or LR.");
    }
    this._layoutOrientation = orientation;
  }
  get layoutOrientation(): LayoutOrientation {
    return this._layoutOrientation;
  }
  get weightHeuristic() {
    return this._weightHeuristic;
  }
  set weightHeuristic(heuristic: WeightHeuristic) {
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
  get horizontalSpacing() {
    // The horizontal distance between nodes in the same layer
    return this._horizontalSpacing;
  }
  set horizontalSpacing(spacing: number) {
    // The horizontal distance between nodes in the same layer
    if (spacing < 0) throw new Error("Negative horizontal spacing: " + spacing);
    this._horizontalSpacing = spacing;
  }
  get verticalSpacing() {
    // The vertical distance between nodes in the same layer
    return this._verticalSpacing;
  }
  set verticalSpacing(spacing: number) {
    // The vertical distance between nodes in the same layer
    if (spacing < 0) throw new Error("Negative vertical spacing: " + spacing);
    this._verticalSpacing = spacing;
  }

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
  executeLayout(): Record<
    string,
    {
      x: number;
      y: number;
    }
  > {
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

    // const orderedLayers = this.getLayerIndexes(layerMap);

    // const layerCount = this.getLayerCount(layerMap);

    // NODE ORDERING WITHIN LAYERS
    const orderedLayerMap = this.orderNodesWithinLayers(
      layerMap,
      traversalStack.nodeChildren
    );

    // ASSIGN NODE POSITIONS
    const nodePositions = this.assignNodePositions(orderedLayerMap);
    return nodePositions;
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
  // private getLayerIndexes(layerMap: Record<number, string[]>): number[] {
  //   return Object.keys(layerMap)
  //     .map(Number)
  //     .sort((a, b) => a - b);
  // }
  // private getLayerCount(layerMap: Record<number, string[]>): number {
  //   return Object.keys(layerMap).length;
  // }
  private orderNodesWithinLayers(
    layerMap: Record<number, string[]>,
    nodeChildren: Map<string, string[]>
  ): Record<number, string[]> {
    // TODO:  improve this with: Median heuristics (median of parents’ positions) or BARYCENTER heuristics (average of parents’ positions)
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
    for (const [_, children] of nodeChildren.entries()) {
      if (children.includes(nodeId)) {
        count++;
      }
    }
    return count;
  }
  private assignNodePositions(orderedLayerMap: Record<number, string[]>) {
    const positions: Record<string, { x: number; y: number }> = {};
    for (const [layerIndex, _] of Object.entries(orderedLayerMap)) {
      const layerNum = Number(layerIndex);
      const nodesInLayer = orderedLayerMap[layerNum];

      for (let i = 0; i < nodesInLayer.length; i++) {
        const nodeId = nodesInLayer[i];

        let x = 0;
        let y = 0;

        if (this._layoutOrientation === "LR") {
          x = i * this._horizontalSpacing;
          y = layerNum * (this._verticalSpacing + this._minimumLayerDistance);
        } else if (this._layoutOrientation === "TB") {
          x = layerNum * (this._horizontalSpacing + this._minimumLayerDistance);
          y = i * this._verticalSpacing;
        }

        positions[nodeId] = { x, y };
      }
    }

    return positions;
  }
}
