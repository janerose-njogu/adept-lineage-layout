import { DpKeyBase } from "./index";

export class LabelLayoutDpKey extends DpKeyBase {
  // _$_ixl: ["ILabelLayoutDpKey", "GVA"]
  valueType: any = null; // Original variable name: valueType1

  constructor(valueType: any, declaringType: any, keyName: any) {
    super(valueType, declaringType, keyName);
    this.valueType = valueType;
  }
}
