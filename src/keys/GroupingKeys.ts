import { Insets, Dimension } from "../../geometry/index";
import { GraphObject, GraphBoolean } from "../../primitives/index";
import { NodeDpKey } from "./index";

export class GroupingKeys {
  // _$_bam: ['GroupingKeys', 'ZXA']
  static NODE_ID_DP_KEY: any = null;
  static PARENT_NODE_ID_DP_KEY: any = null;
  static GROUP_DP_KEY: any = null;
  static GROUP_NODE_INSETS_DP_KEY: any = null;
  static MINIMUM_NODE_SIZE_DP_KEY: any = null;
  static $class: any = this;

  constructor() {
    GroupingKeys.NODE_ID_DP_KEY = new NodeDpKey(
      GraphObject.$class,
      GroupingKeys.$class,
      "NodeIdDpKey"
    );
    GroupingKeys.PARENT_NODE_ID_DP_KEY = new NodeDpKey(
      GraphObject.$class,
      GroupingKeys.$class,
      "ParentNodeIdDpKey"
    );
    GroupingKeys.GROUP_DP_KEY = new NodeDpKey(
      GraphBoolean.$class,
      GroupingKeys.$class,
      "GroupDpKey"
    );
    GroupingKeys.GROUP_NODE_INSETS_DP_KEY = new NodeDpKey(
      Insets.$class,
      GroupingKeys.$class,
      "GroupNodeInsetsDpKey"
    );
    GroupingKeys.MINIMUM_NODE_SIZE_DP_KEY = new NodeDpKey(
      Dimension.$class,
      GroupingKeys.$class,
      "MinimumNodeSizeDpKey"
    );
  }
}
