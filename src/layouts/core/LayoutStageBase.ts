import {ILayoutStage} from './interfaces';

export class LayoutStageBase implements ILayoutStage {
  // _$_ffn - ["LayoutStageBase", "BKC", wa(va("yfiles._R.C.GJC", "", null))]
  layout: any = null; // $f23

  constructor(layout: any) {
    this.layout = layout;
  }

  applyLayout(_: any) {
    //$kp
  }

  get coreLayout() {
    //$Wk
    return this.layout;
  }

  set coreLayout(coreLayout: any) {
    //$Wk
    this.layout = coreLayout;
  }

  applyLayoutCore(layoutData: any) {
    //_$_cqk
    if (this.layout !== null) {
      this.layout.applyLayout(layoutData);
    }
  }
}
