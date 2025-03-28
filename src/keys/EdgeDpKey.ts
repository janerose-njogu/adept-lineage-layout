import { DpKeyBase } from "./index";

export class EdgeDpKey extends DpKeyBase {
  // _$_dxl: ["EdgeDpKey", "BVA"]
  valueType: any = null;

  constructor(valueType: any, declaringType: any, keyName: any) {
    super(valueType, declaringType, keyName);
    this.valueType = valueType;
  }
}
