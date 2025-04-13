import {ComponentArrangementPolicy} from '../../types/index';
export class HierarchicLayout {
  private _compArrangementPolicy: ComponentArrangementPolicy;

  constructor() {
    this._compArrangementPolicy = 'COMPACT';
  }

  set arrangementPolicy(policy: ComponentArrangementPolicy) {
    this._compArrangementPolicy = policy;
  }

  get arrangementPolicy() {
    return this._compArrangementPolicy;
  }
}
