import { DpKeyBase } from "./index";

export class NodeDpKey extends DpKeyBase {
  // _$_jxl: ["NodeDpKey", "HVA"]
  valueType: any = null;

  constructor(valueType: any, declaringType: any, keyName: any) {
    super(valueType, declaringType, keyName);
    this.valueType = valueType;
  }
}
