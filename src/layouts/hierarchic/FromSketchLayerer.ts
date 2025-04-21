/*
 * Uses user-specified positions or hints as a starting point for the layout,
 * allowing for a more intuitive and less disruptive layout process.
 */
import {
  LayoutConfig,
  LineageNode,
  LineageEdge,
  LayeredGraph,
} from "@/src/interfaces/hierarchic";
import { useHierarchicDPStore } from "@/src/stores/useHierarchicDPStore";


export class FromSketchLayerer {
  constructor() {}
  calculateMin(node: LineageNode, config: LayoutConfig): number {
    const height = node.height ?? config.minNodeSize;
    const adjustedSize = Math.max(
      config.minNodeSize,
      Math.min(
        config.maxNodeSize,
        2 * config.nodeHaloVal + height * config.nodeScaleFactor
      )
    );
    return node.position.y + 0.5 * (height - adjustedSize);
  }
  calculateMax(node: LineageNode, config: LayoutConfig): number {
    const height = node.height ?? config.minNodeSize;
    const adjustedSize = Math.max(
      config.minNodeSize,
      Math.min(
        config.maxNodeSize,
        2 * config.nodeHaloVal + height * config.nodeScaleFactor
      )
    );
    return node.position.y + 0.5 * (height + adjustedSize);
  }
  private assignNodesToLayers(
    nodes: LineageNode[],
    edges: LineageEdge[],
    layoutConfig: LayoutConfig
  ): {
    layerMap: Map<string, number>;
    reversedEdges: LineageEdge[];
    layerCount: number;
  } {
    if (nodes.length === 0) {
      return { layerMap: new Map(), reversedEdges: [], layerCount: 0 };
    }

    // Sort nodes using this.calculateMin with layoutConfig
    const sortedNodes = [...nodes].sort(
      (a, b) =>
        this.calculateMin(a, layoutConfig) - this.calculateMin(b, layoutConfig)
    );

    const layerMap = new Map<string, number>();
    let currentLayer = 0;
    let maxBoundary = this.calculateMax(sortedNodes[0], layoutConfig);
    layerMap.set(sortedNodes[0].id, currentLayer);

    for (let i = 1; i < sortedNodes.length; i++) {
      const currentNode = sortedNodes[i];
      const minBoundary = this.calculateMin(currentNode, layoutConfig);
      const maxBoundaryCurrent = this.calculateMax(currentNode, layoutConfig);

      if (minBoundary > maxBoundary) {
        currentLayer++;
        maxBoundary = maxBoundaryCurrent;
      } else if (maxBoundaryCurrent > maxBoundary) {
        maxBoundary = maxBoundaryCurrent;
      }

      layerMap.set(currentNode.id, currentLayer);
    }

    // Identify reversed edges based on the layerMap
    const reversedEdges: LineageEdge[] = [];
    for (const edge of edges) {
      const sourceNode = layerMap.get(edge.source) ?? 0;
      const targetNode = layerMap.get(edge.target) ?? 0;

      if (targetNode < sourceNode) {
        reversedEdges.push(edge);
      }
    }

    return {
      layerMap,
      reversedEdges,
      layerCount: currentLayer + 1,
    };
  }
  mapLayersToNodes(
    nodes: LineageNode[],
    edges: LineageEdge[],
    layoutConfig: LayoutConfig
  ): {
    layeredGraph: LayeredGraph;
    reversedEdges: LineageEdge[];
    layerCount: number;
  } {
    const { layerMap, reversedEdges, layerCount } = this.assignNodesToLayers(
      nodes,
      edges,
      layoutConfig
    );

    const layeredGraph: LayeredGraph = {};

    for (let i = 0; i < layerCount; i++) {
      layeredGraph[i] = [];
    }

    for (const node of nodes) {
      const layerIndex = layerMap.get(node.id) ?? 0;
      layeredGraph[layerIndex].push(node);
    }

    return {
      layeredGraph,
      reversedEdges,
      layerCount,
    };
  }
}
