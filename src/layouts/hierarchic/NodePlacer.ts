import { LineageNode } from "@/src/interfaces";
import { HierarchicalLayoutLayerType } from "@/src/types";
import { useHierarchicDPStore } from "@/src/stores/useHierarchicDPStore";

export class NodePlacer {
  private _fromSketchLayerAssignment:boolean;
  private _minimumSublayerDistance: number;
  constructor() {
    this._fromSketchLayerAssignment = false;
    this._minimumSublayerDistance = 15;
  }
  private isFixedNode(node: LineageNode): boolean {
    return node.data?.fixed === true;
  }
  private getLayerType(node: LineageNode): string {
    return node.data?.layerType ?? "NORMAL";
  }
  calculateLayerSpacing(
    nodePlacer: NodePlacer,
    nodes: LineageNode[],
    layoutData: HierarchicLayoutCore.LayoutDataProvider,
    activeNodeMap: Map<string, boolean>,
    // gridAlignment: GridAlignment
  ): CalculateLayerSpacingResult {
    const layerProvider = useHierarchicDPStore
      .getState()
      .getData("LAYER_INDEX_DP_KEY");
      for (const [_, layerNodes] of Object.entries(
        layerProvider.layeredGraph as Record<string, LineageNode[]>
      )) {
    const isSpecialLayer =
      layerNodes.length > 0 && this.getLayerType(layerNodes[0]) !== "NORMAL";

    const layoutWidth = nodeLayoutDP
      ? nodeLayoutDP.getLayoutWidth()
      : this._minimumSublayerDistance;

    const minimumSpacing = isSpecialLayer
      ? layoutWidth
      : this._minimumSublayerDistance;
    
    let maxNormalHeight = 0;
    let maxSpecialHeight = 0;
    for (const node of nodes) {
      const nodeData = layoutData.getNodeData(node);
      const layoutDescriptor = nodeData?.nodeLayoutDescriptor;
      const offsetPoint = layoutDescriptor
        ? layoutDescriptor.getOffset(
            nodePlacer.layerIndex,
            nodePlacer.edgeIndex
          )
        : { x: 0, y: 0 };

      const nodeHeight = node.height ?? 0;

      const centerPlusOffset = 0.5 * nodeHeight + offsetPoint.y;

    //   const adjustment =
    //     gridAlignment.alignToGrid(centerPlusOffset) - centerPlusOffset;

      const isSpecialNode =
        (isNodeTypeZero(node, layoutData) || hasNodeData(nodePlacer, node)) &&
        activeNodeMap.get(node.id);

      if (isSpecialNode) {
        maxSpecialHeight = Math.max(maxSpecialHeight, nodeHeight + adjustment);
      } else {
        maxNormalHeight = Math.max(maxNormalHeight, nodeHeight + adjustment);
      }
    }

    return {
      maxNormalNodeHeight: maxNormalHeight,
      maxSpecialNodeHeight: maxSpecialHeight,
      minimumLayerSpacing: minimumSpacing,
    };
  }
  private processNonFixedLayers(f: any, n: any, t: any, i: any) {
    const r = ArrayUtils.createNullArray(n.size());
    const l = ArrayUtils.createZeroFilledArray(n.size());
    const a = ArrayUtils.createZeroFilledArray(n.size());
    const u = ArrayUtils.createZeroFilledArray(n.size());
    const e = ArrayUtils.createZeroFilledArray(n.size());
    let h = -1;
    for (let o = 0; o < n.size(); o++) {
      const m = n.getLayer(o);
      a[o] = Math.max(
        f.getMinimumLayerHeight(t, i, m),
        this.calculateLayerSpacing(
          f,
          t,
          m,
          i,
          DataProviders.createConstantDataProvider(true),
          s
        ).$p
      );
      if ((m.type << 24) >> 24 === 0) {
        let c = Number.MAX_VALUE;
        let v = -Number.MAX_VALUE;
        const A = m.list.nodes();
        while (A.ok) {
          const b = A.node;
          const T = this.getNodeAlignment(i.getNodeData(b));
          u[o] = Math.max(u[o], T.top);
          e[o] = Math.max(e[o], T.bottom);
          if (f.isFixedNode(t, i, b, false)) {
            if (r[o] === null) {
              r[o] = b;
            }
            c = Math.min(c, t.getY(b));
            v = Math.max(v, t.getY(b) + t.getHeight(b));
          }
          A.next();
        }
        if (r[o] !== null) {
          if (a[o] > v - c) {
            const E = 0.5 * (a[o] - (v - c));
            c -= E;
            v += E;
          } else {
            a[o] = v - c;
          }
          l[o] = c;
          if (o > 0) {
            let C = 0;
            for (let _ = o - 1; _ > h; _--) {
              C += a[_] + u[_] + e[_];
            }
            let w = 20;
            for (let _ = o - 1; _ > h; _--) {
              if (h > -1) {
                w = (l[o] - u[o] - (l[h] + a[h] + e[h]) - C) / (o - h);
              }
              l[_] = l[_ + 1] - u[_ + 1] - e[_] - a[_] - w;
            }
          }
          h = o;
        }
      }
    }
    if (h > -1) {
      for (let o = h + 1; o < n.size(); o++) {
        l[o] = l[o - 1] + a[o - 1] + e[o - 1] + u[o] + 20;
      }
    }
    for (let o = 0; o < n.size(); o++) {
      const m = n.getLayer(o);
      if (r[o] !== null) {
        this.adjustVerticalPositionsForFixedNodes(
          f,
          t,
          i,
          o,
          r[o],
          m.list,
          a[o],
          l[o]
        );
      } else {
        this.assignDefaultVerticalPositions(f, t, i, o, m.list, a[o], l[o]);
      }
    }
  }
  assignLayerCoordinates(nodes: LineageNode[], n: any, t: any) {
    //  this.nodeLabelMapProvider = GraphDataManager.getNodeLabelMapProvider(f);
    if (this._fromSketchLayerAssignment) {
      let allNodesFixed = true;
      for (const node of nodes) {
        if (this.isFixedNode(node)) {
          allNodesFixed = false;
          break;
        }
      }
      if (allNodesFixed) {
        this.processNonFixedLayers(f, n, t, this);
      } else {
        this.assignLayerAndVerticalPositions(this, t, f, n);
      }
    } else {
      this.assignLayerAndVerticalPositions(this, t, f, n);
    }
  }
}
