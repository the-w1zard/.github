import { useGlobalSubmittingState } from "./use-global-submitting-state.js";
import { useGlobalLoadingState } from "./use-global-loading-state.js";

export function useGlobalPendingState() {
    let isSubmitting = useGlobalSubmittingState() === "submitting";
    let isLoading = useGlobalLoadingState() === "loading";

    if (isLoading || isSubmitting) return "pending";
    return "idle";
}
