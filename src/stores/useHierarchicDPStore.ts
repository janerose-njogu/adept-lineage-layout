import { DataProvider } from "@/src/interfaces/hierarchic";
import { createStore } from "zustand/vanilla";

export const useHierarchicDPStore = createStore<DataProvider>((set, get) => ({
  graphData: {},
  setData: (key, value) =>
    set((state) => ({
      graphData: { ...state.graphData, [key]: value },
    })),
  getData: (key) => get().graphData[key],
}));
export default useHierarchicDPStore;
