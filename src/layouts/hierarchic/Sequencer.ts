/*
 * Implements the second phase of the Sugiyama algorithm.
 * Minimizes the edge crossings in the diagram by using either the barycentric or median heuristic method.
 */
import {
  LineageNode,
  LineageEdge,
  LayerNodeMap,
  LayerNodeWeights,
  LayerEdgeWeights,
  EdgePriorities,
  LayerNodeOrders,
} from "@/src/interfaces";
import { WeightHeuristic } from "@/src/types";
import { RandomUtils } from "@/src/utils";
import { Dfs } from "@/src/algorithms";
import { useHierarchicDPStore } from "@/src/stores/useHierarchicDPStore";

export class Sequencer {
  private _layerNodeWeights: LayerNodeWeights;
  private _layerEdgeWeights: LayerEdgeWeights;
  private _layerNodeOrders: { [key: string]: number };

  private _layerNodeMap: LayerNodeMap;
  private _edgePriorities: EdgePriorities;

  private _nonIncrementalNodesByLayer: Record<number, LineageNode[]> | null;
  private _edgeCrossingCosts: Map<string, number>;

  private _incrementalNodesByLayer: Record<number, LineageNode[]> | null;
  private _totalIncrementalCount: number;
  private _firstIncrementalLayer: number | null;
  private _lastIncrementalLayer: number | null;

  constructor(
    enableProcessWithConstraints: boolean,
    edgePriorities: EdgePriorities,
    layerNodeMap: LayerNodeMap
  ) {
    this._layerNodeWeights = {};
    this._layerEdgeWeights = {};

    this._edgePriorities = edgePriorities;

    this._layerNodeOrders = {};

    this._layerNodeMap = layerNodeMap;
    this._enableProcessWithConstraints = enableProcessWithConstraints;
    this._incrementalNodesByLayer = {};
    this._nonIncrementalNodesByLayer = {};
    this._totalIncrementalCount = 0;
    this._edgeCrossingCosts = new Map<string, number>();
    this._firstIncrementalLayer = null;
    this._lastIncrementalLayer = null;
  }
  processIncrementalNodes(newNodes: LineageNode[]): boolean {
    let firstLayer = Number.MAX_SAFE_INTEGER;
    let lastLayer = Number.MIN_SAFE_INTEGER;
    let totalIncrementalCount = 0;

    const layerCount = this._layerNodeMap.layerCount;
    const newNodeIds = new Set(newNodes.map((node) => node.id));

    // Iterate through each layer in the LayerNodeMap
    for (let layerIndex = 0; layerIndex < layerCount; layerIndex++) {
      const layerNodes = this._layerNodeMap.layeredGraph[layerIndex];
      const incrementalNodes: LineageNode[] = [];
      const nonIncrementalNodes: LineageNode[] = [];

      // Separate incremental and non-incremental nodes
      for (const node of layerNodes) {
        if (newNodeIds.has(node.id)) {
          incrementalNodes.push(node);
        } else {
          nonIncrementalNodes.push(node);
        }
      }

      // If there are incremental nodes in this layer, update state
      if (incrementalNodes.length > 0) {
        this._incrementalNodesByLayer = this._incrementalNodesByLayer ?? {};
        this._incrementalNodesByLayer[layerIndex] = incrementalNodes;

        totalIncrementalCount += incrementalNodes.length;

        if (nonIncrementalNodes.length > 0) {
          this._nonIncrementalNodesByLayer =
            this._nonIncrementalNodesByLayer ?? {};
          this._nonIncrementalNodesByLayer[layerIndex] = nonIncrementalNodes;
        }

        // Update first and last layer indices
        firstLayer = Math.min(firstLayer, layerIndex);
        lastLayer = Math.max(lastLayer, layerIndex);
      }
    }

    // Update internal state based on whether incremental nodes were found
    if (totalIncrementalCount > 0) {
      this._totalIncrementalCount = totalIncrementalCount;
      this._firstIncrementalLayer = firstLayer;
      this._lastIncrementalLayer = lastLayer;
    } else {
      this._incrementalNodesByLayer = null;
      this._nonIncrementalNodesByLayer = null;
      this._totalIncrementalCount = 0;
    }

    return true;
  }
  sequenceNodeLayers(nodes: LineageNode[], edges: LineageEdge[]) {
    const totalIncrementalCount = edges.length;
    const nodeCount = nodes.length;
    const layerCount = this._layerNodeMap.layerCount;

    const edgeFlags: Map<string, number> = new Map();
    const nodeOrderMapping: Map<string, number> = new Map();

    let maxEdgeCrossingCost = 0;
    const dummyNodes: LineageNode[] = [];

    for (let layerIndex = 0; layerIndex < layerCount; layerIndex++) {
      const layerNodes = this._layerNodeMap.layeredGraph[layerIndex];
      layerNodes.forEach((node, index) => {
        nodeOrderMapping.set(node.id, index);
      });
    }

    // Calculate edge crossing costs
    for (const edge of edges) {
      const sourceLayer = nodeOrderMapping.get(edge.source) ?? -1;
      const targetLayer = nodeOrderMapping.get(edge.target) ?? -1;

      if (sourceLayer >= 0 && targetLayer >= 0) {
        const crossingCost = Math.abs(sourceLayer - targetLayer);
        this._edgeCrossingCosts.set(edge.id, crossingCost);
      }
    }

    // Sort nodes within each layer to minimize crossings
    for (let layerIndex = 0; layerIndex < layerCount; layerIndex++) {
      const layerNodes = this._layerNodeMap.layeredGraph[layerIndex];

      layerNodes.sort((a, b) => {
        const aOrder = nodeOrderMapping.get(a.id) ?? 0;
        const bOrder = nodeOrderMapping.get(b.id) ?? 0;
        return aOrder - bOrder;
      });

      // Update node order mapping after sorting
      layerNodes.forEach((node, index) => {
        nodeOrderMapping.set(node.id, index);
      });
    }

    // Log the final node order for debugging
    for (let layerIndex = 0; layerIndex < layerCount; layerIndex++) {
      const layerNodes = this._layerNodeMap.layeredGraph[layerIndex];
      console.log(
        `Layer ${layerIndex}:`,
        layerNodes.map((node) => node.id)
      );
    }
  }
  getConnectedNodeIndexes(
    edge: LineageEdge,
    edges: LineageEdge[],
    nodes: LineageNode[]
  ): string[] {
    const nextEdges = edges.filter((e) => e.source === edge.target);
    const previousEdges = edges.filter((e) => e.target === edge.source);

    const connectedEdges = [...nextEdges, ...previousEdges];
    const connectedIndexes = connectedEdges
      .map((e) => nodes.find((n) => n.id === e.source)?.id)
      .filter((index): index is string => index !== undefined);

    return connectedIndexes;
  }
  /*
   * Other Ideas to Factor In
   * LineageEdge length / span across layers (longer edge → lower priority)
   * Data importance or weight (e.g., frequency, volume)
   * LineageNode degree (total connections)
   * Path centrality (how many paths use this edge)
   */
  private calculateEdgePriorities(edges: LineageEdge[], nodeId: string): void {
    // TODO: where to call this function?
    const edgePriorities: EdgePriorities = {};

    // Factor in the LineageEdge Type
    const sourceEdges = edges.filter((e) => e.source === nodeId);
    const targetEdges = edges.filter((e) => e.target === nodeId);
    for (const edge of edges) {
      let priority = 0;

      const isSource = edge.source === nodeId;
      const isTarget = edge.target === nodeId;

      if (isSource) {
        priority += 1;
        if (sourceEdges.length > 1) {
          priority += sourceEdges.length * 0.1;
        }
      } else if (isTarget) {
        priority += 2;
        if (targetEdges.length > 1) {
          priority += targetEdges.length * 0.1;
        }
      }
      // Add edge crossing cost factor (lower cost = higher priority)
      const crossingCost = this._edgeCrossingCosts.get(edge.id) ?? 0;
      priority += 1 / (crossingCost + 1);

      edgePriorities[edge.id] = priority;
    }
    this._edgePriorities = edgePriorities;
  }
  private calculateMaxWeight(componentType: string): number {
    let maxWeight = 0;
    if (componentType === "node") {
      for (const layerId in this._layerNodeWeights) {
        const nodeWeights = this._layerNodeWeights[layerId];
        for (const nodeId in nodeWeights) {
          maxWeight = Math.max(maxWeight, nodeWeights[nodeId]);
        }
      }
      return maxWeight;
    } else if (componentType === "edge") {
      for (const layerId in this._layerEdgeWeights) {
        const edgeWeights = this._layerEdgeWeights[layerId];
        for (const edgeId in edgeWeights) {
          maxWeight = Math.max(maxWeight, edgeWeights[edgeId]);
        }
      }
      return maxWeight;
    }
    return maxWeight;
  }
  private getNextUpwardEdge(
    edge: LineageEdge,
    edges: LineageEdge[]
  ): LineageEdge | null {
    return edges.find((e) => e.source === edge.target) || null;
  }
  private getNextDownwardEdge(
    edge: LineageEdge,
    edges: LineageEdge[]
  ): LineageEdge | null {
    return edges.find((e) => e.target === edge.source) || null;
  }
  private getLayerIdForNode(nodeId: string): number {
    const layerId = Object.keys(this._layerNodeMap.layeredGraph).find((key) =>
      this._layerNodeMap.layeredGraph[Number(key)].some(
        (node: LineageNode) => node.id === nodeId
      )
    );

    if (layerId === undefined) {
      throw new Error(`Layer containing node with id ${nodeId} not found`);
    }

    return Number(layerId);
  }
  // NODE & EDGE WEIGHTS
  calculateLayerWeights(
    edges: LineageEdge[],
    weightHeuristic: WeightHeuristic,
    isUpward: boolean
  ): void {
    for (const edge of edges) {
      let nodeWeight = 0;
      let edgeWeight = 0;
      if (weightHeuristic === "BARYCENTER") {
        nodeWeight = this.calculateBarycenterLayerNodeWeight(
          edges,
          edge,
          isUpward
        );
        edgeWeight = this.calculateBarycenterLayerEdgeWeight(
          edges,
          edge,
          isUpward
        );
      } else if (weightHeuristic === "MEDIAN") {
        nodeWeight = this.calculateMedianLayerNodeWeight(edges, edge, isUpward);
        edgeWeight = this.calculateMedianLayerEdgeWeight(edges, edge, isUpward);
      } else {
        throw new Error(`Unsupported weight heuristic: ${weightHeuristic}`);
      }
      const nodeId = isUpward ? edge.target : edge.source;
      const layerId = this.getLayerIdForNode(nodeId);

      if (!this._layerNodeWeights[layerId]) {
        this._layerNodeWeights[layerId] = {};
      }
      this._layerNodeWeights[layerId][nodeId] = nodeWeight;

      const sourceId = isUpward ? edge.target : edge.source;
      const targetId = isUpward ? edge.source : edge.target;
      const edgeId = `${sourceId}-${targetId}`;

      if (!this._layerEdgeWeights[layerId]) {
        this._layerEdgeWeights[layerId] = {};
      }
      this._layerEdgeWeights[layerId][edgeId] = edgeWeight;
    }
  }
  private calculateBarycenterLayerNodeWeight(
    edges: LineageEdge[],
    edge: LineageEdge,
    isUpward: boolean
  ): number {
    // returns the average of connected node weights(barycenter) — good for smooth layering and central alignment
    const maxWeight = this.calculateMaxWeight("node");
    const layerCount = this._layerNodeMap.layerCount;
    const nodeId = isUpward ? edge.target : edge.source;
    const layerId = this.getLayerIdForNode(nodeId);
    const layerWeights = this._layerNodeWeights[layerId] ?? {};

    // Gather connected edges in the desired direction(upward or downward)
    const connectedEdges = isUpward
      ? edges.filter((e) => e.target === nodeId)
      : edges.filter((e) => e.source === nodeId);

    const edgeCount = connectedEdges.length;

    // Handle node with no connected edges in the given direction
    if (edgeCount === 0) {
      const nodeWeight = layerWeights[nodeId] ?? 0;

      if (nodeWeight === 0) return -1;

      return nodeWeight >= layerCount - 1
        ? maxWeight
        : ((maxWeight - 1) * nodeWeight) / (layerCount - 1);
    }

    // add up the weights of connected edges
    let totalWeight = 0;

    for (const connectedEdge of connectedEdges) {
      const weight = this.calculateNodeWeight(edges, connectedEdge, isUpward);
      totalWeight += weight;
    }

    return totalWeight / edgeCount;
  }
  private calculateBarycenterLayerEdgeWeight(
    edges: LineageEdge[],
    edge: LineageEdge,
    isUpward: boolean
  ): number {
    // returns the average of connected node weights(barycenter) — good for smooth layering and central alignment
    const maxWeight = this.calculateMaxWeight("edge");
    const layerCount = this._layerNodeMap.layerCount;
    const nodeId = isUpward ? edge.target : edge.source;
    const layerId = this.getLayerIdForNode(nodeId);
    const layerWeights = this._layerEdgeWeights[layerId] ?? {};

    // Gather connected edges in the desired direction(upward or downward)
    const connectedEdges = isUpward
      ? edges.filter((e) => e.target === nodeId)
      : edges.filter((e) => e.source === nodeId);

    const edgeCount = connectedEdges.length;

    // Handle node with no connected edges in the given direction
    if (edgeCount === 0) {
      const edgeWeight = layerWeights[nodeId] ?? 0;

      if (edgeWeight === 0) return -1;

      return edgeWeight >= layerCount - 1
        ? maxWeight
        : ((maxWeight - 1) * edgeWeight) / (layerCount - 1);
    }

    // add up the weights of connected edges
    let totalWeight = 0;

    for (const connectedEdge of connectedEdges) {
      const weight = this.calculateEdgeWeight(edges, connectedEdge, isUpward);
      totalWeight += weight;
    }

    return totalWeight / edgeCount;
  }
  private calculateMedianLayerNodeWeight(
    edges: LineageEdge[],
    edge: LineageEdge,
    isUpward: boolean
  ): number {
    // returns the central tendency — more resistant to outliers or skewed edge distribution.
    const layerNodeWeights: number[] = [];
    const maxWeight = this.calculateMaxWeight("node");
    const layerCount = this._layerNodeMap.layerCount;

    let currentEdge: LineageEdge | null = edge;

    while (currentEdge) {
      const nodeWeight = this.calculateNodeWeight(edges, currentEdge, isUpward);
      layerNodeWeights.push(nodeWeight);

      currentEdge = isUpward
        ? this.getNextUpwardEdge(currentEdge, edges)
        : this.getNextDownwardEdge(currentEdge, edges);
    }

    //no connected edges found
    if (layerNodeWeights.length === 0) {
      const nodeId = isUpward ? edge.target : edge.source;
      const layerId = this.getLayerIdForNode(nodeId);
      const nodeWeight = this._layerNodeWeights[layerId]?.[nodeId] ?? 0;

      if (nodeWeight === 0) return -1;

      return nodeWeight >= layerCount - 1
        ? maxWeight
        : ((maxWeight - 1) * nodeWeight) / (layerCount - 1);
    }

    // Sort the weights to prepare for median calculation
    layerNodeWeights.sort((a, b) => a - b);
    const count = layerNodeWeights.length;
    const mid = Math.floor(count / 2);

    // Basic median if count is odd
    if (count % 2 === 1) {
      return layerNodeWeights[mid];
    }

    // If even, use a weighted median to reduce bias from skewed halves
    const lowerHalfRange = layerNodeWeights[mid - 1] - layerNodeWeights[0];
    const upperHalfRange = layerNodeWeights[count - 1] - layerNodeWeights[mid];

    if (lowerHalfRange !== 0 || upperHalfRange !== 0) {
      return (
        (layerNodeWeights[mid - 1] * upperHalfRange +
          layerNodeWeights[mid] * lowerHalfRange) /
        (lowerHalfRange + upperHalfRange)
      );
    } else {
      return 0.5 * (layerNodeWeights[mid - 1] + layerNodeWeights[mid]);
    }
  }
  private calculateMedianLayerEdgeWeight(
    edges: LineageEdge[],
    edge: LineageEdge,
    isUpward: boolean
  ): number {
    // returns the central tendency — more resistant to outliers or skewed edge distribution.
    const layerEdgeWeights: number[] = [];
    const maxWeight = this.calculateMaxWeight("edge");
    const layerCount = this._layerNodeMap.layerCount;

    let currentEdge: LineageEdge | null = edge;

    while (currentEdge) {
      const edgeWeight = this.calculateEdgeWeight(edges, currentEdge, isUpward);
      layerEdgeWeights.push(edgeWeight);

      currentEdge = isUpward
        ? this.getNextUpwardEdge(currentEdge, edges)
        : this.getNextDownwardEdge(currentEdge, edges);
    }

    //no connected edges found
    if (layerEdgeWeights.length === 0) {
      const nodeId = isUpward ? edge.target : edge.source;
      const layerId = this.getLayerIdForNode(nodeId);
      const edgeWeight = this._layerNodeWeights[layerId]?.[nodeId] ?? 0;

      if (edgeWeight === 0) return -1;

      return edgeWeight >= layerCount - 1
        ? maxWeight
        : ((maxWeight - 1) * edgeWeight) / (layerCount - 1);
    }

    // Sort the weights to prepare for median calculation
    layerEdgeWeights.sort((a, b) => a - b);
    const count = layerEdgeWeights.length;
    const mid = Math.floor(count / 2);

    // Basic median if count is odd
    if (count % 2 === 1) {
      return layerEdgeWeights[mid];
    }

    // If even, use a weighted median to reduce bias from skewed halves
    const lowerHalfRange = layerEdgeWeights[mid - 1] - layerEdgeWeights[0];
    const upperHalfRange = layerEdgeWeights[count - 1] - layerEdgeWeights[mid];

    if (lowerHalfRange !== 0 || upperHalfRange !== 0) {
      return (
        (layerEdgeWeights[mid - 1] * upperHalfRange +
          layerEdgeWeights[mid] * lowerHalfRange) /
        (lowerHalfRange + upperHalfRange)
      );
    } else {
      return 0.5 * (layerEdgeWeights[mid - 1] + layerEdgeWeights[mid]);
    }
  }
  private calculateNodeWeight(
    edges: LineageEdge[],
    edge: LineageEdge,
    isUpward: boolean
  ): number {
    let weight = 0;
    const nodeId = isUpward ? edge.target : edge.source;
    const layerCount = this._layerNodeMap.layerCount;
    const maxWeight = this.calculateMaxWeight("node");

    const layerId = this.getLayerIdForNode(nodeId);

    if (layerId < 0 || layerId === undefined) {
      throw new Error(`Layer containing node with id ${nodeId} not found`);
    }

    const nodeWeight = this._layerNodeWeights[Number(layerId)]?.[nodeId];

    if (nodeWeight === undefined || nodeWeight === null) {
      // Calculate weight based on connected edges
      const connectedEdge = isUpward
        ? edges.find((e) => e.source === edge.target)
        : edges.find((e) => e.target === edge.source);

      if (connectedEdge) {
        const connectedNodeId = isUpward
          ? connectedEdge.source
          : connectedEdge.target;

        const connectedNodeWeight =
          this._layerNodeWeights[Number(layerId)]?.[connectedNodeId] ?? 0;

        weight = ((maxWeight - 1) * connectedNodeWeight) / (layerCount - 1);

        const edgeTypeSource = edges.filter((e) => e.source === nodeId);
        weight += 0.1 * edgeTypeSource.length;

        const edgePriority = this._edgePriorities[connectedEdge.id] ?? 0;
        weight -= 0.01 * edgePriority;
      }
    } else {
      weight = nodeWeight;

      const edgeTypeSource = edges.filter((e) => e.source === nodeId);
      weight += 0.1 * edgeTypeSource.length;

      const connectedEdge = isUpward
        ? edges.find((e) => e.source === edge.target)
        : edges.find((e) => e.target === edge.source);

      if (connectedEdge) {
        const edgePriority = this._edgePriorities[connectedEdge.id] ?? 0;
        weight -= 0.01 * edgePriority;
      }
    }

    return weight;
  }
  private calculateEdgeWeight(
    edges: LineageEdge[],
    edge: LineageEdge,
    isUpward: boolean
  ): number {
    const layerCount = this._layerNodeMap.layerCount;
    const maxWeight = this.calculateMaxWeight("edge");

    const sourceNodeId = edge.source;
    const targetNodeId = edge.target;

    const layerId = this.getLayerIdForNode(
      isUpward ? targetNodeId : sourceNodeId
    );

    if (layerId < 0 || layerId === undefined) {
      throw new Error(`Layer containing node not found for edge ${edge.id}`);
    }

    const sourceNodeWeight =
      this._layerNodeWeights[layerId]?.[sourceNodeId] ?? 0;

    const targetNodeWeight =
      this._layerNodeWeights[layerId]?.[targetNodeId] ?? 0;

    let weight =
      ((maxWeight - 1) * (sourceNodeWeight + targetNodeWeight)) /
      2 /
      (layerCount - 1);

    const sameSourceEdges = edges.filter((e) => e.source === sourceNodeId);
    const sameTargetEdges = edges.filter((e) => e.target === targetNodeId);

    weight += 0.05 * (sameSourceEdges.length + sameTargetEdges.length);

    const edgePriority = this._edgePriorities[edge.id] ?? 0;
    weight -= 0.01 * edgePriority;

    return weight;
  }
  // NODE ORDERS
  private nodeWeightComparer(node1: LineageNode, node2: LineageNode): number {
    const layerA = this.getLayerIdForNode(node1.id);
    const layerB = this.getLayerIdForNode(node2.id);

    const weightA = this._layerEdgeWeights?.[layerA]?.[node1.id] ?? 0;
    const weightB = this._layerEdgeWeights?.[layerB]?.[node2.id] ?? 0;

    return weightA - weightB;
  }
  private edgeWeightComparer(edge1: LineageEdge, edge2: LineageEdge): number {
    const layerA = this.getLayerIdForNode(edge1.source);
    const layerB = this.getLayerIdForNode(edge2.source);

    const weightA = this._layerEdgeWeights?.[layerA]?.[edge1.id] ?? 0;
    const weightB = this._layerEdgeWeights?.[layerB]?.[edge2.id] ?? 0;

    return weightA - weightB;
  }
  private randomizeNodeOrderAndSortEdges(
    nodes: LineageNode[],
    edges: LineageEdge[],
    randomizer: RandomUtils
  ): { sortedNodes: LineageNode[]; sortedEdges: LineageEdge[] } {
    for (const node of nodes) {
      const nodeId = Number(node.id);
      this._layerNodeOrders[node.id as string] = randomizer.getRandomInt();
    }
    const sortedEdges = edges.sort((a, b) => this.edgeWeightComparer(a, b));
    const sortedNodes = nodes.sort((a, b) => this.nodeWeightComparer(a, b));
    return { sortedNodes, sortedEdges };
  }
  private sortLayerNodes(
    nodes: LineageNode[],
    nodeOrder: { [nodeId: string]: number },
    comparator: (a: LineageNode, b: LineageNode) => number
  ): void {
    const sortedNodes = [...nodes];

    sortedNodes.sort(comparator);

    for (let i = 0; i < sortedNodes.length; i++) {
      nodes[i] = sortedNodes[i];
      nodeOrder[sortedNodes[i].id] = i;
    }
  }
  private assignNodeIndices(
    layerNodes: LineageNode[],
    nodeOrder: { [nodeId: string]: number }
  ): void {
    for (let index = 0; index < layerNodes.length; index++) {
      const node = layerNodes[index];
      nodeOrder[node.id] = index;
    }
  }

  private processLayerNodeOrder(
    nodes: LineageNode[],
    edges: LineageEdge[],
    randomizer: RandomUtils
  ): LayerNodeOrders {
    const nodeToLayerMap = this._layerNodeMap.layeredGraph;
    const layerCount = this._layerNodeMap.layerCount;
    const layerIndices: { [nodeId: string]: number } = {};
    const layerNodeOrders: LayerNodeOrders = {};

    // Map each node ID to its corresponding layer index
    for (let layerIndex = 0; layerIndex < layerCount; layerIndex++) {
      const layerNodes = nodeToLayerMap[layerIndex];
      for (const node of layerNodes) {
        layerIndices[node.id] = layerIndex;
      }
    }

    // Handle randomization if a randomizer is provided
    if (randomizer && nodes.length > 0 && edges.length > 0) {
      // Randomize node and edge order
      const { sortedNodes, sortedEdges } = this.randomizeNodeOrderAndSortEdges(
        nodes,
        edges,
        randomizer
      );

      // Select a random node as the starting point
      const randomIndex = Math.floor(
        randomizer.generateRandomNumber(nodes.length) * sortedNodes.length
      );
      const firstNode = sortedNodes[randomIndex];

      // Shuffle nodes and edges using a proper comparator
      nodes.sort(() => randomizer.generateRandomNumber(nodes.length) - 0.5);
      edges.sort(() => randomizer.generateRandomNumber(nodes.length) - 0.5);

      // Reset node order mapping
      for (const node of nodes) {
        this._layerNodeOrders[node.id] = 0;
      }

      // Custom DFS to traverse the graph
      const dfsProcessor = new Sequencer.DFSProcessor(nodes, edges);
      dfsProcessor.directedMode = false;
      dfsProcessor.lookFurtherMode = true;
      dfsProcessor.dfs(firstNode.id);
      dfsProcessor.resetVisited();
    }

    // Sort nodes within layers based on constraints and weights
    for (let layerIndex = 0; layerIndex < layerCount; layerIndex++) {
      const layerNodes = nodeToLayerMap[layerIndex];
      this.sortLayerNodes(
        layerNodes,
        this._layerNodeOrders,
        this.edgeWeightProcessor
      );
    }

    if (this.edgeConstraintProcessor !== null) {
      for (let layerIndex = 0; layerIndex < layerCount; layerIndex++) {
        const layerNodes = nodeToLayerMap[layerIndex];
        this.sortLayerNodes(
          layerNodes,
          this._layerNodeOrders,
          this.edgeConstraintProcessor
        );
      }
    } else {
      // no edge constraint sorting
      for (let layerIndex = 0; layerIndex < layerCount; layerIndex++) {
        const layerNodes = nodeToLayerMap[layerIndex];
        this.assignNodeIndices(layerNodes, this._layerNodeOrders);
      }
    }
    return layerNodeOrders;
  }
  // EDGE CROSSING
  private processGraphEdges(
    nodes: LineageNode[],
    edges: LineageEdge[],
    currentNodeId: string,
    startEdgeId: string
  ): boolean {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const edgeMap = new Map(edges.map((e) => [e.id, e]));

    let currentNode = nodeMap.get(currentNodeId);
    let currentEdge = edgeMap.get(startEdgeId);
    let lastEdge: LineageEdge | null = null;
    let lastDirection: 0 | 1 = 0;
    let previousNode: LineageNode | undefined = currentNode;
    let edgeFlags: [boolean, boolean] = [false, false];
    let edgeCount = 0;
    let isComplete = false;
    const mainEdgeList: LineageEdge[] = [];

    if (!currentNode || !currentEdge) {
      console.warn("Invalid node or edge.");
      return false;
    }

    const linkedLists: [LineageEdge[], LineageEdge[]] = [[], []];

    while (!isComplete && edgeCount < 2) {
      for (let direction = 0; direction < 2; direction++) {
        if (!edgeFlags[direction]) {
          const outgoing = direction === 0;
          const connectedEdges = edges.filter((e) =>
            outgoing
              ? e.source === currentNode!.id
              : e.target === currentNode!.id
          );

          if (connectedEdges.length === 0) {
            edgeFlags[direction] = true;
            continue;
          }

          const nextEdge = connectedEdges[0];
          const nextNodeId = outgoing ? nextEdge.target : nextEdge.source;
          const nextNode = nodeMap.get(nextNodeId);

          if (!nextNode) {
            edgeFlags[direction] = true;
            continue;
          }

          if (parseInt(nextNode.id) < parseInt(currentNode.id)) {
            // LineageEdge completed
            edgeCount++;
            edgeFlags[direction] = true;
            mainEdgeList.push(nextEdge);
          } else {
            // Continue walking
            currentNode = nextNode;
            currentEdge = nextEdge;
            linkedLists[direction].push(nextEdge);
          }
        }
      }

      if (edgeCount < 2) {
        const primaryDirection = edgeFlags[0] ? 1 : 0;
        const chosenList = linkedLists[primaryDirection];

        if (lastEdge) {
          if (primaryDirection === 0) {
            currentNode.addOutgoingEdge(edge);
          } else {
            currentNode.addIncomingEdge(edge);
          }
          currentNode.getEdge();
        } else {
          mainEdgeList.push(...chosenList);
          if (lastDirection === primaryDirection) {
            lastEdge.processEdge();
          }
          if (primaryDirection === 0) {
            currentNode.addOutgoingEdge(lastEdge.getEdgeList());
          } else {
            currentNode.addIncomingEdge(lastEdge.getEdgeList());
          }
        }
        if (
          hasProcessed ||
          this.mainLinkedList.addEdges(this.linkedLists[1 ^ primaryDirection])
        ) {
          if (previousEdge!.getSourceNodeId() === currentNodeIndex) {
            isComplete = true;

            for (
              var edgeIterator = this.mainLinkedList.getEdges();
              edgeIterator.hasNext();

            ) {
              var edge = edgeIterator.next();
              edge.setPreviousEdge(previousEdge);
              edge.reset();
            }

            if (edgeDirection === 0) {
              previousEdge!.getEdgeList().addOutgoingEdge(this.mainLinkedList);
            } else {
              previousEdge!.getEdgeList().addIncomingEdge(this.mainLinkedList);
            }

            this.mainLinkedList.reset();
          } else {
            previousEdge!.markAsProcessed();
            lastEdge = previousEdge;
            lastDirection = edgeDirection;
            currentNode = previousEdge!.getSourceNode();
            edgeCount = 0;
          }
          linkedLists[0] = [];
          linkedLists[1] = [];
        } else {
          // Finalize
          isComplete = true;
        }
      }
    }

    // Here you'd normally attach mainEdgeList to the graph or update states

    return isComplete;
  }

  private calculateUpwardEdgeCrossing(
    nodes: LineageNode[],
    edges: LineageEdge[],
    currentNode: LineageNode,
    excludedNode: LineageNode
  ): number {
    let crossingCount = 0;
    const nodePosition = this._layerNodeOrders[currentNode.id];

    for (const edge of edges) {
      if (edge.source !== currentNode.id) {
        continue; // Only consider outgoing edges
      }
      const targetNodeId = edge.target;
      if (edgeFlags[targetNodeId] < 0) {
        if (targetNodeId !== excludedNodeId) {
          const positionDifference = nodeOrder[targetNodeId] - nodePosition;

          if (positionDifference > 0) {
            crossingCount += 1;
          } else if (positionDifference < 0) {
            crossingCount -= 1;
          }
        }
      }
    }

    return crossingCount;
  }

  private calculateDownwardEdgeCrossing(
    node: any,
    layerIndex: any,
    nodeOrder: any
  ): number {
    let crossingCount = 0;
    const nodePosition = nodeOrder[node.index];

    for (let edge = node.$f13; edge !== null; edge = edge.$f15) {
      const targetNodeIndex = edge.$f3.index;

      if (this.edgeFlags[targetNodeIndex] < 0) {
        const targetLayerIndex =
          edge.$f11 === null ? edge.$f10.$f2 : edge.$f11.$f2;

        if (targetLayerIndex !== layerIndex) {
          const positionDifference =
            nodeOrder[targetLayerIndex.index] - nodePosition;

          crossingCount +=
            positionDifference > 0 ? 1 : positionDifference < 0 ? -1 : 0;
        }
      }
    }

    return crossingCount;
  }

  static DFSProcessor = class extends Dfs {
    private graphNodes: LineageNode[];
    private graphEdges: LineageEdge[];
    private visited: Set<string>;

    constructor(nodes: LineageNode[], edges: LineageEdge[]) {
      super();
      this.graphNodes = nodes;
      this.graphEdges = edges;
      this.visited = new Set();
    }

    /**
     * Perform a depth-first search starting from a specific node.
     * @param startNodeId The ID of the node to start the DFS from.
     * @param preVisitCallback A callback function to execute before visiting a node.
     */
    dfs(
      startNodeId: string,
      preVisitCallback?: (node: LineageNode) => void
    ): void {
      if (this.visited.has(startNodeId)) return;

      // Mark the node as visited
      this.visited.add(startNodeId);

      // Find the current node
      const currentNode = this.graphNodes.find(
        (node) => node.id === startNodeId
      );
      if (!currentNode) {
        console.warn(`LineageNode with ID ${startNodeId} not found.`);
        return;
      }

      // Execute the pre-visit callback if provided
      if (preVisitCallback) {
        preVisitCallback(currentNode);
      }

      // Find all outgoing edges from the current node
      const outgoingEdges = this.graphEdges.filter(
        (edge) => edge.source === startNodeId
      );

      // Recursively visit all target nodes connected by outgoing edges
      for (const edge of outgoingEdges) {
        this.dfs(edge.target, preVisitCallback);
      }
    }

    /**
     * Reset the visited nodes set.
     */
    resetVisited(): void {
      this.visited.clear();
    }
  };
}
