import { useGlobalNavigationState } from "./use-global-navigation-state.js";

export function useGlobalLoadingState() {
    let states = useGlobalNavigationState();
    if (states.includes("loading")) return "loading";
    return "idle";
}
