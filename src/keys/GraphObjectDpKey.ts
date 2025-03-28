import { DpKeyBase } from "./index";

export class GraphObjectDpKey extends DpKeyBase {
  // _$_fxl: ["GraphObjectDpKey", "DVA"]
  valueType: any = null; // Original variable name: valueType1

  constructor(valueType: any, declaringType: any, keyName: any) {
    super(valueType, declaringType, keyName);
    this.valueType = valueType;
  }
}
