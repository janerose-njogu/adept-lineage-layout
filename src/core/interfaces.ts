export interface ILayoutAlgorithm {
  applyLayout(stage: any): any;
}
export interface ILayoutStage extends ILayoutAlgorithm {
  get coreLayout(): any;
  set coreLayout(value: any);
}
