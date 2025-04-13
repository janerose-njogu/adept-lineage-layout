/*
 * MultiStageLayout is not a specific layout algorithm itself, but rather a foundation for other layout algorithms.
 * MultiStageLayout simplifies and decomposes the input graph.
 * The simplified graph is then passed to the core layout algorithm, which performs the actual arrangement of nodes and edges.
 * The HierarchicalLayout and OrganicLayout algorithms are examples of layout algorithms that can be built upon the MultiStageLayout base class.
 */
import {ILayoutAlgorithm} from './interfaces';
import {LayoutStageBase} from './LayoutStageBase';

export class MultiStageLayout implements ILayoutAlgorithm {
  preStages: LayoutStageBase[] = [];
  postStages: LayoutStageBase[] = [];
  hideGroupsStageInstance: any = null;
  enableParallelEdgeRouter: boolean = true;
  enableSelfLoopRouter: boolean = true;
  enableComponentLayout: boolean = true;
  enableSubgraphLayout: boolean = false;
  enableLabeling: boolean = false;
  enableHideGroupsStage: boolean = true;
  static nodeSizeCheckedKey: any = null;

  constructor() {
    this.preStages = [];
    this.postStages = [];
    // this.hideGroupsStageInstance = new HideGroupsStage(null);
  }

  //   checkNodeSize(graph: any): void {
  //     // _$_qmk
  //     LayoutGraphUtils.validateNodeAndGroupBounds(graph);
  //   }

  prependStage(stage: LayoutStageBase): void {
    // _$_twh
    this.preStages.push(stage);
  }

  appendStage(stage: LayoutStageBase): void {
    // _$_zuh
    this.postStages.push(stage);
  }

  removeStage(stage: LayoutStageBase): void {
    // _$_avh
    this.preStages = this.preStages.filter(s => s !== stage);
    this.postStages = this.postStages.filter(s => s !== stage);
  }

  get hideGroupsStage(): any {
    // _$_dbf
    return this.hideGroupsStageInstance;
  }

  set hideGroupsStage(value: any) {
    // _$_dbf
    this.hideGroupsStageInstance = value;
  }

  get selfLoopRouterEnabled(): boolean {
    // _$_sdg
    return this.enableSelfLoopRouter;
  }

  set selfLoopRouterEnabled(value: boolean) {
    // _$_sdg
    this.enableSelfLoopRouter = value;
  }

  get labelingEnabled(): boolean {
    // _$_ebf
    return this.enableLabeling;
  }

  set labelingEnabled(value: boolean) {
    // _$_ebf
    this.enableLabeling = value;
  }

  get hideGroupsStageEnabled(): boolean {
    // _$_uhg
    return this.enableHideGroupsStage;
  }

  set hideGroupsStageEnabled(value: boolean) {
    // _$_uhg
    this.enableHideGroupsStage = value;
  }

  get componentLayoutEnabled(): boolean {
    // _$_thg
    return this.enableComponentLayout;
  }

  set componentLayoutEnabled(value: boolean) {
    // _$_thg
    this.enableComponentLayout = value;
  }

  get parallelEdgeRouterEnabled(): boolean {
    // _$_upg
    return this.enableParallelEdgeRouter;
  }

  set parallelEdgeRouterEnabled(value: boolean) {
    // _$_upg
    this.enableParallelEdgeRouter = value;
  }

  get subgraphLayoutEnabled(): boolean {
    // _$_tdg
    return this.enableSubgraphLayout;
  }

  set subgraphLayoutEnabled(value: boolean) {
    // _$_tdg
    this.enableSubgraphLayout = value;
  }

  disableAllStages(): void {
    // _$_dgh
    this.enableSubgraphLayout = false;
    this.enableParallelEdgeRouter = false;
    this.enableLabeling = false;
    this.enableSelfLoopRouter = false;
    this.enableComponentLayout = false;
    this.enableHideGroupsStage = false;
  }
  applyCoreLayoutStages(layout: any): LayoutStageBase {
    // Applies the core layout stages
    let currentStage: LayoutStageBase = new MultiStageLayout.CoreLayoutStage(
      layout,
    );
    for (let i = layout.postStages.size - 1; i >= 0; i--) {
      const stage = layout.postStages.get(i) as LayoutStageBase;
      stage.coreLayout = currentStage;
      currentStage = stage;
    }
    if (layout.enableHideGroupsStage) {
      layout.hideGroupsStageInstance.coreLayout = currentStage;
      currentStage = layout.hideGroupsStageInstance;
    }

    for (let i = 0; i < layout.preStages.size; i++) {
      const stage = layout.preStages.get(i) as LayoutStageBase;
      stage.coreLayout = currentStage;
      currentStage = stage;
    }
    return currentStage;
  }

  applyLayout(graph: any): void {
    // Applies the layout to the graph
    let wasDataProviderNull = false;
    if (graph.getDataProvider(MultiStageLayout.nodeSizeCheckedKey) === null) {
      //   this.checkNodeSize(graph);
      //   graph.addDataProvider(
      //     MultiStageLayout.nodeSizeCheckedKey,
      //     DataProviders.createConstantDataProvider(true),
      //   );
      wasDataProviderNull = true;
    }
    this.applyCoreLayoutStages(this).applyLayout(graph);
    if (wasDataProviderNull) {
      graph.removeDataProvider(MultiStageLayout.nodeSizeCheckedKey);
    }
  }

  static CoreLayoutStage = class extends LayoutStageBase {
    // T
    coreLayoutInstance: any = null;

    constructor(layout: any) {
      super(layout);
      this.coreLayoutInstance = layout;
    }

    applyLayout(graph: any): void {
      // Applies the core layout
      let wasDataProviderNull = false;
      if (graph.getDataProvider(MultiStageLayout.nodeSizeCheckedKey) === null) {
        this.coreLayoutInstance.checkNodeSize(graph);
        // graph.addDataProvider(
        //   MultiStageLayout.nodeSizeCheckedKey,
        //   DataProviders.createConstantDataProvider(true),
        // );
        wasDataProviderNull = true;
      }
      this.coreLayoutInstance.applyLayoutCore(graph);
      if (wasDataProviderNull) {
        graph.removeDataProvider(MultiStageLayout.nodeSizeCheckedKey);
      }
    }
  };
}
