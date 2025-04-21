import {
  LayoutConfig,
  LineageNode,
  LineageEdge,
  LayerNodeMap,
  LayerNodeWeights,
  EdgePriorities,
} from "@/src/interfaces";
import {
  ComponentArrangementPolicy,
  LayeringStrategy,
  WeightHeuristic,
} from "@/src/types";
import { useHierarchicDPStore } from "@/src/stores/useHierarchicDPStore";
import { FromSketchLayerer, Sequencer } from "@/src/layouts/hierarchic";

export class HierarchicLayout {
  private _graphNodes: LineageNode[];
  private _graphEdges: LineageEdge[];
  private _layoutConfig: LayoutConfig;

  private _gridSpacing: number;
  private _minimumLayerDistance: number;
  private _arrangementPolicy: ComponentArrangementPolicy;
  private _layeringStrategy: LayeringStrategy;
  private _weightHeuristic: WeightHeuristic;
  private _edgePriorities: EdgePriorities;
  private _enableProcessWithConstraints: boolean;

  constructor(
    nodes: LineageNode[],
    edges: LineageEdge[],
    layoutConfig: LayoutConfig
  ) {
    this._graphNodes = nodes;
    this._graphEdges = edges;
    this._layoutConfig = layoutConfig;

    // disable grid spacing by default
    this._gridSpacing = 0;
    this._minimumLayerDistance = 20;
    this._arrangementPolicy = "COMPACT";
    this._layeringStrategy = "DEFAULT";

    this._weightHeuristic = "BARYCENTER";
    this._edgePriorities = {};

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
  setGraphNodes(nodes: LineageNode[]): void {
    this._graphNodes = nodes;
  }
  setGraphEdges(edges: LineageEdge[]): void {
    this._graphEdges = edges;
  }
  get graphEdges(): LineageEdge[] {
    return this._graphEdges;
  }
  get graphNodes(): LineageNode[] {
    return this._graphNodes;
  }
  addNode(node: LineageNode): void {
    this._graphNodes.push(node);
  }
  addEdge(edge: LineageEdge): void {
    this._graphEdges.push(edge);
  }
  removeNode(nodeId: string): void {
    this._graphNodes = this._graphNodes.filter((n) => n.id !== nodeId);
    this._graphEdges = this._graphEdges.filter(
      (e) => e.source !== nodeId && e.target !== nodeId
    );
  }
  removeEdge(edgeId: string): void {
    this._graphEdges = this._graphEdges.filter((e) => e.id !== edgeId);
  }
  updateNode(updatedNode: LineageNode): void {
    this._graphNodes = this._graphNodes.map((n) =>
      n.id === updatedNode.id ? updatedNode : n
    );
  }
  updateEdge(updatedEdge: LineageEdge): void {
    this._graphEdges = this._graphEdges.map((e) =>
      e.id === updatedEdge.id ? updatedEdge : e
    );
  }
  calculateNodeSizeBounds() {
    // supports both height(vertical orientation) and width(horizontal orientation)
    let minNodeSize = Number.MAX_VALUE;
    let maxNodeSize = 0;

    for (const node of this._graphNodes) {
      const height = node.height ?? 0;
      const width = node.width ?? 0;
      const size = Math.max(height, width); // Use the larger of height or width

      if (size < minNodeSize) minNodeSize = size;
      if (size > maxNodeSize) maxNodeSize = size;
    }

    // Fall back to this._layoutConfig defaults if no sizes found
    if (minNodeSize === Number.MAX_VALUE)
      minNodeSize = this._layoutConfig.minNodeSize;
    if (maxNodeSize === 0) maxNodeSize = this._layoutConfig.maxNodeSize;

    return { minNodeSize, maxNodeSize };
  }
  //   createLayers(){
  //     const layersMap: Map<number, Node[]> = new Map();

  //     this._graphNodes.forEach((node) => {
  //       const layerIndex = node.data?.layer || 0; // Assume `layer` is a property in node data
  //       if (!layersMap.has(layerIndex)) {
  //         layersMap.set(layerIndex, []);
  //       }
  //       layersMap.get(layerIndex)?.push(node);
  //     });

  //     // Convert layersMap to an array of Layer objects
  //     const layers: Layer[] = Array.from(layersMap.entries()).map(([index, nodes]) => ({
  //       id: `layer-${index}`,
  //       nodes,
  //     }));

  //     return { layers, edges };
  //   }
  executeElementSequencing(layerNodeMap: LayerNodeMap) {
    const sequencer = new Sequencer(
      this._enableProcessWithConstraints,
      this._edgePriorities,
      layerNodeMap
    );
    sequencer.calculateLayerWeights(
      this._graphEdges,
      this._weightHeuristic,
      false
    );
    sequencer.sequenceNodeLayers(this._graphNodes, this._graphEdges);
    // publishSequences
    const sequenceProvider = useHierarchicDPStore
      .getState()
      .getData("SEQUENCE_INDEX_DP_KEY");
    if (!sequenceProvider) return;
    // TODO: Extract layers from sequenceProvider DataStore
    for (const layer of layers) {
      if (layer.type === 2 || layer.type === 3) {
        continue; // Skip dummy layers
      }

      let sequenceIndex = 0;

      for (const nodeId of layer.nodeIds) {
        const metadata = nodeMetadata[nodeId];
        if (!metadata || metadata.type !== 0) {
          continue; // Skip dummy/virtual nodes
        }

        if (groupManager) {
          const groupNodes = groupManager.getGroupNodes(nodeId);
          if (groupNodes && groupNodes.length > 0) {
            for (const groupNodeId of groupNodes) {
              setNodeSequences(groupNodeId, sequenceIndex);
            }
          }
        }

        setNodeSequences(nodeId, sequenceIndex);
        sequenceIndex++;
      }
    }
  }
  executeLayeringStrategy(): void {
    switch (this._layeringStrategy) {
      // case 'TOPOLOGICAL':
      //     // Implement topological layering strategy - HIERARCHICAL - Include ranking policy
      //     return {};
      // case 'BFS':
      //     // Implement BFS layering strategy - TREE
      //     break;
      // case 'WEIGHTED':
      //     // Implement weighted layering strategy - TIGHT
      //     break;
      default:
        // 'DEFAULT' - ASISLAYERER - FROMSKETCHLAYERER
        useHierarchicDPStore
          .getState()
          .setData(
            "LAYER_INDEX_DP_KEY",
            new FromSketchLayerer().mapLayersToNodes(
              this._graphNodes,
              this._graphEdges,
              this._layoutConfig
            )
          );
    }
  }
  executeLayout() {
    // TODO
    // this.executeLayeringStrategy();
  }
}
