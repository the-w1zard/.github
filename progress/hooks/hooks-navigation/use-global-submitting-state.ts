import { useGlobalNavigationState } from "./use-global-navigation-state.js";

export function useGlobalSubmittingState() {
    let states = useGlobalNavigationState();
    if (states.includes("submitting")) return "submitting";
    return "idle";
}
