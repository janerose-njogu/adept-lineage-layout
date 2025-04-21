import { LineageNode, LineageEdge } from "@/src/interfaces";

function traverseComponent(
  startNodeId: string,
  edges: LineageEdge[],
  componentMap: Map<string, number>,
  componentIndex: number
) {
  const stack: string[] = [startNodeId];
  componentMap.set(startNodeId, componentIndex);

  while (stack.length > 0) {
    const currentNodeId = stack.pop()!;
    const connectedEdges = edges.filter(
      (e) => e.source === currentNodeId || e.target === currentNodeId
    );

    for (const edge of connectedEdges) {
      const neighborId =
        edge.source === currentNodeId ? edge.target : edge.source;
      if (!componentMap.has(neighborId)) {
        componentMap.set(neighborId, componentIndex);
        stack.push(neighborId);
      }
    }
  }
}
export function computeConnectedComponents(
  nodes: LineageNode[],
  edges: LineageEdge[]
): { componentMap: Map<string, number>; componentCount: number } {
  const componentMap = new Map<string, number>();
  let componentIndex = 0;

  for (const node of nodes) {
    if (!componentMap.has(node.id)) {
      traverseComponent(node.id, edges, componentMap, componentIndex++);
    }
  }
  return { componentMap, componentCount: componentIndex };
}
