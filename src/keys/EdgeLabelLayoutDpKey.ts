import { DpKeyBase } from "./DpKeyBase";

export class EdgeLabelLayoutDpKey extends DpKeyBase {
  // _$_gxl: ["IEdgeLabelLayoutDpKey", "EVA"]
  valueType: any = null; // Original variable name: valueType1

  constructor(valueType: any, declaringType: any, keyName: any) {
    super(valueType, declaringType, keyName);
    this.valueType = valueType;
  }
}
