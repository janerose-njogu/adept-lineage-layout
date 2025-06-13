import { Node, Edge, getOutgoers, getIncomers } from "@xyflow/react";
import {
  LineageNode,
  LineageEdge,
  TraversalResult,
  StackEntry,
} from "@/src/interfaces";
import { BfsTraversalState } from "@/src/types";

export class BfsTraversal {
  private nodes: Node[];
  private edges: Edge[];
  private stateMap: Map<string, BfsTraversalState> = new Map();
  private isCancelled = false;

  protected preVisit(_: LineageNode, __: number) {}
  protected postVisit(_: LineageNode, __: number) {}
  protected preTraverse(_: LineageEdge, __: LineageNode, ___: boolean) {}
  protected postTraverse(_: LineageEdge, __: LineageNode) {}

  constructor() {
    this.nodes = [];
    this.edges = [];
    this.stateMap = new Map();
    this.isCancelled = false;
  }

  public cancelTraversal() {
    this.isCancelled = true;
  }

  public findStartNodes(nodes: Node[], edges: Edge[]): Node[] {
    return nodes.filter((node) => {
      const incomers = getIncomers(node, nodes, edges);
      return incomers.length === 0;
    });
  }

  public traverse(
    startNode: Node,
    nodes: Node[],
    edges: Edge[]
  ): TraversalResult {
    this.nodes = nodes;
    this.edges = edges;
    this.stateMap.clear();
    this.isCancelled = false;

    const queue: StackEntry[] = [];
    const nodeChildren: Map<string, string[]> = new Map();
    const nodeLayers: Map<string, number> = new Map();

    // Initialize all nodes as unvisited (WHITE)
    for (const node of nodes) {
      this.stateMap.set(node.id, BfsTraversalState.WHITE);
    }

    // Start BFS with the root node
    let depth = 1;
    queue.push({ node: startNode, parent: null, depth });
    this.stateMap.set(startNode.id, BfsTraversalState.GRAY);

    while (queue.length > 0 && !this.isCancelled) {
      const { node, parent, depth } = queue.shift()!;

      // Process current node
      this.preVisit(node, depth);
      nodeLayers.set(node.id, depth);

      // Add current node to parent's children list
      if (parent) {
        if (!nodeChildren.has(parent.id)) {
          nodeChildren.set(parent.id, []);
        }
        nodeChildren.get(parent.id)!.push(node.id);
      }

      // Get all adjacent nodes
      const outgoers = getOutgoers(node, this.nodes, this.edges);

      // Process all adjacent nodes
      for (const child of outgoers) {
        if (this.stateMap.get(child.id) === BfsTraversalState.WHITE) {
          this.stateMap.set(child.id, BfsTraversalState.GRAY);

          const edge = this.findEdge(node.id, child.id);
          if (edge) {
            this.preTraverse(edge, node, true);
          }

          queue.push({ node: child, parent: node, depth: depth + 1 });
        }
      }

      // Mark current node as fully processed
      this.stateMap.set(node.id, BfsTraversalState.BLACK);
      this.postVisit(node, depth);
    }

    return {
      rootNode: startNode.id,
      nodeChildren: nodeChildren,
      nodeLayers: nodeLayers,
    };
  }

  private findEdge(
    sourceId: string,
    targetId: string
  ): LineageEdge | undefined {
    return this.edges.find(
      (e) => e.source === sourceId && e.target === targetId
    );
  }
}