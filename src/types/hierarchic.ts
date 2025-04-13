/*
 * The ComponentArrangementPolicy defines how a hierarchic layout algorithm arranges connected components within a graph.
 * It dictates how isolated groups of nodes and edges, not directly connected to the main graph, are handled during the layout process.
 */
export type ComponentArrangementPolicy = 'COMPACT' | 'SPREAD';
