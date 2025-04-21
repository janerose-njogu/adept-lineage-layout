/*
 * The ComponentArrangementPolicy defines how a hierarchic layout algorithm arranges connected components within a graph.
 * It dictates how isolated groups of nodes and edges, not directly connected to the main graph, are handled during the layout process.
 */
export type ComponentArrangementPolicy = "COMPACT" | "SPREAD";

/*
 * The LayeringStrategy arranges nodes into horizontal layers to maximize the number of edges pointing in the main layout direction.
 * Nodes within a layer are positioned vertically and ordered from left to right.
 * Layers are arranged vertically, usually starting with the lowest-numbered layer at the top
 */
export type LayeringStrategy = "TOPOLOGICAL" | "BFS" | "WEIGHTED" | "DEFAULT";

/*
 * The WeightHeuristic (SequencerWeightHeuristic) determines how the algorithm prioritizes different graph elements during layout or routing.
 * This influences the order and placement of graph elements during the layout process.
 * Elements with higher weights might be placed earlier or in more important positions, leading to a more structured and organized graph.
 */
export type WeightHeuristic = "BARYCENTER" | "MEDIAN";

/*
 * Previously LayerType. Specifies the different types of layers.
 * LABEL: A constant describing a layer consisting mainly of label nodes or dummy nodes.
 * NORMAL: A constant describing a normal layer consisting of nodes nodes.
 * LOWER_GROUP_CONNECTOR_NODES: Describes a layer below a group to store the connector proxies where edges connect to groups.
 * UPPER_GROUP_CONNECTOR_NODES: Describes a layer above a group to store the connector proxies where edges connect to groups
 * SOURCE_GROUP_NODES: A constant describing a layer consisting of source group nodes and dummy nodes.
 * TARGET_GROUP_NODES: A constant describing a layer consisting of target group nodes and dummy nodes.
 */
export type HierarchicalLayoutLayerType =
  | "LABEL"
  | "NORMAL"
  | "LOWER_GROUP_CONNECTOR_NODES"
  | "UPPER_GROUP_CONNECTOR_NODES"
  | "SOURCE_GROUP_NODES"
  | "TARGET_GROUP_NODES";
