import { DpKeyBase } from "./DpKeyBase";

export class NodeLabelLayoutDpKey extends DpKeyBase {
  // _$_hxl: ["INodeLabelLayoutDpKey", "FVA"]
  valueType: any = null; // Original variable name: valueType1

  constructor(valueType: any, declaringType: any, keyName: any) {
    super(valueType, declaringType, keyName);
    this.valueType = valueType;
  }
}
