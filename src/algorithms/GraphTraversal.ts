import { Node, Edge, getOutgoers, getIncomers } from "@xyflow/react";
import {
  LineageNode,
  LineageEdge,
  TraversalResult,
  StackEntry,
} from "@/src/interfaces";
import { DfsTraversalState } from "@/src/types";

export class GraphTraversal {
  // DFS gives finer control for layered graphs
  private nodes: Node[];
  private edges: Edge[];
  private stateMap: Map<string, DfsTraversalState> = new Map();
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

    const stack: StackEntry[] = [];
    const nodeChildren: Map<string, string[]> = new Map();
    const nodeLayers: Map<string, number> = new Map();

    for (const node of nodes) {
      this.stateMap.set(node.id, DfsTraversalState.WHITE);
    }

    let depth = 1; // depth starts at 1 to allow isolated nodes to be at depth 0
    stack.push({ node: startNode, parent: null, depth });

    while (stack.length > 0 && !this.isCancelled) {
      const { node, parent, depth } = stack.pop()!;

      const nodeState = this.stateMap.get(node.id);
      if (nodeState === DfsTraversalState.BLACK) {
        continue;
      }

      if (nodeState === DfsTraversalState.GRAY) {
        this.postVisit(node, depth);
        this.stateMap.set(node.id, DfsTraversalState.BLACK);
        continue;
      }

      this.stateMap.set(node.id, DfsTraversalState.GRAY);
      this.preVisit(node, depth);

      nodeLayers.set(node.id, depth);

      if (parent) {
        if (!nodeChildren.has(parent.id)) {
          nodeChildren.set(parent.id, []);
        }
        nodeChildren.get(parent.id)!.push(node.id);
      }

      stack.push({ node, parent, depth });

      const outgoers = getOutgoers(node, this.nodes, this.edges);

      for (let i = outgoers.length - 1; i >= 0; i--) {
        const child = outgoers[i];

        if (this.stateMap.get(child.id) !== DfsTraversalState.WHITE) {
          continue;
        }

        const edge = this.findEdge(node.id, child.id);
        if (edge) {
          this.preTraverse(edge, node, true);
        }

        stack.push({ node: child, parent: node, depth: depth + 1 });
      }
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
