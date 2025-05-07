import { LayoutConfig, TraversalResult } from "@/src/interfaces";
import { Node, Edge } from "@xyflow/react";
import { WeightHeuristic, LayoutOrientation } from "@/src/types";
import { GraphTraversal } from "@/src/algorithms";

export class HierarchicLayout {
  private _graphNodes: Node[];
  private _graphEdges: Edge[];
  private _layoutConfig: LayoutConfig;
  private _layoutOrientation: LayoutOrientation;
  private _connectedMap: Record<string, string[]>;

  private _gridSpacing: number;
  private _horizontalSpacing: number;
  private _verticalSpacing: number;
  private _minimumLayerDistance: number;
  private _weightHeuristic: WeightHeuristic;

  constructor(nodes: Node[], edges: Edge[], layoutConfig: LayoutConfig) {
    this._graphNodes = nodes;
    this._graphEdges = edges;
    this._layoutConfig = layoutConfig;
    this._connectedMap = {};
    this._layoutOrientation = layoutConfig.layoutOrientation;
    this._minimumLayerDistance = layoutConfig.minimumLayerDistance;

    // disable grid spacing by default
    this._gridSpacing = 0;
    this._horizontalSpacing = layoutConfig.horizontalSpacing;
    this._verticalSpacing = layoutConfig.verticalSpacing;

    this._weightHeuristic = "BARYCENTER";
  }
  get connectionMap(): Record<string, string[]> | undefined {
    return this._connectedMap;
  }
  findAllConnectedElements(startId: string): Set<string> {
    // finds all target nodes connected to the source node with the current id
    const connectedElements = new Set<string>();

    this._graphEdges.forEach((edge) => {
      if (edge.source === startId) {
        connectedElements.add(edge.id);
        connectedElements.add(edge.target);
      }
      if (edge.target === startId) {
        connectedElements.add(edge.id);
        connectedElements.add(edge.source);
      }
    });

    connectedElements.add(startId);
    return connectedElements;
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
    // nodes that are not in any layer (i.e., not connected to any other node) are assigned to layer 0
    const allNodeIds = this._graphNodes.map((node) => node.id);
    for (const nodeId of allNodeIds) {
      if (!nodeLayers.has(nodeId) && !this._connectedMap[nodeId]) {
        if (!layerMap[0]) {
          layerMap[0] = [];
        }
        layerMap[0].push(nodeId);
      }
    }
    return layerMap;
  }
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
    for (const [layerIndex, nodeIds] of Object.entries(orderedLayerMap)) {
      const layerNum = Number(layerIndex);
      let currentX = 0;
      let currentY = 0;
      let previousNodeWidth = 0;
      let previousNodeHeight = 0;
      for (let i = 0; i < nodeIds.length; i++) {
        const nodeId = nodeIds[i];
        const node = this._graphNodes.find((n) => n.id === nodeId);
        const nodeWidth = node?.measured?.width ?? this._layoutConfig.nodeWidth;
        const nodeHeight =
          node?.measured?.height ?? this._layoutConfig.nodeHeight;

        if (this._layoutOrientation === "LR") {
          currentX += i === 0 ? 0 : previousNodeWidth + this._horizontalSpacing;
          currentY =
            layerNum *
            (previousNodeHeight +
              this._verticalSpacing +
              this._minimumLayerDistance);
        } else if (this._layoutOrientation === "TB") {
          currentX =
            layerNum *
            (previousNodeWidth +
              this._horizontalSpacing +
              this._minimumLayerDistance);
          currentY += i === 0 ? 0 : previousNodeHeight + this._verticalSpacing;
        }

        positions[nodeId] = { x: currentX, y: currentY };

        previousNodeWidth = nodeWidth;
        previousNodeHeight = nodeHeight;
      }
    }
    return positions;
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
    this._graphEdges.forEach((edge) => {
      if (!this._connectedMap[edge.source]) {
        this._connectedMap[edge.source] = [];
      }
      if (!this._connectedMap[edge.target]) {
        this._connectedMap[edge.target] = [];
      }
      this._connectedMap[edge.source].push(edge.target);
      this._connectedMap[edge.target].push(edge.source);
    });
    // LAYERING - LAYER ORDERING
    const layerMap = this.groupNodesByLayer(traversalStack.nodeLayers);
    // NODE ORDERING WITHIN LAYERS
    const orderedLayerMap = this.orderNodesWithinLayers(
      layerMap,
      traversalStack.nodeChildren
    );
    // ASSIGN NODE POSITIONS
    const nodePositions = this.assignNodePositions(orderedLayerMap);
    return nodePositions;
  }
}
