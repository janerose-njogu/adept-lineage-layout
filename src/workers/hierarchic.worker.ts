// worker thread actually executes the layout algorithm
import { Hierarchic } from "../layouts/hierarchic";

// Listen for messages from the main thread
self.onmessage = (event: MessageEvent) => {
  const { nodes, edges, layoutConfig } = event.data;

  // Run the layout algorithm
  const hierarchic = new Hierarchic(nodes, edges, layoutConfig);
  const positions = hierarchic.executeLayout();

  // Send node positions back to the main thread
  self.postMessage(positions);
};
