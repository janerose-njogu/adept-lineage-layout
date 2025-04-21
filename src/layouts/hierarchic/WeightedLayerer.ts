import { LineageNode, LineageEdge } from "@/src/types";
import { computeConnectedComponents } from "@/src/utils";

export class WeightedLayerer {
  constructor() {}

  assignNodeLayersWithWeightProvider(
    nodes: LineageNode[],
    edges: LineageEdge[],
    layers: Map<string, number>,
    weightProvider: WeightProvider,
    weightedCycleRemoval: boolean = false
  ): number {
    const weight = weightProvider;

    // Optional maps for cycle removal
    const nodeMap = weightedCycleRemoval ? new Map<string, any>() : null;
    const edgeMap = weightedCycleRemoval ? new Map<string, any>() : null;

    // Compute connected components (returns array of sets of node ids)
    const { componentMap, componentCount } = computeConnectedComponents(
      nodes,
      edges
    );
    const components = Array.from(
      { length: componentCount },
      () => new Set<string>()
    );
    for (const [nodeId, componentIndex] of componentMap.entries()) {
      components[componentIndex].add(nodeId);
    }

    let maxLayer = 0;

    for (const component of components) {
      // Partition the graph based on current component
      const subNodes = nodes.filter((node) => component.has(node.id));
      const subEdges = edges.filter(
        (edge) => component.has(edge.source) && component.has(edge.target)
      );

      // Optionally remove cycles in the component
      if (weightedCycleRemoval) {
        removeCycles(subNodes, subEdges, edgeRanks, nodeMap, edgeMap, weight);
      }

      // Assign layers to nodes in the current component
      const layer = assignLayersToMap(subNodes, subEdges, nodeRanks);
      maxLayer = Math.max(maxLayer, layer);
    }

    return maxLayer;
  }
  removeCycles(
    layerer: any,
    graph: any,
    typeGraph: any,
    nodeOrderMap: any,
    weightMap: any
  ): void {
    // No
    if (layerer.weightedCycleRemoval) {
      WeightedLayerer.performWeightedCycleRemoval(
        layerer,
        graph,
        typeGraph,
        nodeOrderMap,
        weightMap
      );
    } else {
      layerer.makeDFSAcyclic(graph, typeGraph);
    }
  }
  processSelfLoopsAndOppositeEdges(
    edges: LineageEdge[],
    edgeMap: Map<string, LineageEdge>,
    weightMap: Map<string, number>,
    getWeight: (edge: LineageEdge) => number
  ): void {
    for (const edge of edges) {
      if (edge.source === edge.target) {
        // Self-loop
        edge.hidden = true;
      } else {
        const key = `${edge.target}->${edge.source}`;
        const oppositeEdge = edgeMap.get(key);

        if (
          oppositeEdge &&
          oppositeEdge.source === edge.target &&
          oppositeEdge.target === edge.source
        ) {
          // Found opposite edge
          const currentWeight = weightMap.get(oppositeEdge.id) ?? 0;
          weightMap.set(oppositeEdge.id, currentWeight + getWeight(edge));
          weightMap.set(edge.id, currentWeight + getWeight(edge)); // Optional: sync both directions
          edge.hidden = true;
        } else {
          const forwardKey = `${edge.source}->${edge.target}`;
          edgeMap.set(forwardKey, edge);
          weightMap.set(edge.id, getWeight(edge));
        }
      }
    }
  }
  findCycleEdges(
    nodes: LineageNode[],
    edges: LineageEdge[],
    edgeFlags: Map<string, boolean>,
    weightProvider: WeightProvider | null
  ): void {
    if (!weightProvider) {
      weightProvider = {
        getNumber: () => 1
      };
    }
  
    const edgeCount = edges.length;
    const nodeCount = nodes.length;
  
    const visitedEdges = new Array<boolean>(edgeCount).fill(false);
    const outgoingWeights = new Array<number>(nodeCount).fill(0);
    const incomingWeights = new Array<number>(nodeCount).fill(0);
    const indexMap = new Map(nodes.map((n, i) => [n.id, i]));
  
    const nodeManager = new NodeManager(indexMap);
  
    // Initialize edge flags
    for (const edge of edges) {
      edgeFlags.set(edge.id, false);
    }
  
    // Build adjacency for each node
    const outgoingMap = new Map<string, LineageEdge[]>();
    const incomingMap = new Map<string, LineageEdge[]>();
  
    for (const edge of edges) {
      if (!outgoingMap.has(edge.source)) outgoingMap.set(edge.source, []);
      if (!incomingMap.has(edge.target)) incomingMap.set(edge.target, []);
      outgoingMap.get(edge.source)!.push(edge);
      incomingMap.get(edge.target)!.push(edge);
    }
  
    // Pre-calculate in/out weights and enqueue nodes
    for (const node of nodes) {
      const outEdges = outgoingMap.get(node.id) ?? [];
      const inEdges = incomingMap.get(node.id) ?? [];
  
      let outWeight = 0;
      let inWeight = 0;
  
      for (const e of outEdges) outWeight += weightProvider.getNumber(e);
      for (const e of inEdges) inWeight += weightProvider.getNumber(e);
  
      outgoingWeights[node.index] = outWeight;
      incomingWeights[node.index] = inWeight;
  
      nodeManager.addNodeWithPriority(node, Math.min(outWeight, inWeight));
    }
  
    while (!nodeManager.isEmpty) {
      const currentNode = nodeManager.removeHighestPriorityNode();
      const currentIndex = currentNode.index;
  
      const outEdges = outgoingMap.get(currentNode.id) ?? [];
      const inEdges = incomingMap.get(currentNode.id) ?? [];
  
      const processEdge = (
        edge: LineageEdge,
        otherNodeId: string,
        isOutgoing: boolean
      ) => {
        const edgeIdx = edges.findIndex(e => e.id === edge.id);
        const otherIndex = indexMap.get(otherNodeId)!;
        if (visitedEdges[edgeIdx]) return;
  
        const w = weightProvider!.getNumber(edge);
        if (isOutgoing) {
          incomingWeights[otherIndex] -= w;
        } else {
          outgoingWeights[otherIndex] -= w;
        }
  
        if (
          (!isOutgoing && incomingWeights[currentIndex] >= outgoingWeights[currentIndex]) ||
          (isOutgoing && incomingWeights[currentIndex] < outgoingWeights[currentIndex])
        ) {
          edgeFlags.set(edge.id, true);
        }
  
        nodeManager.changeNodePriority(
          nodes[otherIndex],
          Math.min(outgoingWeights[otherIndex], incomingWeights[otherIndex])
        );
  
        visitedEdges[edgeIdx] = true;
      };
  
      if (incomingWeights[currentIndex] >= outgoingWeights[currentIndex]) {
        for (const e of outEdges) processEdge(e, e.target, true);
        for (const e of inEdges) processEdge(e, e.source, false);
      } else {
        for (const e of outEdges) processEdge(e, e.target, true);
        for (const e of inEdges) processEdge(e, e.source, false);
      }
    }
  }
  performWeightedCycleRemoval(
    _: any,
    graph: any,
    typeGraph: any,
    __: any,
    weightMap: any
  ): void {
    if (graph.edgeCount < 2 || graph.nodeCount < 2) {
      return;
    }

    const graphHider = new LayoutGraphHider(graph);
    const oppositeEdges = Map.createHashedNodeMap();
    this.processSelfLoopsAndOppositeEdges(
      graph,
      oppositeEdges,
      weightMap,
      graphHider
    );

    const cycleEdges = new GraphSet();
    if (graph.edgeCount > 500) {
      Cycles.findCycleEdges(
        graph,
        new WeightedLayerer.EdgeMap(cycleEdges),
        weightMap
      );
    } else {
      WeightedLayerer.findAndRemoveCycleEdgesSmallGraph(
        graph,
        cycleEdges,
        weightMap
      );
    }

    graphHider.unhideAll();
    for (
      const edgeCursor = graph.getEdgeCursor();
      edgeCursor.ok;
      edgeCursor.next()
    ) {
      const edge = edgeCursor.edge;
      if (
        cycleEdges.includes(edge) ||
        cycleEdges.includes(weightMap.get(edge))
      ) {
        graph.reverseEdge(edge);
        typeGraph.$m5(edge);
      }
    }
  }
}
