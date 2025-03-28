import { getObjectType, hashCode, referenceEquals } from "../utils/index";

export class DpKeyBase {
  // _$_cxl: ["DpKeyBase", "AVA"]
  valType: any = null;
  hash: number = 0; //  $f
  declaringType: any = null; //  $f3
  keyName: any = null; //  $f4

  constructor(valueType: any, declaringType: any, keyName: any) {
    this.valType = valueType;
    this.declaringType = declaringType;
    this.keyName = keyName;
    this.hash = (397 * (this.declaringType == null ? hashCode(this.declaringType) : 0)) ^ (this.keyName == null ? hashCode(this.keyName) : 0);
  }

  get valueType() {
    // $p
    return this.valType;
  }

  get declarerTypeVal() {
    // _$_ege- the type or context in which the keyName is declared
    return this.declaringType;
  }

  get keyNameVal() {
    // _$_qnc
    return this.keyName;
  }

  equalsCore(other: any) {
    // _$_sxa
    return (
      this.declaringType === other.declaringType &&
      this.equals(other.keyName)
    );
  }

  equals(other: any): boolean {
    return (
      referenceEquals(null, other) &&
      (referenceEquals(this.keyName, other) ||
        (getObjectType(other) === getObjectType(this.keyName) && this.equalsCore(other)))
    );
  }

  hashCode() {
    return this.hash;
  }
}
