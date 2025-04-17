export class Dfs {
  edgeMap: any = null;
  nodeCount: number = 0;
  edgeCount: number = 0;
  lookFurtherModeEnabled: boolean = false;
  directedModeEnabled: boolean = false;
  isCancelled: boolean = false;
  stateMap: any = null;
  traversalState: any = null;
  static WHITE: any = null;
  static GRAY: any = null;
  static BLACK: any = null;

  constructor() {
    this.traversalState = [0];
    this.directedModeEnabled = false;
    this.lookFurtherModeEnabled = true;
    this.isCancelled = false;
    Dfs.GRAY = new Object();
    Dfs.BLACK = new Object();
  }

  set directedMode(value: boolean) {
    // _$_qae
    this.directedModeEnabled = value;
  }

  set lookFurtherMode(value: boolean) {
    // _$_swe
    this.lookFurtherModeEnabled = value;
  }

  start(graph: any) {
    // _$_wkh
    if (graph.nodeCount !== 0) {
      this.startTraversal(graph, graph.firstNode);
    }
  }
  getNextEdge(t: any, f: any, n: any, state: any) {
    // W
    switch (state[0]) {
      case 0:
        return t.directedModeEnabled
          ? ((state[0] = 1), f.firstEdge)
          : null === (r = f.firstEdge)
          ? ((r = f.lastEdge), (state[0] = 3), r)
          : ((state[0] = 2), r);
      case 1:
        return n.nextEdge;
      case 2:
        var r;
        return (
          null === (r = n.nextEdge) && ((r = f.lastEdge), (state[0] = 3)), r
        );
      case 3:
        return n.previousEdge;
      default:
        throw new Error("Invalid state");
    }
  }

  traverseNode(graph: any, stack: any, node: any) {
    // p
    graph.traversalState[0] = 0;
    var currentNode = node;
    graph.stateMap.set(currentNode, Dfs.GRAY);
    graph.preVisit(currentNode, ++graph.nodeCount);
    var edge = this.getNextEdge(graph, currentNode, null, graph.traversalState);
    for (
      stack.push(currentNode, edge, graph.traversalState[0], graph.nodeCount);
      !stack.isEmpty() && !graph.isCancelled;

    ) {
      var currentEdge = stack.peekParent();
      for (
        graph.traversalState[0] = stack.peekDepth();
        null !== currentEdge;

      ) {
        var nextNode;
        if (graph.directedModeEnabled || !graph.edgeMap.getBoolean(currentEdge))
          graph.directedModeEnabled
            ? (nextNode = currentEdge.targetNode)
            : (graph.edgeMap.setBoolean(currentEdge, true),
              (nextNode = currentEdge.opposite(currentNode))),
            null === graph.stateMap.get(nextNode)
              ? (graph.preTraverse(currentEdge, nextNode, true),
                graph.stateMap.set(nextNode, Dfs.GRAY),
                (currentNode = nextNode),
                graph.preVisit(currentNode, ++graph.nodeCount),
                (graph.traversalState[0] = 0),
                (currentEdge = this.getNextEdge(
                  graph,
                  currentNode,
                  null,
                  graph.traversalState
                )),
                stack.push(
                  currentNode,
                  currentEdge,
                  graph.traversalState[0],
                  graph.nodeCount
                ))
              : (graph.preTraverse(currentEdge, nextNode, false),
                (currentEdge = this.getNextEdge(
                  graph,
                  currentNode,
                  currentEdge,
                  graph.traversalState
                )),
                stack.updateTop(currentEdge, graph.traversalState[0]));
        else
          (currentEdge = this.getNextEdge(
            graph,
            currentNode,
            currentEdge,
            graph.traversalState
          )),
            stack.updateTop(currentEdge, graph.traversalState[0]);
      }
      if (
        (graph.postVisit(currentNode, stack.peekState(), ++graph.edgeCount),
        graph.stateMap.set(currentNode, Dfs.BLACK),
        stack.pop(),
        !stack.isEmpty())
      ) {
        var previousEdge = stack.peekParent();
        graph.postTraverse(previousEdge, currentNode);
        currentNode = stack.peekNode();
        graph.traversalState[0] = stack.peekDepth();
        edge = this.getNextEdge(
          graph,
          currentNode,
          previousEdge,
          graph.traversalState
        );
        stack.updateTop(edge, graph.traversalState[0]);
      }
    }
  }
  startTraversal(graph: any, firstNode: any) {
    // _$_tzi - $fqb
    if (firstNode !== null) {
      this.stateMap = graph.createNodeMap();
      if (!this.directedModeEnabled) {
        this.edgeMap = graph.createEdgeMap();
      }
      this.nodeCount = 0;
      this.edgeCount = 0;

      const maxDepth = Math.min(60, graph.n + 3);
      const traversalStack = new Dfs.TraversalStack(maxDepth);

      try {
        this.traverseNode(this, traversalStack, firstNode);

        if (this.lookFurtherModeEnabled) {
          for (
            let cursor = graph.getNodeCursor();
            cursor.ok && !this.isCancelled;
            cursor.next()
          ) {
            const node = cursor.node;
            if (this.stateMap.get(node) === null) {
              this.lookFurther(node);
              this.traverseNode(this, traversalStack, node);
            }
          }
        }
      } finally {
        traversalStack.clear();
        // traversalStack = null;
        graph.disposeNodeMap(this.stateMap);
        this.stateMap = null;
        if (!this.directedModeEnabled) {
          graph.disposeEdgeMap(this.edgeMap);
          this.edgeMap = null;
        }
      }
    }
  }

  preVisit(_: any, __: any) {
    // _$_dbl
  }

  postVisit(_: any, __: any, ___: number) {
    // _$_rol
  }

  preTraverse(edge: any, currentNode: any, isBackEdge: boolean) {
    // _$_dpl
  }

  postTraverse(_: any, __: any) {
    // _$_gcl
  }

  lookFurther(_: any) {
    // _$_ojk
  }

  cancel() {
    // _$_ttj
    this.isCancelled = true;
  }

  static TraversalStack = class {
    currentDepth: number = -1;

    nodeStack: any = null;
    // $f
    parentStack: any = null;

    depthStack: any = null;

    stateStack: any = null;

    constructor(size: number) {
      this.stateStack = new Array(size);
      this.parentStack = new Array(size);
      this.depthStack = new Array(size);
      this.nodeStack = new Array(size);
    }

    isEmpty() {
      // "$m1!"
      return this.currentDepth < 0;
    }

    pop() {
      // "$m!"
      this.currentDepth--;
    }

    peekNode() {
      // "$m2!"
      return this.nodeStack[this.currentDepth];
    }

    peekParent() {
      // "$m3!"
      return this.parentStack[this.currentDepth];
    }

    peekDepth() {
      // "$m5!"
      return this.depthStack[this.currentDepth];
    }

    peekState() {
      // "$m4!"
      return this.stateStack[this.currentDepth];
    }

    push(node: any, parent: any, depth: number, state: any) {
      // "$m7!"
      this.currentDepth++;
      if (this.currentDepth === this.nodeStack.length) {
        const newSize = 2 * (this.currentDepth + 1);

        const newNodeStack = Array.from(this.nodeStack);
        this.nodeStack = newNodeStack;

        const newParentStack = Array.from(this.parentStack);
        this.parentStack = newParentStack;

        const newStateStack = Array.from(this.stateStack);
        this.stateStack = newStateStack;

        const newDepthStack = Array.from(this.depthStack);
        this.depthStack = newDepthStack;
      }

      this.nodeStack[this.currentDepth] = node;
      this.parentStack[this.currentDepth] = parent;
      this.depthStack[this.currentDepth] = depth;
      this.stateStack[this.currentDepth] = state;
    }

    updateTop(parent: any, depth: number) {
      // "$m6!"
      this.parentStack[this.currentDepth] = parent;
      this.depthStack[this.currentDepth] = depth;
    }

    clear() {
      this.currentDepth = -1;
    }
  };
}
