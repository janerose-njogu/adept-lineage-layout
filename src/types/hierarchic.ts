export enum DfsTraversalState {
  WHITE = 0, // unvisited
  GRAY = 1, // visiting
  BLACK = 2, // visited
}
export enum BfsTraversalState {
  WHITE = "WHITE", // Unvisited
  GRAY = "GRAY", // Discovered but not fully processed
  BLACK = "BLACK", // Fully processed
}
/*
 * The WeightHeuristic (SequencerWeightHeuristic) determines how the algorithm prioritizes different graph elements during layout or routing.
 * This influences the order and placement of graph elements during the layout process.
 * Elements with higher weights might be placed earlier or in more important positions, leading to a more structured and organized graph.
 */
export type WeightHeuristic = "BARYCENTER" | "MEDIAN";

/*
 * Specify how layout elements are arranged, either vertically or horizontally.
 */
export type LayoutOrientation = "TB" | "LR";
