import { DpKeyBase } from "./index";

export class GraphDpKey extends DpKeyBase {
  // _$_exl: ["GraphDpKey", "CVA"]
  valueType: any = null;

  constructor(valueType: any, declaringType: any, keyName: any) {
    super(valueType, declaringType, keyName);
    this.valueType = valueType;
  }
}
